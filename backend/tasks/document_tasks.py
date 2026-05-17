import os
import json
import asyncio
import asyncpg
import redis
import time
import re
from .celery_app import celery_app
from rag_pipeline import rag_pipeline
from document_processor import process_document, get_document_summary
from services.monitor_service import MonitorService

from core.config import DATABASE_URL, REDIS_URL

def publish_progress(recipe_id, status, progress):
    """Publish progress to Redis Pub/Sub."""
    r = redis.from_url(REDIS_URL)
    message = json.dumps({"recipe_id": recipe_id, "status": status, "progress": progress})
    r.publish(f"progress_{recipe_id}", message)


def rule_based_extract(content: str) -> dict:
    # Clean unicode bullets
    content = re.sub(r'[\uf0a7\u2022\u25cf\u25e6\u2023\u2043]', ' ', content)
    # Fix glued text (e.g., taste1.Preheat -> taste\n1. Preheat)
    content = re.sub(r'([a-z])(\d+[\.\)]\s*[A-Z])', r'\1\n\2', content)
    
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    
    INGREDIENT_HEADERS = {"ingredients", "ingredient list", "you'll need", "you will need", "items"}
    STEP_HEADERS = {"instructions", "steps", "directions", "method", "cooking steps", "preparation", "procedure", "how to make", "process"}
    
    result = {
        "title": "", "description": "",
        "ingredients": [], "steps": [],
        "cuisine": "", "time_mins": 30,
        "spice": "", "diet": ""
    }
    
    current_section = None
    title_found = False
    buffer = []
    
    def flush_buffer():
        nonlocal buffer
        if not buffer: return ""
        text = " ".join(buffer).strip()
        buffer = []
        return text

    qty_symbols = r'[¾½¼⅓⅔\d]'
    for i, line in enumerate(lines):
        lower = line.lower().rstrip(':').strip()
        
        # 1. Title matching
        if not title_found and 3 < len(line) < 120 and not line.startswith("http"):
            if any(w in lower for w in ["recipe", "chicken", "paratha", "cream", "curry", "cake", "biryani", "rice", "ice"]):
                result["title"] = line
                title_found = True
                continue
            if i < 5 and len(line) > 5:
                result["title"] = line
                title_found = True
                continue

        # 2. Section detection (Check headers first)
        lower = line.lower().rstrip(':').strip()
        is_ing_header = lower in INGREDIENT_HEADERS or (len(lower) < 25 and "ingredient" in lower) or re.search(r'(ingredients|ingredient list)\s*(steps|instructions)?$', lower)
        is_step_header = lower in STEP_HEADERS or "instruction" in lower or (len(lower) < 25 and "direction" in lower)
        is_sub_header = re.match(r'^for the\b', lower) or lower in {
            "filling", "marinade", "sauce", "garnish", "topping", "toppings",
            "base", "crust", "stuffing", "spice mix", "spice blend", "syrup",
            "dough", "batter", "glaze", "coating", "sweet cream base", "strawberry addition"
        }

        if is_ing_header or is_sub_header:
            flush_buffer()
            current_section = "ingredients"
            if is_sub_header: result["ingredients"].append(line.rstrip(':') + ":")
            continue
        elif is_step_header:
            flush_buffer()
            current_section = "steps"
            continue

        # 2. Section-Aware Processing
        if current_section == "steps":
            # Split line by internal periods
            sub_sentences = re.split(r'(?<=[.!?])\s+', line)
            for s in sub_sentences:
                s = s.strip()
                if not s: continue
                buffer.append(s)
                
                ends_with_stop = any(s.endswith(term) for term in ['.', '!', ' Enjoy!'])
                is_next_marker = False
                if i + 1 < len(lines) and s == sub_sentences[-1]:
                    nl = lines[i+1].lower().rstrip(':').strip()
                    is_next_marker = re.match(r'^\d+[\.\)]?$', nl) or \
                                     any(h in nl for h in INGREDIENT_HEADERS) or \
                                     any(s in nl for s in STEP_HEADERS)
                
                if ends_with_stop or is_next_marker:
                    val = flush_buffer()
                    if len(val) > 4: result["steps"].append(val)
            continue

        # Ingredients / Limbo Section
        is_qty_only = re.match(r'^[\d½⅓¼⅔¾\.\/]+(\s+(large|small|pint|quart|cup|tbsp|tsp|g|kg|oz|lb|ml|l|can|pckg|clove|pinch|whole|cloves|teaspoon|tablespoon))?$', lower)
        is_numeric_start = re.match(r'^\d+[\s\.]', line) or re.match(r'^[½⅓¼⅔¾]', line)
        is_numbered_step = bool(re.match(r'^\d+[\.\)]\s*[A-Za-z]', line))

        if current_section == "ingredients":
            # Detect step transition (prose in ingredients or clearly numbered step)
            has_period = line.strip().endswith('.')
            is_long_prose = (len(line) > 50 or has_period) and not is_numeric_start and not is_qty_only and " of " not in lower
            
            if is_long_prose or is_numbered_step:
                val = flush_buffer()
                if len(val) > 2: result["ingredients"].append(val)
                current_section = "steps"
                # (Recurse logic by hand)
                sub_sentences = re.split(r'(?<=[.!?])\s+', line)
                for s in sub_sentences:
                    buffer.append(s.strip())
                    if any(s.strip().endswith(term) for term in ['.', '!', ' Enjoy!']):
                        val = flush_buffer()
                        if val: result["steps"].append(val)
            else:
                # Split combined ingredients like "eggs ¾ cup of sugar"
                parts = re.split(fr'(?<=[a-zA-Z]{{3}})\s+(?={qty_symbols})', line)
                for p in parts:
                    buffer.append(p.strip())
                    has_qty = any(re.match(r'^[\d½⅓¼⅔¾\.\/]+', b.lower()) for b in buffer)
                    has_name = any(re.search(r'[a-zA-Z]{3,}', b.lower()) and not re.match(r'^[\d½⅓¼⅔¾\.\/]+$', b.lower()) for b in buffer)
                    if (has_qty and has_name) or len(buffer) >= 2:
                        val = flush_buffer()
                        if len(val) > 2: result["ingredients"].append(val)
        
        elif current_section is None and (is_qty_only or is_numeric_start) and i > 0:
            current_section = "ingredients"
            buffer.append(line)

    # 5. Final flush
    final = flush_buffer()
    if final:
        if current_section == "ingredients": result["ingredients"].append(final)
        elif current_section == "steps": result["steps"].append(final)
    
    # Detect spice mentions
    spice_map = {
        r'\bvery\s*spic[y|e]\b|\bextremely\s*spic[y|e]\b|\bhot\b': 'Hot',
        r'\bspic[y|e]\b|\bmedium\b|\bmoderate\b': 'Medium',
        r'\bmild\b|\blight\b|\bgentle\b': 'Mild',
    }
    content_lower = content.lower()
    for pattern, level in spice_map.items():
        if re.search(pattern, content_lower):
            result["spice"] = level
            break
    
    # Detect diet type
    if any(w in content_lower for w in ["chicken", "beef", "lamb", "mutton", "fish", "prawn", "shrimp", "pork", "meat"]):
        result["diet"] = "Non-Veg"
    else:
        result["diet"] = "Veg"

    def clean_item(item):
        # Strip existing "Step 1.", "1. ", "1) ", etc.
        item = re.sub(r'^(step|phase|part)\s*\d+[\.\:\s]*', '', item, flags=re.I).strip()
        item = re.sub(r'^\d+[\.\)]\s*', '', item).strip()
        return item.rstrip(':').strip()

    # Format for DB storage (numbered lists)
    cleaned_ings = [clean_item(i) for i in result["ingredients"] if i.strip()]
    cleaned_steps = [clean_item(s) for s in result["steps"] if s.strip()]
    
    result["ingredients"] = "\n".join(f"{i+1}. {item}" for i, item in enumerate(cleaned_ings))
    result["steps"] = "\n".join(f"{i+1}. {step}" for i, step in enumerate(cleaned_steps))
    
    return result


