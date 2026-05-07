# Chatbot Quick Reference & Code Examples

## 📖 Quick Start

### 1. Frontend Already Integrated ✅
RecipeDetailView now includes RecipeChat automatically:
```typescript
// RecipeDetailView.tsx - Already added!
<RecipeChat
    recipeId={recipe.db_id || recipe.title || "unknown"}
    recipeTitle={recipe.title || "Recipe"}
/>
```

### 2. Backend Requirements

Ensure these services are running:
```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Terminal 3: FastAPI Backend
cd backend && python main.py
```

### 3. Test the Chatbot
1. Open RecipeDetailsView page
2. Click floating chat icon (bottom-right)
3. Ask a question about the recipe
4. AI responds with context from Qdrant

---

## 💻 Code Examples

### Example 1: Manual API Call (Without React)

```typescript
// Direct HTTP request to chat endpoint
const response = await fetch("http://localhost:8000/api/v1/chat/recipe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "How do I make this recipe vegetarian?",
    recipe_id: "uuid-123",
    recipe_title: "Chicken Pasta"
  })
});

const data = await response.json();
console.log(data.response);     // AI response
console.log(data.context);      // Retrieved chunks
console.log(data.sources);      // Sources used
```

### Example 2: Using the Chat Service

```typescript
import chatService from "src/chat/services/chatService";

// Simple message
const response = await chatService.sendMessage(
  "How long to cook?",
  "recipe-uuid",
  "Pasta Carbonara"
);

console.log(response.response);  // "Cook for..."
```

### Example 3: Using the useChat Hook

```typescript
import { useChat } from "src/chat/hooks/useChat";

function MyComponent() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    messagesEndRef
  } = useChat({
    recipeId: "recipe-123",
    recipeTitle: "Pasta"
  });

  const handleSendMessage = async () => {
    await sendMessage("How do I make this less spicy?");
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      <textarea onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          handleSendMessage();
        }
      }} />
      <div ref={messagesEndRef} />
    </div>
  );
}
```

### Example 4: Backend Endpoint Implementation

```python
# backend/api/v1/endpoints/chat.py

from fastapi import APIRouter, HTTPException
from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/recipe", response_model=ChatResponse)
async def chat_recipe(body: ChatRequest):
    """
    Chat with AI about a specific recipe.
    
    Request:
    {
        "message": "How long to cook?",
        "recipe_id": "uuid-123",
        "recipe_title": "Pasta Carbonara"
    }
    
    Response:
    {
        "response": "Cook for 8-10 minutes...",
        "context": [
            {
                "text": "Cooking time: 8-10 minutes",
                "score": 0.95,
                "metadata": {...}
            }
        ],
        "sources": ["Pasta Carbonara"]
    }
    """
    try:
        if not body.message.strip():
            raise HTTPException(400, "Message cannot be empty")
        
        response = await chat_service.get_response(
            message=body.message,
            recipe_id=body.recipe_id,
            recipe_title=body.recipe_title
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
```

### Example 5: Storing Recipe in Qdrant

```python
# backend/main.py or tasks/document_tasks.py

from rag_pipeline import rag_pipeline
from document_processor import process_document

async def index_recipe(recipe_id: str, recipe_content: str, recipe_title: str):
    """Store recipe content in Qdrant vector database."""
    
    # 1. Process document (extract text)
    content = recipe_content
    
    # 2. Chunk text
    chunks = rag_pipeline.chunk_text(content, chunk_size=500, overlap=100)
    
    # 3. Store chunks with embeddings in Qdrant
    success = rag_pipeline.store_chunks(
        doc_id=recipe_id,
        chunks=chunks,
        metadata={
            "recipe_title": recipe_title,
            "recipe_id": recipe_id,
            "cuisine": recipe.cuisine,
            "spice_level": recipe.spice_level,
            "diet_type": recipe.diet_type
        }
    )
    
    if success:
        print(f"✅ Indexed {recipe_title} ({len(chunks)} chunks)")
    else:
        print(f"❌ Failed to index {recipe_title}")
```

### Example 6: RAG Pipeline - Retrieve & Generate

```python
# backend/rag_pipeline.py

class RAGPipeline:
    def retrieve_context(self, query: str, top_k: int = 5) -> List[dict]:
        """
        Retrieve relevant recipe chunks from Qdrant.
        
        Flow:
        1. Generate embedding for query using Ollama
        2. Search Qdrant for similar vectors
        3. Return top_k chunks with scores
        """
        try:
            # Generate embedding
            query_embedding = self.embed_text(query)
            if not query_embedding:
                return []
            
            # Search Qdrant
            results = self.qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                limit=top_k,
            )
            
            # Format results
            context = []
            for result in results:
                context.append({
                    "text": result.payload.get("text", ""),
                    "score": result.score,
                    "metadata": {k: v for k, v in result.payload.items() 
                                if k not in ["text", "chunk_index"]}
                })
            return context
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return []

    def generate_response(self, query: str, context: List[str]) -> str:
        """
        Generate response using Ollama LLM with retrieved context.
        
        Flow:
        1. Format prompt with context
        2. Send to Ollama
        3. Return generated response
        """
        try:
            context_str = "\n".join([f"- {c}" for c in context])
            full_prompt = f"""Based on the following context, answer the user's question.
If the context doesn't contain relevant information, say so.

Context:
{context_str}

Question: {query}

Answer:"""

            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": GENERATION_MODEL,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {"temperature": 0},  # Deterministic
                },
                timeout=300,
            )
            response.raise_for_status()
            return response.json().get("response", "Error generating response")
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error: {str(e)}"
```

### Example 7: Environment Setup

