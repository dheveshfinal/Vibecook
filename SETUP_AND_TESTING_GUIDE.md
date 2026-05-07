# 🚀 Setup & Testing Guide - AI Chatbot

Quick step-by-step guide to get the chatbot running and test it.

---

## ✅ Pre-Requisites

Ensure you have installed:
- Node.js 16+ (for frontend)
- Python 3.8+ (for backend)
- Docker (for Qdrant)
- Ollama (download from https://ollama.ai)

---

## 📋 Setup Steps

### Step 1: Start Ollama

```bash
# Open terminal and start Ollama
ollama serve

# In another terminal, pull the model (only first time)
ollama pull llama3.2:latest

# Expected output:
# => loading model weights
# => success
```

✅ Ollama should be running at http://localhost:11434

---

### Step 2: Start Qdrant

```bash
# Using Docker
docker run -p 6333:6333 qdrant/qdrant

# OR if you have Qdrant installed locally:
qdrant

# Expected output:
# Listening on http://localhost:6333
```

✅ Qdrant should be running at http://localhost:6333

---

### Step 3: Start FastAPI Backend

```bash
# Navigate to backend folder
cd backend

# Create Python environment (if not exists)
python -m venv venv
source venv/Scripts/activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Make sure your .env file is set:
# QDRANT_URL=http://localhost:6333
# OLLAMA_URL=http://localhost:11434

# Start backend
python main.py

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

✅ Backend should be running at http://localhost:8000

---

### Step 4: Start Vite Frontend

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Check .env has correct API URL:
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev

# Expected output:
# VITE v5.0.0 ready in 100 ms
# ➜ Local: http://localhost:5173/
```

✅ Frontend should be running at http://localhost:5173

---

## 🧪 Testing Steps

### Test 1: Verify All Services Running

```bash
# Test Ollama
curl http://localhost:11434/api/tags
# Should return: {"models":[{"name":"llama3.2:latest",...}]}

# Test Qdrant
curl http://localhost:6333/health
# Should return: {"status":"ok"}

# Test FastAPI
curl http://localhost:8000/api/v1/health
# Should return: {"status":"ok"}

# All should return within 1 second
```

✅ All services should respond

---

### Test 2: Index a Recipe (Backend)

Before chatting, you need recipe data in Qdrant.

**Option A: Manual Python Script**

```python
# Create: test_index_recipe.py

from backend.rag_pipeline import rag_pipeline

# Sample recipe content
recipe_content = """
Pasta Carbonara

Ingredients:
- 400g spaghetti
- 200g bacon or pancetta
- 3 large eggs
- 100g Parmesan cheese
- Salt and black pepper
- Fresh parsley

Instructions:
1. Bring a large pot of salted water to a boil
2. Add spaghetti and cook until al dente (8-10 minutes)
3. Cut bacon into small pieces and fry until crispy
4. Beat eggs in a bowl with grated Parmesan cheese
5. Drain pasta, reserving 1 cup pasta water
6. Mix hot pasta with bacon (off heat)
7. Add egg mixture quickly, stirring constantly
8. Add pasta water as needed for creamy sauce
9. Season with salt and pepper
10. Serve immediately with extra Parmesan

Cooking time: 20 minutes
Serves: 4 people
Difficulty: Easy
"""

# Index the recipe
chunks = rag_pipeline.chunk_text(recipe_content)
success = rag_pipeline.store_chunks(
    doc_id="pasta-carbonara-001",
    chunks=chunks,
    metadata={
        "recipe_title": "Pasta Carbonara",
        "cuisine": "Italian",
        "spice_level": "None",
        "diet_type": "Non-Veg",
        "cooking_time": 20
    }
)

print(f"✅ Recipe indexed: {success}")
print(f"✅ Stored {len(chunks)} chunks")
```

Run it:
```bash
cd backend
python test_index_recipe.py

# Expected output:
# ✅ Recipe indexed: True
# ✅ Stored 3 chunks
```

**Option B: Via API Endpoint** (Create this first if needed)

```python
# In backend/api/v1/endpoints/recipes.py
# Add this endpoint if you want to index via API

@router.post("/index")
async def index_recipe(recipe_id: str, content: str, title: str):
    """Index recipe for chat context."""
    from rag_pipeline import rag_pipeline
    
    chunks = rag_pipeline.chunk_text(content)
    success = rag_pipeline.store_chunks(
        doc_id=recipe_id,
        chunks=chunks,
        metadata={"recipe_title": title}
    )
    return {"indexed": success, "chunks": len(chunks)}
```

---

### Test 3: Test API Endpoint Directly

```bash
# Test the /recipe endpoint

curl -X POST http://localhost:8000/api/v1/chat/recipe \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How long to cook the pasta?",
    "recipe_id": "pasta-carbonara-001",
    "recipe_title": "Pasta Carbonara"
  }'

# Expected response (2-10 seconds):
# {
#   "response": "According to the recipe, the spaghetti should be cooked until al dente, which is 8-10 minutes...",
#   "context": [
#     {
#       "text": "Add spaghetti and cook until al dente (8-10 minutes)",
#       "score": 0.95,
#       "metadata": {...}
#     }
#   ],
#   "sources": ["Pasta Carbonara"]
# }
```

✅ API should respond with AI answer

---

### Test 4: Test Frontend Chat UI

1. **Open browser** → http://localhost:5173
2. **Navigate to recipe page**
   - Click on any recipe or create one
   - Should see RecipeDetailsView page
3. **Look for chat icon**
   - Bottom-right corner (56x56px)
   - Purple gradient button
   - Says "💬" (chat bubble icon)
4. **Click chat icon**
   - Chat panel should slide up from bottom
   - Background should blur and darken
   - Icon should change to "✕" (close)
5. **Type a message**
   - "How long to cook the pasta?"
6. **Send message**
   - Click send button or press Enter
   - User message appears in purple bubble
   - Loading indicator appears (three dots)
7. **Wait for response**
   - Loading disappears (5-15 seconds)
   - AI response appears in white bubble
   - Auto-scrolls to latest message
8. **Try more messages**
   - "What are the main ingredients?"
   - "Can I use different cheese?"
   - All should get relevant responses
9. **Test keyboard**
   - Shift+Enter → New line in text
   - Enter → Send message
10. **Close chat**
    - Click close button (X)
    - Or click outside chat
    - Chat slides down
    - Background becomes normal
    - Page is clickable again
11. **Refresh page**
    - Chat history should reset
    - Chat should be empty when reopened

✅ Chat UI should work smoothly

---

## 🐛 Troubleshooting

### Issue: "Failed to get response from AI"

**Check 1: Ollama running?**
```bash
curl http://localhost:11434/api/tags
# If error: Start Ollama → ollama serve
```

**Check 2: Qdrant running?**
```bash
curl http://localhost:6333/health
# If error: Start Qdrant → docker run -p 6333:6333 qdrant/qdrant
```

**Check 3: Backend running?**
```bash
curl http://localhost:8000/api/v1/health
# If error: Start backend → cd backend && python main.py
```

**Check 4: Recipe indexed?**
```python
# In Python console
from backend.qdrant_client import QdrantClient
client = QdrantClient("http://localhost:6333")
collections = client.get_collections()
print([c.name for c in collections.collections])
# Should include: "recipes_documents"
```

---

### Issue: Chat icon not visible

**Check 1: Frontend running?**
```bash
# Open http://localhost:5173
# Should see frontend page
```

**Check 2: Component imported?**
```typescript
// In RecipeDetailView.tsx, should have:
import { RecipeChat } from "../../../chat/components/recipeChat";
// and
<RecipeChat recipeId={...} recipeTitle={...} />
```

**Check 3: Browser console errors?**
- Open DevTools (F12) → Console
- Should show no errors
- Check Network tab for failed requests

---

### Issue: "Connection refused" in console

**Check API URL:**
```javascript
// In browser console:
console.log(import.meta.env.VITE_API_BASE_URL)
// Should print: http://localhost:8000
```

**Update .env if needed:**
```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

Restart frontend: `npm run dev`

---

## 📊 Performance Checklist

| Metric | Expected | Actual |
|--------|----------|--------|
| Chat icon appears | Immediate | ___ |
| Panel opens | < 300ms | ___ |
| API response | 5-15s | ___ |
| Messages display | < 100ms | ___ |
| Auto-scroll | < 50ms | ___ |
| Close animation | < 300ms | ___ |

---

## ✨ Demo Flow

### Complete Demo Walkthrough

1. **Start all services** (as per Setup Steps 1-4)

2. **Index a recipe**
   ```bash
   python test_index_recipe.py
   ```

3. **Open browser**
   ```
   http://localhost:5173
   ```

4. **Navigate to recipe**
   - Find or create Pasta Carbonara recipe
   - Open recipe details

5. **Test chat**
   ```
   Click icon → Type "How long to cook?" → Send
   Expected: "Cook for 8-10 minutes..."
   
   Click icon again → Type "What cheese?" → Send
   Expected: "Use Parmesan cheese..."
   
   Click icon again → Type "Make vegetarian" → Send
   Expected: "You can replace bacon with mushrooms..."
   ```

6. **Test features**
   - Shift+Enter for new line
   - Loading indicator while waiting
   - Timestamp on messages
   - Auto-scroll to latest
   - Click close/outside to close
   - Refresh page - chat resets

7. **All working?** ✅ You're done!

---

## 📈 Scale Testing (Optional)

### Multiple Messages

```javascript
// Test handling many messages
for (let i = 0; i < 10; i++) {
  await sendMessage(`Message ${i+1}`);
}
// Should handle smoothly without performance degradation
```

### Long Messages

```javascript
// Test with long message
const longMsg = "How do I... " + "xyz ".repeat(100);
await sendMessage(longMsg);
// Should send and display correctly
```

### Multiple Recipes

Index multiple recipes:
```bash
# Index 3 different recipes
python test_index_recipe.py --recipe pasta
python test_index_recipe.py --recipe pizza
python test_index_recipe.py --recipe salad

# Then open each and chat
# Each should get correct context
```

---

## 🎬 Record a Demo

If you want to record a demo video:

1. Start all services
2. Open OBS or screen recorder
3. Open browser with recipe page
4. Click chat icon
5. Ask questions and show responses
6. Highlight key features:
   - Smooth animations
   - Real context from Qdrant
   - AI responses from Ollama
   - Auto-scroll behavior
   - Close functionality

---

## ✅ Final Verification Checklist

- [ ] Ollama running (port 11434)
- [ ] Qdrant running (port 6333)
- [ ] Backend running (port 8000)
- [ ] Frontend running (port 5173)
- [ ] Recipe indexed in Qdrant
- [ ] Chat icon visible
- [ ] Chat opens with blur effect
- [ ] Messages send to backend
- [ ] AI responds with context
- [ ] Messages display correctly
- [ ] Loading indicator shows
- [ ] Auto-scroll works
- [ ] Close functionality works
- [ ] No console errors
- [ ] No network errors

---

## 🚀 Production Deployment

When deploying to production:

1. **Update URLs**
   ```env
   # Frontend
   VITE_API_BASE_URL=https://api.yourdomain.com
   
   # Backend
   QDRANT_URL=https://qdrant.yourdomain.com
   OLLAMA_URL=https://ollama.yourdomain.com
   ```

2. **Enable CORS**
   ```python
   # In backend main.py
   allow_origins=["https://yourdomain.com"]
   ```

3. **Add rate limiting**
   ```python
   # To prevent abuse
   @limiter.limit("20/minute")
   async def chat_recipe(body: ChatRequest):
       ...
   ```

4. **Use cloud LLM** (optional)
   ```python
   # Instead of local Ollama
   OLLAMA_URL=https://api.ollama.cloud
   OLLAMA_API_KEY=sk_live_...
   ```

---

## 📞 Getting Help

1. **Check browser console** (F12 → Console tab)
2. **Check backend logs** (terminal where you ran `python main.py`)
3. **Test API directly** (use curl commands from troubleshooting)
4. **Review documentation** (CHATBOT_INTEGRATION_GUIDE.md)
5. **Check network requests** (DevTools → Network tab)

---

**Happy testing! 🎉**

You're all set to test the chatbot. If everything works, you're ready for production deployment!
