# AI Chatbot Integration Guide

Complete implementation of WhatsApp-style AI chatbot for RecipeDetailsView using React, FastAPI, Qdrant, and Ollama.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup](#backend-setup)
4. [Environment Configuration](#environment-configuration)
5. [Component Structure](#component-structure)
6. [API Flow](#api-flow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  RecipeDetailView                                 │  │
│  │  └─ RecipeChat Component (Floating UI)           │  │
│  │     ├─ ChatIcon (floating button)                 │  │
│  │     ├─ ChatWindow (message panel)                 │  │
│  │     └─ useChat Hook (state management)            │  │
│  └──────────────────┬──────────────────────────────┘  │
│                     │ chatService.sendMessage()        │
└─────────────────────┼────────────────────────────────┘
                      │ HTTP POST
                      ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │  /api/v1/chat/recipe (POST)                     │  │
│  │  ├─ Receives: {message, recipe_id, recipe_title}│  │
│  │  └─ ChatService                                 │  │
│  │     ├─ RAGPipeline                              │  │
│  │     │  ├─ Generate embedding (Ollama)           │  │
│  │     │  ├─ Retrieve context (Qdrant)             │  │
│  │     │  └─ Generate response (Ollama)            │  │
│  │     └─ Returns: {response, context, sources}    │  │
│  └─────────────────────────────────────────────────┘  │
│                     │                                   │
│                     ├─▶ Qdrant (vector search)         │
│                     │                                   │
│                     └─▶ Ollama (LLM + embeddings)     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Setup

### 1. Folder Structure Created

```
src/
├── chat/
│   ├── components/
│   │   └── recipeChat/
│   │       ├── RecipeChat.tsx          # Main container
│   │       ├── ChatIcon.tsx            # Floating button
│   │       ├── ChatWindow.tsx          # Chat panel
│   │       ├── RecipeChat.module.css   # Styling
│   │       └── index.ts                # Exports
│   ├── hooks/
│   │   └── useChat.ts                  # State management
│   └── services/
│       └── chatService.ts              # API integration
└── modules/
    └── recipes/
        └── components/
            └── RecipeDetailView.tsx    # (UPDATED - includes chat)
```

### 2. Component Details

#### **RecipeChat.tsx** (Main Container)
- Manages open/close state
- Renders overlay when chat is open
- Combines ChatIcon and ChatWindow
- Props: `recipeId`, `recipeTitle`

```typescript
<RecipeChat
    recipeId={recipe.db_id || recipe.title}
    recipeTitle={recipe.title || "Recipe"}
/>
```

#### **ChatIcon.tsx** (Floating Button)
- Fixed at bottom-right corner
- Animated open/close transitions
- Gradient background: purple to pink
- Shows/hides close icon on toggle

#### **ChatWindow.tsx** (Chat Panel)
- Message display area with auto-scroll
- User and AI message bubbles
- Textarea input with Shift+Enter for new line
- Loading indicators
- Error message display
- Responsive: 420px max-width desktop, full-width mobile

#### **useChat.ts** (State Hook)
- Manages message history (no persistence)
- Loading states
- Error handling
- Auto-scroll to latest message
- Message sending logic

### 3. Service Layer

#### **chatService.ts**
- Axios instance for API calls
- Configurable base URL via `VITE_API_BASE_URL`
- 60-second timeout for LLM responses
- Error handling with specific messages
- Health check endpoint

### 4. Styling Features

Modern glassmorphism design:
- Gradient backgrounds (purple-pink)
- Backdrop blur effects
- Smooth animations
- Responsive breakpoints (480px, 600px)
- Accessibility: reduced motion support

---

## 🔧 Backend Setup

### 1. Files Updated

```
backend/
├── schemas/
│   └── chat_schema.py                  # (UPDATED)
├── services/
│   └── chat_service.py                 # (UPDATED)
├── api/
│   └── v1/
│       └── endpoints/
│           └── chat.py                 # (UPDATED)
├── rag_pipeline.py                     # (Already exists)
└── document_processor.py                # (Already exists)
```

### 2. Schema Updates

**chat_schema.py** - Added recipe context fields:

```python
class ChatRequest(BaseModel):
    message: str
    recipe_id: Optional[str] = None           # Recipe UUID
    recipe_title: Optional[str] = None        # Recipe name for context
```

### 3. Service Updates

**chat_service.py** - Enhanced `get_response()`:

```python
async def get_response(
    self,
    message: str,
    recipe_id: Optional[str] = None,
    recipe_title: Optional[str] = None
) -> ChatResponse
```

**Flow:**
1. Receives user message + recipe context
2. Builds contextual prompt: `"About recipe '{recipe_title}': {message}"`
3. Calls RAG pipeline to retrieve context from Qdrant
4. Sends context + message to Ollama for response
5. Returns response + retrieved context + sources

### 4. Endpoint Updates

**POST /api/v1/chat/recipe** (NEW)
```python
@router.post("/recipe", response_model=ChatResponse)
async def chat_recipe(body: ChatRequest):
    """Recipe-specific chat with RAG context."""
    response = await chat_service.get_response(
        message=body.message,
        recipe_id=body.recipe_id,
        recipe_title=body.recipe_title
    )
    return response
```

**GET /api/v1/health** (NEW)
```python
@router.get("/health")
async def health_check():
    """Frontend connectivity check."""
    return {"status": "ok"}
```

---

## 🔐 Environment Configuration

### Frontend (.env)

```env
# vite.config.ts should reference:
VITE_API_BASE_URL=http://localhost:8000

# Or for production:
VITE_API_BASE_URL=https://api.example.com
```

### Backend (.env)

```env
# RAG Pipeline Configuration
QDRANT_URL=http://localhost:6333
OLLAMA_URL=http://localhost:11434
OLLAMA_API_KEY=                           # Optional: for cloud proxies

# Embedding Model
EMBEDDING_MODEL=llama3.2:latest
EMBEDDING_DIM=384                         # llama3.2 produces 384-dim vectors

# Generation Model
GENERATION_MODEL=llama3.2:latest

# Vector Store
COLLECTION_NAME=recipes_documents
CHUNK_SIZE=500
CHUNK_OVERLAP=100
TOP_K=5                                   # Context chunks to retrieve
```

---

## 📦 Component Structure

### State Management (useChat Hook)

```typescript
const {
  messages,        // Message[] - all messages in current session
  isLoading,       // boolean - LLM generating response
  error,           // string | null - error message if any
  sendMessage,     // (message: string) => Promise<void>
  clearChat,       // () => void - reset history
  cancelRequest,   // () => void - abort ongoing request
  messagesEndRef,  // RefObject - for auto-scroll
} = useChat({ recipeId, recipeTitle });
```

### Message Structure

```typescript
interface Message {
  id: string;           // Unique identifier
  role: "user" | "assistant";
  content: string;      // Message text
  timestamp: number;    // Unix timestamp
}
```

### API Request/Response

**Request:**
```typescript
{
  message: "How long should I cook this?",
  recipe_id: "uuid-123",
  recipe_title: "Pasta Carbonara"
}
```

**Response:**
```typescript
{
  response: "Cook for 8-10 minutes until al dente...",
  context: [
    {
      text: "Cooking time: 8-10 minutes...",
      score: 0.92,
      metadata: { recipe_title: "Pasta Carbonara", ... }
    }
  ],
  sources: ["Pasta Carbonara"]
}
```

---

## 🔄 API Flow

### Step-by-Step

1. **User sends message** → "How do I make this less spicy?"
   
2. **Frontend sends request**
   ```
   POST /api/v1/chat/recipe
   {
     message: "How do I make this less spicy?",
     recipe_id: "uuid-xyz",
     recipe_title: "Spicy Curry"
   }
   ```

3. **Backend processes**
   - ChatService receives request
   - Builds contextual query: "About recipe 'Spicy Curry': How do I make this less spicy?"
   - RAGPipeline.retrieve_context() → calls Ollama embeddings → searches Qdrant
   - Retrieves 5 most relevant chunks from recipe
   - RAGPipeline.generate_response() → sends context to Ollama LLM
   - Ollama generates answer with retrieved context

4. **Backend returns response**
   ```json
   {
     "response": "To reduce spice, you can...",
     "context": [...],
     "sources": ["Spicy Curry"]
   }
   ```

5. **Frontend displays**
   - AI message appears with timestamp
   - Auto-scrolls to latest message
   - Send button re-enabled

---

## 🧪 Testing

### Frontend Testing

#### Manual Test in Browser

1. Open RecipeDetailsView page
2. Click floating chat icon (bottom-right)
   - ✅ Chat panel slides up with animation
   - ✅ Background blurs and darkens
   - ✅ Icon changes to close (X)

3. Type a message: "What are the main ingredients?"
   - ✅ Text appears in textarea
   - ✅ Send button is enabled

4. Press Enter or click send
   - ✅ User message appears in bubble (purple)
   - ✅ Send button disabled
   - ✅ Loading indicator shows (three dots)

5. Wait for response
   - ✅ AI message appears in bubble (white)
   - ✅ Auto-scrolls to latest message
   - ✅ Timestamp shows for both messages

6. Try Shift+Enter
   - ✅ New line in textarea (not sent)

7. Click close button or outside chat
   - ✅ Chat panel slides down
   - ✅ Overlay disappears
   - ✅ Page becomes interactive again

#### Browser DevTools

Check Network tab:
```
POST /api/v1/chat/recipe 200 OK
Headers:
  Content-Type: application/json
  Authorization: (if needed)
Body:
  {
    "message": "...",
    "recipe_id": "...",
    "recipe_title": "..."
  }
Response:
  {
    "response": "...",
    "context": [...],
    "sources": [...]
  }
Time: Should be 5-30 seconds depending on model
```

### Backend Testing

#### Test the Endpoint Directly

```bash
# Using curl
curl -X POST http://localhost:8000/api/v1/chat/recipe \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the ingredients?",
    "recipe_id": "test-123",
    "recipe_title": "Pasta"
  }'

# Using Python
import requests
response = requests.post(
    "http://localhost:8000/api/v1/chat/recipe",
    json={
        "message": "What are the ingredients?",
        "recipe_id": "test-123",
        "recipe_title": "Pasta"
    }
)
print(response.json())
```

#### Health Check

```bash
curl http://localhost:8000/api/v1/health
# Should return: {"status": "ok"}
```

---

## 🚨 Troubleshooting

### Issue: Chat icon not visible

**Solution:**
- Check `z-index`: Chat uses `z-index: 1000` for icon, `z-index: 999` for overlay
- Ensure RecipeDetailView has `zIndex: 2000` (doesn't interfere)
- Clear browser cache
- Open DevTools → check if element is hidden/off-screen

### Issue: "Failed to get response from AI"

**Cause 1: Backend not running**
```bash
# Start backend
cd backend
python main.py
```

**Cause 2: Ollama not running**
```bash
# Start Ollama
ollama serve

# Or if using cloud proxy, check API_KEY:
OLLAMA_API_KEY=your_key python main.py
```

**Cause 3: Qdrant not running**
```bash
# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant
```

**Cause 4: Request timeout**
- Ollama model too large or overloaded
- Check `/api/v1/health` endpoint first
- Increase timeout in `chatService.ts`: `timeout: 120000` (2 minutes)

### Issue: Wrong API base URL

**Check frontend environment:**
```typescript
// vite.config.ts or .env file
VITE_API_BASE_URL=http://localhost:8000
```

**Verify in browser:**
```javascript
// DevTools console
console.log(import.meta.env.VITE_API_BASE_URL)
```

### Issue: CORS errors

**Add CORS middleware to FastAPI** (main.py):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Chat history persists after refresh

**This is expected behavior** - chat uses `useState` only (no localStorage/database).
To clear: Close and reopen chat panel or refresh page.

### Issue: Qdrant has no recipe data

**Solution: Index recipes first**
```python
# In backend/main.py startup or as a task
from rag_pipeline import rag_pipeline
from document_processor import process_document

# Process recipe document and store in Qdrant
content, doc_type = process_document("recipe.pdf")
chunks = rag_pipeline.chunk_text(content)
rag_pipeline.store_chunks(
    doc_id="recipe_id",
    chunks=chunks,
    metadata={"recipe_title": "Pasta"}
)
```

---

## 📝 Integration Checklist

- [ ] Frontend folder structure created
- [ ] RecipeChat component integrated into RecipeDetailView
- [ ] Backend schemas updated with recipe_id, recipe_title
- [ ] ChatService updated with recipe context handling
- [ ] Chat endpoints created (/api/v1/chat/recipe, /api/v1/health)
- [ ] Environment variables configured
- [ ] Ollama running and model available (llama3.2:latest)
- [ ] Qdrant running with collection initialized
- [ ] Backend CORS configured
- [ ] Frontend API base URL correct
- [ ] Manual testing completed
- [ ] Error messages display properly
- [ ] Loading indicator shows
- [ ] Auto-scroll works
- [ ] Chat closes properly
- [ ] Overlay blur effect works

---

## 🚀 Production Deployment

### Frontend
1. Build: `npm run build`
2. Update `VITE_API_BASE_URL` to production API
3. Deploy to Vercel/Netlify/your hosting

### Backend
1. Update `QDRANT_URL` and `OLLAMA_URL` to production
2. Set `OLLAMA_API_KEY` if using cloud proxy
3. Deploy to AWS/GCP/your hosting
4. Enable CORS with production domain
5. Add rate limiting for chat endpoint

### Database
1. Use managed Qdrant (Qdrant Cloud)
2. Or self-hosted with backup strategy

### LLM
1. Use cloud Ollama proxy with API key
2. Or self-hosted with GPU
3. Monitor token usage and costs

---

## 📚 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Vite Documentation](https://vitejs.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

## ✅ Summary

Your AI chatbot is now fully integrated! The system:

✅ Shows floating chat icon in RecipeDetailView  
✅ Opens beautiful glassmorphism chat panel  
✅ Blurs background when chat is open  
✅ Sends messages to FastAPI backend  
✅ Uses Qdrant for vector search  
✅ Uses Ollama for embeddings & LLM  
✅ Displays AI responses with retrieved context  
✅ Handles errors gracefully  
✅ Responsive on mobile & desktop  
✅ No persistent chat history (resets on refresh)

---

**Happy chatting! 🎉**
