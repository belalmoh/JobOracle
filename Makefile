.PHONY: dev backend frontend install setup

pythonvenv: 
	cd backend && source .venv/bin/activate

# Default target
dev: pythonvenv backend frontend

# Backend commands
backend: pythonvenv
	cd backend && uvicorn app.main:app --reload --port 8000

# Frontend commands
frontend:
	cd frontend && npm run dev

# Install all dependencies
install:
	cd backend && uv pip install -r requirements.txt
	cd frontend && npm install

# Initial setup
setup: install

# Run only backend
run-backend: backend

# Run only frontend
run-frontend: frontend