def is_poor_extraction(extracted: dict) -> bool:
    """Check if rule-based extraction got too little data."""
    ingredient_count = len([l for l in extracted["ingredients"].split('\n') if l.strip()])
    step_count = len([l for l in extracted["steps"].split('\n') if l.strip()])
    return ingredient_count < 2 or step_count < 2


async def llm_based_extract(content: str) -> dict:
    """LLM-based extraction fallback for when rule-based parsing fails."""
    prompt = """You are an expert culinary assistant. From the recipe text provided below, extract and structure the information into a single JSON object.

CRITICAL FORMATTING RULES:
1. Extract EXACTLY these keys: "title", "ingredients", "steps", "cuisine", "time_mins", "spice", "diet".
2. "ingredients": string (a newline-separated list. Format each line as "- [quantity] [unit] [ingredient name]". DO NOT mix instructions here. Be exhaustive.)
3. "steps": string (a newline-separated list of instructions. Format each line as "1. [step details]", "2. [step details]". DO NOT include list of ingredients here. Separate actions clearly.)
4. "time_mins": integer (total preparation and cooking time in minutes. If missing, use 30)
5. "spice": string (must be exactly "Mild", "Medium", "Hot", or "")
6. "diet": string (must be exactly "Veg" or "Non-Veg", based on meat/seafood presence)

Return ONLY valid, parseable JSON. No preamble, no explanation, no markdown text blocks."""


    try:
        raw = await rag_pipeline.generate_response(prompt, [content], raw_prompt=True)
        raw = rag_pipeline.clean_response(raw)
        # Strip markdown code fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw.strip())
        raw = re.sub(r'\s*```$', '', raw.strip())
        data = json.loads(raw)
        return {
            "title": data.get("title", ""),
            "description": "",
            "ingredients": data.get("ingredients", ""),
            "steps": data.get("steps", ""),
            "cuisine": data.get("cuisine", ""),
            "time_mins": int(data.get("time_mins", 30)),
            "spice": data.get("spice", ""),
            "diet": data.get("diet", "Veg"),
        }
    except Exception as e:
        print(f"LLM extraction failed: {e}")
        return None


