# JobOracle

## What This Is

A personal job search automation platform that helps job seekers find, score, and apply to relevant positions. Users drop their resume, specify keywords (auto-generated from parsing), select job sources, and get a curated list of matching jobs with compatibility scores.

## Core Value

Help job seekers land interviews faster by automating the tedious parts of job hunting — finding relevant positions, scoring them against their profile, tracking applications, and optionally auto-applying.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Resume upload and parsing (extract skills, experience, keywords)
- [ ] Auto keyword generation from parsed resume
- [ ] Job source configuration (LinkedIn, Indeed, etc.)
- [ ] Job search across configured sources
- [ ] Job list display with filters
- [ ] Resume-to-job compatibility scoring
- [ ] Application tracking (applied, pending, rejected)
- [ ] Notification system (email, browser)
- [ ] Manual apply workflow
- [ ] Auto-apply via Playwright

### Out of Scope

- [Browser extension] — Auto-fill feature deferred to future
- [Multi-user / Cloud] — Local-only for v1
- [AI interview prep] — Not in initial scope

## Context

- Personal project to test while actively job seeking
- First version: self-hosted web app (can run locally or deploy)
- User is technical (can debug, run dev servers)
- Goal: Ship fast, validate with real usage, then open to others

## Constraints

- **Data Storage**: Local-only (privacy-focused, no cloud for v1)
- **Platform**: Web application
- **Tech Stack**: Next.js + Tailwind (frontend), FastAPI + PostgreSQL (backend)
- **Auto-apply**: Playwright-based browser automation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local storage only | Privacy, first version for self-use | — Pending |
| Web app (not desktop) | Easier to deploy, access anywhere | — Pending |
| Next.js + FastAPI split | User preference for Python backend | — Pending |

---
*Last updated: 2026-03-26 after initialization*