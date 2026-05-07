"""Debug script to test RAG pipeline and document processing."""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from rag_pipeline import rag_pipeline
from document_processor import process_document, get_document_summary

def test_rag_components():
    """Test individual RAG components."""
    print("=" * 80)
    print("RAG PIPELINE DEBUG TEST")
    print("=" * 80)
    
    # Test 1: Check Qdrant connection
    print("\n[TEST 1] Qdrant Connection")
    print("-" * 80)
    if rag_pipeline.qdrant_client:
        print("✓ Qdrant client connected")
        try:
            collections = rag_pipeline.qdrant_client.get_collections()
            print(f"✓ Collections: {[c.name for c in collections.collections]}")
        except Exception as e:
            print(f"✗ Error getting collections: {e}")
    else:
        print("✗ Qdrant client not initialized")
    
    # Test 2: Check embeddings
    print("\n[TEST 2] Embeddings Model")
    print("-" * 80)
    if rag_pipeline.embedder:
        print("✓ Embedder loaded successfully")
        try:
            test_embedding = rag_pipeline.embed_text("test recipe")
            if test_embedding:
                print(f"✓ Embedding generated: {len(test_embedding)} dimensions")
            else:
                print("✗ Failed to generate embedding")
        except Exception as e:
            print(f"✗ Error: {e}")
    else:
        print("✗ Embedder not initialized")
    
    # Test 3: Check Ollama connection
    print("\n[TEST 3] Ollama Connection")
    print("-" * 80)
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"✓ Ollama connected. Available models: {[m['name'] for m in models]}")
        else:
            print(f"✗ Ollama returned status {response.status_code}")
    except Exception as e:
        print(f"✗ Ollama error: {e}")
    
    # Test 4: Test LLM response
    print("\n[TEST 4] LLM Generation")
    print("-" * 80)
    try:
        test_prompt = "List 3 ingredients for chicken biryani."
        response = rag_pipeline.generate_response(test_prompt, [])
        print(f"✓ LLM Response:\n{response[:200]}...")
    except Exception as e:
        print(f"✗ LLM error: {e}")
    
    # Test 5: Test document processing
    print("\n[TEST 5] Document Processing")
    print("-" * 80)
    
    # Create a sample recipe document
    sample_doc = """CHICKEN BIRYANI RECIPE

Ingredients:
- 500g chicken
- 2 cups basmati rice
- 4 tbsp ghee
- 2 onions, sliced
- 1 inch ginger
- 4 green chilies
- 1/2 cup yogurt
- Salt to taste
- 1 tsp biryani masala

Steps:
1. Marinate chicken in yogurt and spices for 30 minutes
2. Cook rice until 70% done
3. Heat ghee in heavy bottomed pot
4. Add onions and fry until golden
5. Add marinated chicken and cook for 5 minutes
6. Layer with partially cooked rice
7. Cover and cook on high heat for 2 minutes
8. Reduce heat to low and cook for 45 minutes
9. Let it rest for 5 minutes before serving
"""
    
    sample_file = Path("uploads/test_recipe.txt")
    sample_file.parent.mkdir(parents=True, exist_ok=True)
    sample_file.write_text(sample_doc)
    
    try:
        content, doc_type = process_document(str(sample_file))
        print(f"✓ Document processed: {doc_type}")
        print(f"✓ Content length: {len(content)} characters")
        print(f"✓ Content preview: {content[:100]}...")
        
        # Test 6: Chunk text
        print("\n[TEST 6] Text Chunking")
        print("-" * 80)
        chunks = rag_pipeline.chunk_text(content)
        print(f"✓ Text chunked into {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:2]):
            print(f"  Chunk {i+1}: {len(chunk)} chars - {chunk[:50]}...")
        
        # Test 7: Store chunks
        print("\n[TEST 7] Storing Chunks in Qdrant")
        print("-" * 80)
        test_recipe_id = "test-recipe-123"
        metadata = {"recipe_name": "Chicken Biryani", "doc_type": "test"}
        success = rag_pipeline.store_chunks(test_recipe_id, chunks, metadata)
        if success:
            print(f"✓ Chunks stored successfully")
        else:
            print(f"✗ Failed to store chunks")
        
        # Test 8: Retrieve context
        print("\n[TEST 8] Retrieving Context")
        print("-" * 80)
        query = "What are the ingredients for biryani?"
        context = rag_pipeline.retrieve_context(query, top_k=3)
        if context:
            print(f"✓ Retrieved {len(context)} context items")
            for i, item in enumerate(context[:2]):
                print(f"  Item {i+1} (score: {item['score']:.3f}): {item['text'][:60]}...")
        else:
            print("✗ No context retrieved")
        
        # Test 9: Extract ingredients/steps with LLM
        print("\n[TEST 9] LLM-based Ingredient/Step Extraction")
        print("-" * 80)
        prompt = "Extract the ingredients and the cooking steps from the document. Format your response exactly with two headings: 'Ingredients:' and 'Steps:'. Provide the lists below them. Do not include introductory text."
        extracted = rag_pipeline.generate_response(prompt, [content[:4000]], model="llama3.2")
        print(f"Extracted Response:\n{extracted}")
        
        # Try parsing
        ingredients_text, steps_text = "", ""
        if "Steps:" in extracted:
            parts = extracted.split("Steps:")
            ingredients_text = parts[0].replace("Ingredients:", "").strip()
            steps_text = parts[1].strip()
            print(f"\n✓ Parsed successfully!")
            print(f"  Ingredients ({len(ingredients_text)} chars): {ingredients_text[:60]}...")
            print(f"  Steps ({len(steps_text)} chars): {steps_text[:60]}...")
        else:
            print(f"✗ Could not parse response - no 'Steps:' found")
            print(f"  Response contains: {list(set(extracted.split()[:20]))}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if sample_file.exists():
            sample_file.unlink()
    
    print("\n" + "=" * 80)
    print("DEBUG TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    test_rag_components()
