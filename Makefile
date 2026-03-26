.PHONY: dev backend frontend install setup

# Default target
dev: backend frontend

# Backend commands
backend:
	cd backend && uvicorn app.main:app --reload --port 8000

# Frontend commands
frontend:
	cd frontend && npm run dev

# Install all dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Initial setup
setup: install

# Run only backend
run-backend: backend

# Run only frontend
run-frontend: frontend