```bash
# .env (backend root)
# ─────────────────────────────

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333

# Ollama LLM
OLLAMA_URL=http://localhost:11434
OLLAMA_API_KEY=                    # Optional: for cloud proxies

# Model Configuration
EMBEDDING_MODEL=llama3.2:latest
GENERATION_MODEL=llama3.2:latest
EMBEDDING_DIM=384

# Vector Store Configuration
COLLECTION_NAME=recipes_documents
CHUNK_SIZE=500
CHUNK_OVERLAP=100
TOP_K=5
```

```env
# .env (frontend root)
# ─────────────────────────────

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### Example 8: Error Handling

```typescript
// Frontend error handling
const handleSendMessage = async (message: string) => {
  try {
    setError(null);
    const response = await chatService.sendMessage(
      message,
      recipeId,
      recipeTitle
    );
    
    // Success - response contains: response, context, sources
    displayMessage("assistant", response.response);
    
  } catch (err) {
    if (err instanceof Error) {
      // Handle specific errors
      if (err.message.includes("timeout")) {
        setError("Response taking too long. Try again.");
      } else if (err.message.includes("endpoint not found")) {
        setError("Backend not configured. Check API_URL.");
      } else {
        setError(err.message);
      }
    }
  }
};
```

### Example 9: Custom Styling Override

```css
/* Override default chat styling */
.chatIcon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.messageBubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chatPanel {
  max-width: 500px; /* Wider on desktop */
}

@media (max-width: 480px) {
  .chatPanel {
    max-width: 100%;
    height: 80vh;
  }
}
```

### Example 10: Database Schema for Chat History (Optional)

```sql
-- If you want to persist chat history in the future

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    sources TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current implementation: NO persistence (state-only, resets on refresh)
-- To enable: Update ChatService to save to this table
```

---

## 🔍 Debugging Tips

### Check Backend is Running

```bash
# Test health check
curl http://localhost:8000/api/v1/health
# Should return: {"status":"ok"}

# Test chat endpoint directly
curl -X POST http://localhost:8000/api/v1/chat/recipe \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "recipe_id": "test",
    "recipe_title": "Test Recipe"
  }'
```

### Check Frontend Logs

```javascript
// Browser DevTools Console
console.log(import.meta.env.VITE_API_BASE_URL); // Should show backend URL

// Check network requests
// DevTools → Network tab → filter by "recipe"
// Look for POST /api/v1/chat/recipe requests
```

### Check Qdrant Connection

```python
# In backend Python console
from qdrant_client import QdrantClient

client = QdrantClient("http://localhost:6333")
collections = client.get_collections()
print(collections)  # Should list collections including "recipes_documents"
```

### Check Ollama Connection

```bash
# Test Ollama embedding
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "prompt": "test"
  }'

# Test Ollama generation
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "prompt": "Say hello",
    "stream": false
  }'
```

---

## 📊 Performance Optimization

### Reduce Response Time

1. **Increase TOP_K carefully** (more = slower)
   ```python
   TOP_K = 3  # Less context, faster
   ```

2. **Use smaller model**
   ```python
   GENERATION_MODEL = "neural-chat:latest"  # Faster than llama3.2
   ```

3. **Cache embeddings** (future enhancement)

4. **Async processing** (already implemented)

### Reduce Bundle Size (Frontend)

```typescript
// Tree-shaking: Only import what you use
import { RecipeChat } from "chat/components/recipeChat";
import { useChat } from "chat/hooks/useChat";

// NOT: import * as Chat from "chat/...";
```

---

## 🎨 Customization Examples

### Change Chat Icon Color

```tsx
// In RecipeChat.tsx, modify gradient
// DEFAULT: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

// CHANGE TO:
background: linear-gradient(135deg, #FF7A3D 0%, #FF4500 100%); // Orange
background: linear-gradient(135deg, #00D4FF 0%, #0099FF 100%); // Blue
background: linear-gradient(135deg, #00D084 0%, #00AA62 100%); // Green
```

### Change Chat Panel Size

```tsx
// In RecipeChat.module.css
.chatPanel {
  max-width: 500px;  // Default: 420px
  height: 700px;     // Default: 600px
}
```

### Add Custom System Prompt

```python
# In rag_pipeline.py generate_response()
if raw_prompt:
    payload["system"] = """You are a helpful cooking assistant. 
Be concise and practical. If the user asks about ingredients 
or cooking time, provide specific numbers."""
```

---

## ✨ Bonus Features (Future)

### 1. Persistent Chat History
```typescript
// Store in localStorage
localStorage.setItem('chatHistory', JSON.stringify(messages));
```

### 2. User Preferences
```typescript
// Save user cooking level preference
const [cookingLevel, setCookingLevel] = useState('beginner');
// Personalize responses based on skill level
```

### 3. Recipe Suggestions
```typescript
// When user asks about modifications
const suggestions = await getRecipeSuggestions(recipe_id, modification);
```

### 4. Voice Input/Output
```typescript
// Use Web Speech API for voice chat
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => sendMessage(event.results[0][0].transcript);
```

### 5. Rate Limiting
```python
# In FastAPI backend
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/recipe")
@limiter.limit("10/minute")  # 10 requests per minute
async def chat_recipe(body: ChatRequest):
    ...
```

---

## 📞 Support

If something isn't working:

1. ✅ Check [CHATBOT_INTEGRATION_GUIDE.md](./CHATBOT_INTEGRATION_GUIDE.md) Troubleshooting section
2. 📝 Check browser console for errors
3. 🔌 Verify all services running (Ollama, Qdrant, FastAPI)
4. 🌐 Check CORS configuration
5. 📡 Test API endpoint directly with curl

---

**You're all set! Happy chatting! 🚀**
