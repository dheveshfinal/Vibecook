# ChefAI Troubleshooting Guide

## 🔴 Common Issues and Solutions

### 1. Docker Services Won't Start

**Symptom:** `docker-compose up` hangs or fails

**Solutions:**
```bash
# Clean up and restart
docker-compose down -v
docker system prune -a
docker-compose up -d

# Check for port conflicts
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :5435  # PostgreSQL
lsof -i :6333  # Qdrant
lsof -i :11434 # Ollama
```

**On Windows:**
- Make sure Docker Desktop is running
- Check if Hyper-V is enabled
- Try running Docker Desktop as Administrator
- Check available disk space (need ~20GB)

### 2. Ollama Models Won't Download

**Symptom:** `docker exec ollama_llm ollama pull llama2` hangs or fails

**Solutions:**
```bash
# Check Ollama logs
docker logs ollama_llm

# Try pulling alternative smaller model
docker exec ollama_llm ollama pull neural-chat-7b
docker exec ollama_llm ollama pull mistral

# Restart Ollama container
docker restart ollama_llm

# Check available disk space
df -h  # Linux/Mac
wmic logicaldisk get name,size,freespace  # Windows

# Increase Docker memory allocation if needed
# Edit Docker Desktop settings -> Resources -> Memory: 8GB+
```

**Note:** First model pull can take 5-30 minutes depending on internet speed and model size.

### 3. Backend Can't Connect to Database

**Symptom:** `ConnectionError: could not connect to server: Connection refused`

**Solutions:**
```bash
# Check PostgreSQL container
docker ps | grep recipe_db
docker logs recipe_db

# Verify database is accepting connections
docker exec recipe_db psql -U chef_user -d chefai -c "SELECT 1"

# Check connection string
# Should be: postgresql://chef_user:chef_pass@postgres:5432/chefai
# (inside docker, host is "postgres", not "localhost")

# Restart database
docker-compose down
docker-compose up -d postgres
sleep 10
docker-compose up -d backend
```

### 4. Frontend Can't Reach Backend API

**Symptom:** `Failed to fetch` errors, CORS errors

**Solutions:**
```bash
# Check VITE_API_URL environment variable
docker logs react_app | grep VITE_API_URL

# Verify backend is running
curl http://localhost:8000/api/health

# Check browser console for exact error
# Should see: http://localhost:8000 as API base

# In docker-compose.yml, ensure:
# - Frontend env: VITE_API_URL=http://localhost:8000
# - Backend CORS is enabled (it is by default)

# Restart frontend
docker-compose down
docker-compose up -d frontend
```

### 5. Qdrant Vector Database Issues

**Symptom:** `ConnectionError: Failed to connect to Qdrant`, chat doesn't work

**Solutions:**
```bash
# Check Qdrant container
docker logs qdrant_db

# Verify Qdrant health
curl http://localhost:6333/health

# Check collections
curl http://localhost:6333/collections

# Recreate Qdrant without persisted data
docker-compose down
docker volume rm project_qdrant_data
docker-compose up -d qdrant
```

### 6. RAG Pipeline Not Working

**Symptom:** Chat returns generic responses, no context retrieval

**Solutions:**
```bash
# Check RAG status
curl http://localhost:8000/api/status

# Verify Qdrant connection
docker logs fastapi_app | grep Qdrant

# Check if embeddings are generated
docker exec qdrant_db curl -s http://localhost:6333/collections

# Upload test document and verify processing
# Then check logs for chunking messages
docker logs fastapi_app | grep -i chunk

# Verify sentence-transformers model is loaded
docker exec fastapi_app python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### 7. High Memory Usage

**Symptom:** Docker processes consuming excessive RAM, system slow

**Solutions:**
```bash
# Check memory usage per container
docker stats

# Reduce Ollama memory
# Option 1: Use smaller model
docker exec ollama_llm ollama pull neural-chat-7b

# Option 2: Unload unused models
docker exec ollama_llm ollama list
docker exec ollama_llm rm llama2  # if using neural-chat instead

# Option 3: Adjust embedding model
# In rag_pipeline.py:
# EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Already lightweight
# Or use: EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Check and increase Docker memory limit
# Docker Desktop -> Settings -> Resources -> Memory
# Recommended: 8GB minimum, 16GB preferred
```

### 8. API Docs Not Loading

**Symptom:** http://localhost:8000/docs shows blank or error

**Solutions:**
```bash
# Check backend logs
docker logs fastapi_app

# Verify FastAPI is running
curl http://localhost:8000/api/health

# Check Python version
docker exec fastapi_app python --version

