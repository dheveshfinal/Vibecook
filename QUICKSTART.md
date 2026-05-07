# 🚀 ChefAI - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- 8GB+ RAM available
- 20GB+ free disk space
- ~5-10 minutes for initial model download

## ⚡ Quick Start

### 1. Start Services (5 minutes)
```bash
cd project
docker-compose up -d
```

### 2. Download AI Models (5-10 minutes, one-time only)
**On macOS/Linux:**
```bash
docker exec ollama_llm ollama pull llama2
```

**On Windows (PowerShell):**
```powershell
docker exec ollama_llm ollama pull llama2
```

Or use the setup script:
- **Mac/Linux:** `bash setup.sh`
- **Windows:** `setup.bat`

### 3. Open Application
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

## ✅ Verify Everything Works

```bash
# Health check
curl http://localhost:8000/api/health

# Full status
curl http://localhost:8000/api/status
```

## 🎯 What You Can Do Now

### Create a Recipe
1. Go to Home page
2. Click "+ Add Recipe"
3. Fill in details and click "Create Recipe"

### Upload Documents
1. Click on a recipe
2. Scroll to upload section
3. Upload PDF, DOCX, or TXT file

### Chat with AI
1. Click "AI Assistant" in sidebar
2. Ask questions about cooking, recipes, ingredients
3. System will provide answers based on uploaded documents

### Save Recipes
1. Click recipe card
2. Click save icon
3. View saved recipes in Profile

## 📚 Useful URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Qdrant UI | http://localhost:6333/dashboard |
| PostgreSQL | localhost:5435 |

## 🔑 Default Credentials

**PostgreSQL:**
- User: `chef_user`
- Password: `chef_pass`
- Database: `chefai`

## 📝 Common Commands

```bash
# View logs
docker-compose logs -f backend

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# Complete cleanup
docker-compose down -v

# Check status
docker-compose ps

# Open backend shell
docker exec -it fastapi_app /bin/bash

# Access database
docker exec -it recipe_db psql -U chef_user -d chefai
```

## 🎮 Using Make Commands

If you have `make` installed:

```bash
make help       # Show all commands
make setup      # Initial setup
make start      # Start services
make stop       # Stop services
make logs       # View logs
make health     # Check health
make docs       # Open API docs
```

## 🚨 If Something Goes Wrong

### Services won't start
```bash
docker-compose down -v
docker-compose up -d
```

### Ollama stuck downloading
- Wait longer (models are large)
- Check internet connection
- See TROUBLESHOOTING.md for solutions

### Backend can't connect to DB
```bash
docker-compose restart postgres backend
```

### Frontend shows errors
- Clear browser cache (Ctrl+Shift+Delete)
- Check console (F12)
- Verify API_URL is correct

## 📖 Learn More

- **Full Documentation:** See [README.md](README.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **API Examples:** See [api_examples.py](api_examples.py)
- **API Docs:** Visit http://localhost:8000/docs

## 🎉 You're All Set!

Your AI-powered recipe application is ready to use!

### Next Steps:
1. ✅ Create a recipe
2. ✅ Upload a document (PDF/DOCX)
3. ✅ Chat with the AI assistant
4. ✅ Build your personal recipe collection

---

**Questions?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or review the logs:
```bash
docker-compose logs -f
```
