# ChefAI - Full-Stack Recipe & AI Assistant Application

A complete full-stack application featuring recipe management, image uploads, and an AI-powered chat assistant with Retrieval-Augmented Generation (RAG) capabilities.

## ✨ Features

### 📸 Image & File Management
- Upload recipe images and documents
- Files stored in `/uploads` folder with structured subdirectories
- Automatic display of uploaded images on the home page
- Support for avatars, recipe images, and documents

### 🍳 Recipe Management
- Browse recipes in a responsive grid layout
- Click on any recipe to view detailed information:
  - Recipe name and description
  - Ingredients list
  - Step-by-step cooking instructions
  - Time, cuisine, spice level, and diet type
  - Uploaded images
- Create new recipes through the UI
- Update recipe details
- Save favorite recipes

### 🤖 AI Chat Assistant
- Ask questions about recipes, cooking techniques, and ingredients
- **RAG-powered responses** with context awareness
- Document upload and processing (PDF, DOCX, TXT, Images)
- Chat history tracking
- Source citations for answered questions

### 🧠 RAG (Retrieval-Augmented Generation) System
- **Document Processing**: Extract text from PDFs, Word documents, and images
- **Text Chunking**: Intelligent chunking with overlap for better context
- **Embeddings**: Generate embeddings using Sentence Transformers
- **Vector Database**: Store embeddings in Qdrant for fast similarity search
- **Context Retrieval**: Retrieve relevant chunks based on user queries
- **LLM Integration**: Generate accurate, context-aware responses using Ollama

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Responsive design** for all screen sizes

### Backend
- **FastAPI** for high-performance REST API
- **Python 3.11** runtime
- **PostgreSQL** for persistent data storage
- **AsyncPG** for async database operations

### RAG & AI
- **Qdrant** - Vector database for embeddings
- **Ollama** - Local LLM hosting (llama2, mistral, etc.)
- **Sentence Transformers** - Embedding generation
- **LangChain** - Orchestration and utilities

### Infrastructure
- **Docker & Docker Compose** - Complete containerization
- All services in a single `docker-compose up` command

## 📋 Project Structure

```
project/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Home, Profile, Chat pages
│   │   ├── components/      # RecipeCard, Sidebar, etc.
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints & DB setup
│   ├── rag_pipeline.py     # RAG system implementation
│   ├── document_processor.py # Document extraction
│   ├── requirements.txt
│   └── Dockerfile
│
├── uploads/                # File storage
│   ├── avatars/
│   ├── recipes/
│   └── documents/
│
└── docker-compose.yml      # Complete stack orchestration
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 8GB RAM (for Ollama LLM)
- 20GB free disk space (for LLM models)

### Installation & Launch

1. **Clone or navigate to the project directory**
   ```bash
   cd project
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Pull Ollama models** (first time only)
   ```bash
   docker exec ollama_llm ollama pull llama2
   # or use a faster model
   docker exec ollama_llm ollama pull mistral
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Qdrant UI: http://localhost:6333/dashboard
   - PostgreSQL: localhost:5435 (chef_user/chef_pass)

### Verify Installation

```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f ollama

# Test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/status
```

## 📚 API Endpoints

### Recipes
- `GET /api/recipes` - List all recipes
- `GET /api/recipes/{recipe_id}` - Get recipe details
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/{recipe_id}` - Update recipe
- `DELETE /api/recipes/{recipe_id}` - Delete recipe

### File Upload
- `POST /api/upload/recipe-image/{recipe_id}` - Upload recipe image
- `POST /api/upload/recipe-document/{recipe_id}` - Upload & process document
- `POST /api/upload/avatar` - Upload user avatar

### Chat & RAG
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat-history/{user_id}` - Get chat history

### User Profile
- `GET /api/profile` - Get current user
- `GET /api/profile/{user_id}` - Get specific user
- `PUT /api/profile/{user_id}` - Update profile
- `GET /api/users/{user_id}/saved-recipes` - Get saved recipes

### System
- `GET /api/health` - Health check
- `GET /api/status` - RAG system status

## 🔧 Configuration

### Environment Variables

**Backend** (in docker-compose.yml):
- `DATABASE_URL` - PostgreSQL connection
- `BASE_URL` - API base URL
- `QDRANT_URL` - Qdrant vector DB
- `OLLAMA_URL` - Ollama LLM service

**Frontend** (.env):
- `VITE_API_URL` - Backend API URL

## 💡 Usage Examples

### Creating a Recipe
1. Navigate to Home page
2. Click "+ Add Recipe"
3. Fill in recipe details (title, image, cuisine, time, spice level)
4. Click "Create Recipe"

### Uploading a Document
1. Click on a recipe to view details
2. Upload a PDF, DOCX, or TXT file
3. Document gets processed and indexed in Qdrant

### Using the AI Chat
1. Navigate to "AI Assistant" page
2. Ask any question about recipes, cooking, or ingredients
3. System retrieves relevant context from uploaded documents
4. AI generates context-aware responses with source citations

### Saving Recipes
- Click the save icon on any recipe card
- Access saved recipes from the Profile page

## 🗄️ Database Schema

### Users
- Profile information (name, bio, preferences)
- Diet type, spice level, allergies
- Cooking skill level

### Recipes
- Title, cuisine, cooking time
- Ingredients and steps
- Image and document paths
- Spice level and diet type

### Chat History
- User messages and AI responses
- Retrieved context and sources
- Timestamps

### Documents
- File metadata
- Content previews
- Processing status

## 🚨 Troubleshooting

### Services won't start
```bash
# Clean up and restart
docker-compose down -v
docker-compose up -d
```

### Ollama not responding
```bash
# Check Ollama logs
docker logs ollama_llm

# Restart Ollama
docker restart ollama_llm

# Re-pull models if needed
docker exec ollama_llm ollama pull llama2
```

### Database connection error
```bash
# Check PostgreSQL
docker logs recipe_db

# Verify connection
docker exec recipe_db psql -U chef_user -d chefai -c "SELECT 1"
```

### High memory usage
- Reduce Qdrant cache: Modify qdrant volumes
- Use smaller LLM: `ollama pull neural-chat-7b`
- Limit Ollama memory: Add ulimit in docker-compose

## 🔐 Security Notes

- Currently using no authentication - add auth layer for production
- Qdrant API key is empty - configure strong key in production
- CORS is open to all origins - restrict in production
- Database credentials should use strong passwords
- Use HTTPS in production

## 📈 Performance Optimization

### For Production
1. **Disable hot reload** in backend/frontend Dockerfiles
2. **Use nginx** as reverse proxy
3. **Add caching layer** (Redis)
4. **Optimize embedding batch size**
5. **Implement request rate limiting**
6. **Use production-grade LLM** models
7. **Set up monitoring** and logging

### RAG Tuning
- Adjust `CHUNK_SIZE` in rag_pipeline.py
- Modify `TOP_K` for more/fewer context items
- Use different embedding models
- Implement reranking for better results

## 📝 License

This project is provided as-is for educational and personal use.

## 🤝 Support

For issues or questions:
1. Check logs: `docker-compose logs -f [service_name]`
2. Review API docs: http://localhost:8000/docs
3. Check vector DB: http://localhost:6333/dashboard
4. Test endpoints manually

---

**Ready to cook with AI! 🍳✨**