# Rebuild backend image
docker-compose build backend
docker-compose up -d backend
```

### 9. Chat History Not Saving

**Symptom:** Messages not persisted between sessions

**Solutions:**
```bash
# Check database has chat_history table
docker exec recipe_db psql -U chef_user -d chefai -c "\dt chat_history"

# Check for errors in logs
docker logs fastapi_app | grep -i chat

# Verify user_id is valid UUID
# Ensure you're passing a valid user_id to the chat endpoint

# Check database connection
docker exec recipe_db psql -U chef_user -d chefai -c "SELECT COUNT(*) FROM chat_history"
```

### 10. File Upload Issues

**Symptom:** Image/document upload fails, files not appearing

**Solutions:**
```bash
# Check uploads directory exists
ls -la uploads/
docker exec fastapi_app ls -la uploads/

# Verify permissions
docker exec fastapi_app chmod -R 755 uploads

# Check file size limits
# FastAPI default is usually 25MB

# Check uploaded files
docker exec fastapi_app find uploads -type f

# View upload logs
docker logs fastapi_app | grep -i upload

# Test manual file upload
curl -F "file=@test.jpg" http://localhost:8000/api/upload/avatar
```

## 🔧 Performance Optimization

### Slow API Responses

```bash
# Check database query performance
docker exec recipe_db psql -U chef_user -d chefai
# Then: \timing on
# SELECT * FROM recipes LIMIT 10;

# Add database indexes
docker exec recipe_db psql -U chef_user -d chefai -c \
"CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine)"

# Monitor active connections
docker exec recipe_db psql -U chef_user -d chefai -c \
"SELECT * FROM pg_stat_activity"
```

### Slow RAG/Chat Responses

```bash
# Check Qdrant performance
curl http://localhost:6333/dashboard

# Monitor embedding generation
docker logs fastapi_app | grep -i embedding

# Reduce TOP_K in rag_pipeline.py
# RAG_TOP_K = 3  # Instead of 5

# Use faster embedding model
# EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Already fast

# Adjust chunk size
# CHUNK_SIZE = 300  # Smaller chunks = faster but less context
```

## 📊 Monitoring & Debugging

### View All Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ollama

# Last 100 lines
docker-compose logs --tail=100 backend

# With timestamps
docker-compose logs -f --timestamps backend
```

### Database Debugging

```bash
# Connect to database
docker exec -it recipe_db psql -U chef_user -d chefai

# List tables
\dt

# Check record counts
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM chat_history;

# View recent chat messages
SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 5;

# Exit
\q
```

### Container Shell Access

```bash
# Backend
docker exec -it fastapi_app /bin/bash

# Frontend (Node)
docker exec -it react_app /bin/sh

# Database
docker exec -it recipe_db /bin/bash

# Qdrant
docker exec -it qdrant_db /bin/sh

# Ollama
docker exec -it ollama_llm /bin/sh
```

## 🔄 Reset & Reinitialize

### Soft Reset (Keep Data)
```bash
docker-compose restart
```

### Hard Reset (Lose Data)
```bash
docker-compose down
docker-compose up -d
```

### Complete Cleanup
```bash
# Remove everything
docker-compose down -v
docker system prune -a

# Restart fresh
docker-compose up -d
```

### Database Reset
```bash
# Delete database volume
docker volume rm project_postgres_data

# Restart postgres
docker-compose up -d postgres
sleep 10

# Restart backend to recreate tables
docker-compose restart backend
```

## 📞 Getting Help

1. **Check logs first**
   ```bash
   docker-compose logs -f [service-name]
   ```

2. **Verify services are running**
   ```bash
   docker-compose ps
   ```

3. **Test API endpoints**
   ```bash
   curl http://localhost:8000/api/status
   ```

4. **Check Docker is working**
   ```bash
   docker ps
   docker images
   ```

5. **Review this guide** and README.md for more details

## ⚠️ Common Mistakes

1. **Forgetting to pull Ollama models** - Models must be pulled before use
2. **Wrong host URL in docker** - Use "postgres" not "localhost" inside containers
3. **Port conflicts** - Make sure ports 5173, 8000, 5435, 6333, 11434 are free
4. **Insufficient disk space** - Need 20GB+ free for LLM models
5. **Memory issues** - Allocate at least 8GB to Docker
6. **Not waiting for startup** - Services need time to initialize
7. **CORS issues** - Check VITE_API_URL matches backend URL
8. **Database connection string** - Use internal docker DNS (postgres, not localhost)

---

**Still having issues?** Check the logs with `docker-compose logs -f` and look for error messages!
