# Architecture Research: JobOracle

## Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + Tailwind)             │
│  /dashboard  /jobs  /resume  /applications  /settings      │
└─────────────────────────────────────────────────────────────┘
                              ↓↑ REST API
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI + PostgreSQL)           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Resume   │  │   Job    │  │ Matching │  │   App    │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Notify   │  │  Play    │  │   AI     │                │
│  │ Service  │  │ wright   │  │ Service  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│              External Services (Job Boards, AI)             │
│  LinkedIn | Indeed | ZipRecruiter | Glassdoor | OpenAI    │
└─────────────────────────────────────────────────────────────┘
```

## Service Boundaries

### Resume Service
- **Upload**: Handle PDF/DOCX uploads
- **Parse**: Extract text, parse with AI
- **Store**: Save to database with metadata
- **Keywords**: Generate keywords from parsed data

### Job Service
- **Search**: Query job boards via jobspy
- **Scrape**: Get job details from URLs
- **Deduplicate**: Remove duplicates by URL/hash
- **Store**: Save to database

### Matching Service
- **Score**: Calculate resume-to-job match percentage
- **Rank**: Sort jobs by score
- **Explain**: Provide match reasoning

### Application Service
- **Track**: CRUD for applications
- **Status**: Applied/Pending/Rejected/Interview
- **Notes**: Add notes to applications
- **History**: Query application history

### Notification Service
- **Email**: Send via SMTP or API (SendGrid, etc.)
- **Browser**: Web push notifications

### Playwright Service
- **Auto-apply**: Fill forms, submit applications
- **Login**: Handle auth on job sites
- **Captcha**: Handle or skip

### AI Service
- **Parse**: Extract structured data from resume text
- **Summarize**: Generate job summaries
- **Suggest**: Recommend improvements

## Data Flow

### 1. Resume Upload Flow
```
User uploads PDF → FastAPI receives → PyMuPDF extracts text → 
AI parses (OpenAI) → Extract skills/experience → Save to DB → 
Generate keywords → Return to UI
```

### 2. Job Search Flow
```
User enters keywords → API receives → Job Service queries jobspy → 
Get results → Deduplicate → Save to DB → 
Matching Service scores → Return ranked list to UI
```

### 3. Application Tracking Flow
```
User clicks "Apply" → API creates application → 
User updates status → Application Service updates → 
Notification Service checks → Send alerts if configured
```

### 4. Auto-Apply Flow
```
User enables auto-apply → Playwright launches → 
Login to job site (stored credentials) → 
Navigate to job → Fill form (resume data) → Submit → 
Update application status
```

## Build Order

### Phase 1: Foundation
1. Project setup (Next.js + FastAPI + PostgreSQL)
2. Resume upload + basic parsing
3. Job search + display (manual search first)

### Phase 2: Core Features
4. Resume-to-job scoring
5. Application tracking
6. Basic notifications

### Phase 3: Automation
7. Auto-apply via Playwright
8. Advanced keyword generation
9. Enhanced notifications

### Phase 4: Polish
10. UI improvements
11. Error handling
12. Performance optimization

## Database Schema (High-Level)

```
users
  - id, email, settings

resumes
  - id, user_id, filename, parsed_data, keywords, created_at

jobs
  - id, source, title, company, location, url, description, scraped_at

applications
  - id, user_id, job_id, resume_id, status, notes, applied_at

keywords
  - id, resume_id, keyword, source (manual/auto)

settings
  - id, user_id, notifications, sources, etc.
```

---
*Last updated: 2026-03-26 after research*