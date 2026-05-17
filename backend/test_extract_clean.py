import re

def rule_based_extract(content: str) -> dict:
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
        is_ing_header = lower in INGREDIENT_HEADERS or (len(lower) < 25 and "ingredient" in lower)
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
        is_numbered_step = bool(re.match(r'^\d+[\.\)]\s+[A-Za-z]', line))

        if current_section == "ingredients":
            # Detect step transition (prose in ingredients or clearly numbered step)
            has_period = line.strip().endswith('.')
            is_long_prose = (len(line) > 50 or has_period) and not is_numeric_start and not is_qty_only and " of " not in lower
            
            if is_long_prose or is_numbered_step:
                flush_buffer()
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

text = """Simple, easy and delicious. This recipe has instructions for both air-frying and oven baking. Crisp on
the outside and tender on the inside, Air-Fryer French Fries make a great side dish or snack.
Mix things up by using different potatoes and seasonings. Russets will give you a fluffier inside due
to their low-moisture content, while reds will have a delicate sweetness and creamy texture. Have fun!
VT Fresh is funded in part by the USDA’s Supplemental Nutrition Assistance Program (SNAP). USDA is an equal opportunity provider and employer.
Enter to win a $100 gift card! Visit vtfoodbank.org/vtfresh for info on testing recipes and more!
Ingredients Steps
 4 medium potatoes
 2 Tbsp vegetable oil
 salt & pepper, to taste
1. Preheat air-fryer to 400°F or oven to 425°.
2. Wash potatoes well and pat dry.
3. To make a French fry cut slice potatoes length wise to create 1/2-inch planks.
Lay planks flat and cut into 1/2-inch strips. Rinse, drain thoroughly and pat dry.
4. In medium bowl toss potato strips in vegetable oil, season with salt & pepper.
5. Dump potato strips into air-fryer basket. For oven, spread strips of potatoes
onto baking sheet in a single layer, do not overcrowd.
6. Air-fry for 25 minutes, toss potatoes every 5 minutes to evenly brown potatoes.
Potatoes will be golden brown and tender when done. For oven, bake for 35-40
minutes, turn frequently for even browning."""

out = rule_based_extract(text)
print("INGREDIENTS:", len(out["ingredients"].split('\\n')))
print(out["ingredients"])
print("STEPS:", len(out["steps"].split('\\n')))
print(out["steps"])
