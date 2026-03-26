# Features Research: JobOracle

## Overview
Feature categories for job search automation platforms — table stakes vs differentiators.

## Table Stakes (Must Have)

### Resume Management
- **Resume upload** — PDF, DOCX support
- **Resume parsing** — Extract name, contact, experience, education, skills
- **Multiple resume versions** — Store and manage different resumes

### Job Search
- **Multi-platform search** — LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs
- **Keyword-based search** — User-defined keywords
- **Location filtering** — Remote, specific locations
- **Date filters** — Past 24h, 7 days, etc.
- **Job deduplication** — Remove duplicate listings

### Job Display & Filtering
- **Job list view** — Title, company, location, date, source
- **Filters** — Location, date, source, salary range
- **Job detail view** — Full description, requirements, apply link

### Scoring/Matching
- **Resume-to-Job matching** — Keyword overlap, semantic similarity
- **Score display** — Percentage or numeric score
- **Match explanation** — Why match/no-match

### Application Tracking
- **Track applications** — Applied, Pending, Rejected, Interview
- **Notes per application** — Add notes
- **Application history** — View past applications

### Basic Notifications
- **New job alerts** — When new matching jobs found

## Differentiators (Competitive Advantage)

### AI-Powered Features
- **Auto-generated keywords** — From resume parsing (YOUR SPICE)
- **Smart job suggestions** — Based on profile, not just keywords
- **Resume optimization tips** — How to improve for specific jobs

### Automation
- **Auto-apply via browser** — Playwright automation (YOUR SPICE)
- **Auto-fill forms** — Browser extension (future)
- **Cover letter generation** — AI-generated per job

### Advanced Features
- **Company insights** — Size, funding, reviews
- **Salary estimation** — From job posts or external data
- **Application analytics** — Success rate, time to response
- **Interview scheduling** — Calendar integration

### User Experience
- **Dark mode** — UI theme
- **Keyboard shortcuts** — Power user features
- **Export data** — CSV, JSON export

## Anti-Features (NOT Building)

| Feature | Reason |
|---------|--------|
| Multi-user accounts | Local-only for v1 |
| Browser extension | Defer to future |
| Cover letter generation | Add after core is solid |
| Interview prep AI | Beyond v1 scope |
| Salary database | External API needed |

## Feature Dependencies

```
Resume Upload (required for everything)
    ↓
Resume Parsing → Keyword Generation → Job Search
    ↓                                    ↓
Scoring ← Job Results ← Application Tracking
    ↓
Notifications
```

## Complexity Notes

- **Easy**: Resume upload, basic job list, simple filters
- **Medium**: Resume parsing, job scraping, basic scoring
- **Hard**: AI parsing, semantic matching, auto-apply

---
*Last updated: 2026-03-26 after research*