# Stack Research: JobOracle

## Overview
Research on standard 2025 stack for job search automation platforms with resume parsing, job scraping, scoring, and auto-apply.

## Backend Stack

### FastAPI (Primary API Framework)
- **Version**: Latest (Python 3.11+)
- **Why**: High-performance async, automatic OpenAPI docs, built-in dependency injection
- **Confidence**: High

### Core Libraries

| Library | Purpose | Version | Notes |
|---------|---------|---------|-------|
| **PyMuPDF (fitz)** | PDF text extraction | Latest | Fast, reliable for resume parsing |
| **python-docx** | DOCX parsing | Latest | For Word resumes |
| **spaCy** | NLP, skill extraction | en_core_web_lg | Entity recognition, skill normalization |
| **SentenceTransformers** | Semantic matching | Latest | `all-MiniLM-L6-v2` for resume-JD matching |
| **OpenAI/Gemini** | AI parsing & analysis | Latest | GPT-4o for structured extraction |
| **Playwright** | Browser automation | Latest | Auto-apply functionality |
| **SQLAlchemy** | ORM | 2.x | Database operations |
| **Alembic** | Migrations | Latest | Database versioning |

### Job Scraping

| Library | Purpose | Notes |
|---------|---------|-------|
| **jobspy** | Multi-platform scraping | LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs |
| **BeautifulSoup** | HTML parsing | Fallback for custom scraping |
| **Requests** | HTTP calls | With rate limiting |
| **TLS Client** | Advanced HTTP | For sites with TLS challenges |

### Database
- **PostgreSQL** — Primary database (as per user requirement)
- Use with SQLAlchemy async engine

## Frontend Stack

### Next.js + Tailwind
- **Version**: Latest (App Router)
- **Why**: User preference
- **UI**: Tailwind for styling
- **State**: React Context or simple state management

## Data Flow

```
Resume Upload → PyMuPDF extraction → AI parsing (OpenAI) → Skill extraction (spaCy)
                                                                      ↓
Job Search → jobspy scraping → Deduplication → Semantic matching (SentenceTransformers)
                                                                      ↓
Results → Scoring algorithm → Display → Application tracking
```

## What NOT to Use

- **Selenium** — Use Playwright instead (modern, faster)
- **Tesseract OCR** — Only if needed for scanned images; otherwise PyMuPDF sufficient
- **MongoDB** — PostgreSQL as per user requirement

## Confidence Levels
- FastAPI + Next.js: High
- Resume parsing (PyMuPDF + AI): High
- Job scraping (jobspy): Medium (depends on anti-bot measures)
- Semantic matching: High

---
*Last updated: 2026-03-26 after research*