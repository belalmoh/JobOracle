# Research Summary: JobOracle

## Key Findings

### Stack
- **Frontend**: Next.js + Tailwind (user preference)
- **Backend**: FastAPI + PostgreSQL (user preference)
- **Resume Parsing**: PyMuPDF + OpenAI/Gemini for AI extraction
- **Job Scraping**: jobspy library (multi-platform)
- **Matching**: SentenceTransformers (all-MiniLM-L6-v2)
- **Auto-apply**: Playwright

### Table Stakes
1. Resume upload + parsing (PDF/DOCX)
2. Multi-platform job search (LinkedIn, Indeed, etc.)
3. Resume-to-job scoring
4. Application tracking
5. Basic notifications

### Watch Out For
1. **Scraping blocks** — Rate limiting, user agent rotation
2. **Parsing failures** — Fallback to basic extraction
3. **Score inaccuracy** — Combine keyword + semantic matching
4. **Auto-apply bans** — Use dedicated accounts, add delays
5. **Privacy** — Local-only storage, no logging sensitive data

## Build Order
1. Project setup + Resume upload/parsing
2. Job search + display
3. Scoring + Tracking + Notifications
4. Auto-apply + Advanced features

## Files
- `.planning/research/STACK.md` — Tech stack recommendations
- `.planning/research/FEATURES.md` — Feature categories
- `.planning/research/ARCHITECTURE.md` — Component design
- `.planning/research/PITFALLS.md` — Common mistakes to avoid

---
*Last updated: 2026-03-26 after research*