@celery_app.task(name="process_recipe_document")
def process_recipe_document(recipe_id, file_path, filename):
    """
    Background task to process a document:
    1. Extract text
    2. Rule-based extract recipe data (fast, no LLM timeout)
    3. Chunk and embed into Qdrant
    4. Update database
    """
    return asyncio.run(_async_process_recipe_document(recipe_id, file_path, filename))


async def _async_process_recipe_document(recipe_id, file_path, filename):
    print(f"--- TASK START: recipe_id={recipe_id}, file={filename} ---")
    start_time = time.perf_counter()
    try:
        print(f"Step 1: Text extraction for {file_path}")
        await MonitorService.log_event("processing", f"Started processing recipe {recipe_id}", task_id=recipe_id)
        publish_progress(recipe_id, "Extracting text...", 10)
        
        # 1. Extract text from document
        ts_extract = time.perf_counter()
        content, doc_type = process_document(file_path)
        print(f"Step 1 Result: extracted {len(content) if content else 0} chars, type={doc_type}")
        extract_duration = time.perf_counter() - ts_extract
        
        if not content:
            publish_progress(recipe_id, "Failed to extract text", 0)
            return False
            
        await MonitorService.log_event("processing", f"Text extraction completed in {extract_duration:.2f}s ({len(content)} chars)", task_id=recipe_id)
        # 2. Check if this is a recipe or a general KnowledgeBase document
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            row = await conn.fetchrow("SELECT diet_type FROM recipes WHERE id=$1::uuid", recipe_id)
            is_knowledge = row and row['diet_type'] == 'KnowledgeBase'
        finally:
            await conn.close()

        extracted = {
            "title": filename,
            "ingredients": "",
            "steps": "",
            "cuisine": "",
            "time_mins": 30,
            "spice": "",
            "diet": ""
        }

        if is_knowledge:
            print(f"Recipe {recipe_id} is KnowledgeBase. Skipping structured recipe parsing (ingredients/steps) for speed.")
            await MonitorService.log_event("processing", "Document detected as Knowledge Base. Prioritizing for AI search, skipping recipe structure parsing.", task_id=recipe_id)
        else:
            # 2. Rule-based extraction (fast, no LLM needed)
            ts_parse = time.perf_counter()
            extracted = rule_based_extract(content)
            parse_duration = time.perf_counter() - ts_parse
            
            ingredient_count = len([l for l in extracted["ingredients"].split('\n') if l.strip()])
            step_count = len([l for l in extracted["steps"].split('\n') if l.strip()])

            # Fallback to LLM if rule-based got too little
            if is_poor_extraction(extracted):
                print(f"Step 2: Poor extraction for {recipe_id}. Falling back to LLM...")
                await MonitorService.log_event(
                    "chunking",
                    f"Rule-based got only {ingredient_count} ingredients, {step_count} steps — falling back to LLM",
                    task_id=recipe_id
                )
                publish_progress(recipe_id, "Parsing with AI (this may take a minute)...", 40)
                llm_result = await llm_based_extract(content)
                if llm_result:
                    # Merge: keep rule-based title if LLM didn't get one
                    if not llm_result["title"] and extracted["title"]:
                        llm_result["title"] = extracted["title"]
                    extracted = llm_result
                    ingredient_count = len([l for l in extracted["ingredients"].split('\n') if l.strip()])
                    step_count = len([l for l in extracted["steps"].split('\n') if l.strip()])

            await MonitorService.log_event(
                "chunking",
                f"Parsing completed in {parse_duration:.3f}s: {ingredient_count} ingredients, {step_count} steps",
                task_id=recipe_id
            )
        publish_progress(recipe_id, f"Parsed {ingredient_count} ingredients, {step_count} steps. Embedding...", 50)
        
        # 3. Chunk & embed into Qdrant
        ts_rag = time.perf_counter()
        chunks = rag_pipeline.chunk_text(content)
        print(f"Step 3: Chunking complete. {len(chunks)} chunks.")
        await MonitorService.log_event("chunking", f"Split text into {len(chunks)} chunks", task_id=recipe_id)
        
        metadata = {"recipe_id": recipe_id, "doc_type": doc_type, "filename": filename}
        print("Step 3: Starting store_chunks...")
        success = await rag_pipeline.store_chunks(recipe_id, chunks, metadata)
        print(f"Step 3 Result: store_chunks returned {success}")
        rag_duration = time.perf_counter() - ts_rag
        
        if not success:
            await MonitorService.log_event("error", "Embedding failed or Qdrant unavailable", task_id=recipe_id, level="ERROR")
            publish_progress(recipe_id, "Embedding failed", 0)
            return False
            
        await MonitorService.log_event("embedding", f"Successfully embedded {len(chunks)} chunks in {rag_duration:.2f}s", task_id=recipe_id)
        publish_progress(recipe_id, "Updating database...", 90)
        
        # 4. Update database
        summary = get_document_summary(content)
        title = extracted.get("title", "")

        conn = await asyncpg.connect(DATABASE_URL)
        try:
            rel_path = file_path.split("uploads/")[-1] if "uploads/" in file_path else file_path
            
            await conn.execute("""
                INSERT INTO documents (file_path, file_type, content_preview)
                VALUES ($1,$2,$3)
            """, rel_path, doc_type, summary[:500])
            
            await conn.execute("""
                UPDATE recipes SET 
                    title = COALESCE(NULLIF(title, ''), NULLIF($1, '')),
                    document_path = $2,
                    ingredients = $3,
                    steps = $4,
                    description = $5,
                    cuisine = COALESCE(NULLIF($6, ''), cuisine),
                    time_mins = $7,
                    diet_type = CASE 
                        WHEN diet_type = 'KnowledgeBase' THEN 'KnowledgeBase'
                        ELSE COALESCE(NULLIF($8, ''), diet_type)
                    END,
                    spice_level = COALESCE(NULLIF($9, ''), spice_level)
                WHERE id = $10::uuid
            """, title, rel_path,
                extracted["ingredients"], extracted["steps"], summary,
                extracted["cuisine"], extracted["time_mins"],
                extracted["diet"], extracted["spice"],
                recipe_id)
        finally:
            await conn.close()
                
        total_duration = time.perf_counter() - start_time
        publish_progress(recipe_id, "Completed successfully", 100)
        await MonitorService.log_event("processing", f"Successfully completed in {total_duration:.2f}s", task_id=recipe_id)
        return True
        
    except Exception as e:
        import traceback
        err_msg = f"Error in process_recipe_document: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        await MonitorService.log_event("error", f"Critical failure: {str(e)}", task_id=recipe_id, level="ERROR")
        publish_progress(recipe_id, f"Error: {str(e)}", 0)
        return False

