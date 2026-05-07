#!/bin/bash

# ChefAI Application Setup Script
# This script initializes the Docker environment and pulls necessary models

set -e

echo "🍳 ChefAI - Application Setup"
echo "=============================="
echo ""

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Start services
echo "🚀 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready (this may take 1-2 minutes)..."
sleep 10

# Check services
echo ""
echo "📋 Checking service health..."

# Check PostgreSQL
if docker exec recipe_db pg_isready -U chef_user &> /dev/null; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is still starting, please wait..."
fi

# Check Qdrant
if curl -s http://localhost:6333/health &> /dev/null; then
    echo "✅ Qdrant vector database is ready"
else
    echo "⚠️  Qdrant is still starting..."
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "✅ Ollama LLM service is ready"
else
    echo "⚠️  Ollama is still starting..."
fi

# Check Backend
if curl -s http://localhost:8000/api/health &> /dev/null; then
    echo "✅ FastAPI backend is ready"
else
    echo "⚠️  Backend is still starting..."
fi

# Check Frontend
if curl -s http://localhost:5173 &> /dev/null; then
    echo "✅ Frontend is ready"
else
    echo "⚠️  Frontend is still starting..."
fi

echo ""
echo "📥 Pulling Ollama models (this may take several minutes)..."
echo "   Pulling llama2 (latest and most capable)..."

docker exec ollama_llm ollama pull llama2 &

# Also start pulling mistral in background for faster alternative
echo "   Pulling mistral (faster alternative)..."
docker exec ollama_llm ollama pull mistral 2>/dev/null || true &

wait

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   Qdrant UI:    http://localhost:6333/dashboard"
echo "   PostgreSQL:   localhost:5435 (user: chef_user, pass: chef_pass)"
echo ""
echo "📚 Available Models:"
docker exec ollama_llm ollama list 2>/dev/null || echo "   Models still loading..."
echo ""
echo "🎉 Ready to cook with AI!"
echo ""
echo "📖 For more information, see README.md"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:        docker-compose logs -f backend"
echo "   Stop services:    docker-compose down"
echo "   Stop + cleanup:   docker-compose down -v"
echo "   Check status:     curl http://localhost:8000/api/status"
