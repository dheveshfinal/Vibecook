# ChefAI Makefile - Convenient commands for development

.PHONY: help setup start stop logs restart clean build test docs

help:
	@echo "ChefAI - Available Commands"
	@echo "============================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup       - Initialize and start all services"
	@echo "  make build       - Build Docker images"
	@echo ""
	@echo "Running Services:"
	@echo "  make start       - Start all services"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make clean       - Stop services and remove volumes"
	@echo ""
	@echo "Development:"
	@echo "  make logs        - View all service logs"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo "  make logs-ollama  - View Ollama logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make ps          - Show running containers"
	@echo "  make shell-backend - Open backend shell"
	@echo "  make shell-db    - Open database shell"
	@echo "  make test        - Run API tests"
	@echo "  make docs        - Open API documentation"
	@echo ""
	@echo "Models:"
	@echo "  make pull-llama  - Pull llama2 model"
	@echo "  make pull-mistral - Pull mistral model"
	@echo "  make list-models - List available models"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend:  http://localhost:5173"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"
	@echo "  Qdrant:    http://localhost:6333/dashboard"

setup:
	@echo "Setting up ChefAI..."
	docker-compose up -d
	@echo "Waiting for services..."
	sleep 15
	@echo "Pulling LLM models (this may take several minutes)..."
	docker exec ollama_llm ollama pull llama2
	@echo "✅ Setup complete! Visit http://localhost:5173"

start:
	docker-compose up -d
	@echo "✅ Services started"

stop:
	docker-compose stop
	@echo "✅ Services stopped"

restart:
	docker-compose restart
	@echo "✅ Services restarted"

clean:
	docker-compose down -v
	@echo "✅ All services and volumes removed"

build:
	docker-compose build
	@echo "✅ Docker images built"

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-ollama:
	docker-compose logs -f ollama

ps:
	docker-compose ps

shell-backend:
	docker exec -it fastapi_app /bin/bash

shell-db:
	docker exec -it recipe_db psql -U chef_user -d chefai

test:
	@echo "Testing API endpoints..."
	curl -s http://localhost:8000/api/health | python -m json.tool
	curl -s http://localhost:8000/api/status | python -m json.tool
	@echo ""
	@echo "✅ API tests complete"

docs:
	@echo "Opening API documentation..."
	@command -v xdg-open >/dev/null 2>&1 && xdg-open "http://localhost:8000/docs" || \
	command -v open >/dev/null 2>&1 && open "http://localhost:8000/docs" || \
	echo "Visit http://localhost:8000/docs in your browser"

pull-llama:
	docker exec ollama_llm ollama pull llama2
	@echo "✅ llama2 model ready"

pull-mistral:
	docker exec ollama_llm ollama pull mistral
	@echo "✅ mistral model ready"

list-models:
	docker exec ollama_llm ollama list

# Health checks
health:
	@echo "Checking service health..."
	@echo -n "Backend: "
	@curl -s http://localhost:8000/api/health > /dev/null && echo "✅" || echo "❌"
	@echo -n "Frontend: "
	@curl -s http://localhost:5173 > /dev/null && echo "✅" || echo "❌"
	@echo -n "Qdrant: "
	@curl -s http://localhost:6333/health > /dev/null && echo "✅" || echo "❌"
	@echo -n "Ollama: "
	@curl -s http://localhost:11434/api/tags > /dev/null && echo "✅" || echo "❌"
	@echo -n "PostgreSQL: "
	@docker exec recipe_db pg_isready -U chef_user > /dev/null 2>&1 && echo "✅" || echo "❌"

# Development utilities
install-deps:
	cd backend && pip install -r requirements.txt
	cd ../frontend && npm install

format:
	cd backend && black *.py
	cd ../frontend && npx prettier --write "src/**/*.{ts,tsx}"

lint:
	cd backend && pylint *.py
	cd ../frontend && npx eslint src

update-db:
	@echo "Running database migrations..."
	docker exec fastapi_app python -c "from main import init_db; import asyncio; asyncio.run(init_db())"

.DEFAULT_GOAL := help
