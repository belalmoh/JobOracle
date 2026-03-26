# Phase 1: Project Setup + Resume Management - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the project structure and implement resume upload, parsing, and keyword generation. User can upload PDF/DOCX resumes, AI parses them to extract skills/experience/education, keywords are auto-generated, and user can manually edit. Settings for job sources and notifications configured via setup wizard.

</domain>

<decisions>
## Implementation Decisions

### Resume Upload UI
- Full upload flow with dropzone, progress bar, immediate feedback
- On upload failure: Show detailed error message + retry option
- Auto-extract text on upload (immediate background processing)
- No filename validation - accept any filename
- 10MB hard file size limit

### Parsed Data Display
- Collapsible sections for Skills, Experience, Education
- Toggle to switch between parsed data and original extracted text
- Save with validation on edit (not auto-save), show success message
- Skills displayed as tags/chips

### Keyword Management
- Start with auto-generated keywords from resume + user can add more
- Enter key to add new keyword (press Enter after typing)
- Bulk edit via textarea with comma-separated keywords

### Settings Config
- Job sources: Checkbox list for each source (LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs)
- Settings accessed via setup wizard on first use
- In wizard: Preview + confirm before saving all settings

### File Format Handling
- Separate libraries: PyMuPDF for PDF, python-docx for DOCX
- Strict allowlist: Only accept PDF and DOCX, reject others with clear message + supported formats list

### AI Parsing Approach
- Start with free/available models (local or GPT-4o)
- Full extraction from resume (skills, experience, education, contact, summary, inferred preferences)
- Display full result (not streaming), show loading until complete

### Data Storage Schema
- Separate tables for resume, keywords, user settings
- Full storage: Store extracted text, parsed JSON, original file
- Parsed resume data in PostgreSQL JSONB column

### API Design
- Separate endpoints: Upload → Extract → Parse → Keywords as separate API calls
- RESTful API style (POST /upload, POST /extract, POST /parse, etc.)

### Claude's Discretion
- Exact UI component library choice (Tailwind + headless UI or similar)
- Database table exact schema
- API endpoint exact paths
- Error logging and monitoring approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack
- `.planning/research/STACK.md` — Tech stack decisions, libraries for PDF/DOCX parsing, AI models

### Requirements
- `.planning/REQUIREMENTS.md` — RES-01 to RES-07, SET-01 to SET-03

### Roadmap
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, requirements, success criteria

[If no external specs: "No external specs — requirements fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Stack research already identifies: PyMuPDF, python-docx, spaCy, SentenceTransformers, OpenAI/Gemini
- FastAPI backend, Next.js + Tailwind frontend

### Established Patterns
- JSONB for flexible structured data in PostgreSQL
- RESTful API conventions

### Integration Points
- Frontend: Upload component → API endpoint → Resume storage
- Backend: File processing pipeline (extract → parse → keywords)
- Settings stored in user preferences table

</code_context>

<specifics>
## Specific Ideas

- "Start with free and available models" for AI parsing
- Setup wizard on first use (not single settings page)
- Toggle between parsed data and source text view

</specifics>

<deferred>
## Deferred Ideas

- Auto-apply via Playwright — Phase 4
- Job search functionality — Phase 2
- Scoring/matching — Phase 2/3

</deferred>

---

*Phase: 01-project-setup-resume-management*
*Context gathered: 2026-03-26*
