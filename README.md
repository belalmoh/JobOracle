# JobOracle

Resume management system for job applications with FastAPI backend and Next.js frontend.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, TypeScript
- **Backend**: FastAPI, SQLAlchemy, Python
- **Database**: SQLite (development)

## Project Structure

```
JobOracle/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── models/   # Database models
│   │   └── main.py   # App entry point
│   └── requirements.txt
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/      # Next.js pages
│   │   ├── components/  # React components
│   │   └── lib/      # Utilities
│   └── package.json
└── Makefile           # Developer commands
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- pip

### Setup

```bash
make setup
```

### Development

Run both backend and frontend:

```bash
make dev
```

Or run separately:

```bash
make backend  # API at http://localhost:8000
make frontend # UI at http://localhost:3000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/uploads` - Upload resume
- `POST /api/extract` - Extract data from resume
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application

## Environment Variables

Create `.env` files in `backend/`:

```
OPENAI_API_KEY=your_api_key
DATABASE_URL=sqlite+aiosqlite:///joboracle.db
```
