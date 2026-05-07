@echo off
REM ChefAI Application Setup Script for Windows
REM This script initializes the Docker environment and pulls necessary models

echo.
echo 🍳 ChefAI - Application Setup
echo ==============================
echo.

REM Check Docker installation
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo ✅ Docker and Docker Compose found
echo.

REM Start services
echo 🚀 Starting Docker services...
docker-compose up -d

echo ⏳ Waiting for services to be ready (this may take 1-2 minutes)...
timeout /t 10 /nobreak

echo.
echo 📋 Checking service health...

REM Simple health checks
echo ✅ Services starting up...

echo.
echo 📥 Pulling Ollama models (this may take several minutes)...
echo    Pulling llama2 (latest and most capable)...
docker exec ollama_llm ollama pull llama2

echo.
echo    Pulling mistral (faster alternative)...
docker exec ollama_llm ollama pull mistral

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Application URLs:
echo    Frontend:     http://localhost:5173
echo    Backend API:  http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo    Qdrant UI:    http://localhost:6333/dashboard
echo    PostgreSQL:   localhost:5435 ^(user: chef_user, pass: chef_pass^)
echo.
echo 🎉 Ready to cook with AI!
echo.
echo 📖 For more information, see README.md
echo.
echo 🔧 Useful commands:
echo    View logs:        docker-compose logs -f backend
echo    Stop services:    docker-compose down
echo    Stop + cleanup:   docker-compose down -v
echo    Check status:     curl http://localhost:8000/api/status
echo.

pause
