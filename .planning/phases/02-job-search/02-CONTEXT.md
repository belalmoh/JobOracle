# Phase 2: Job Search - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement multi-platform job search, display, and filtering. Users can search jobs across multiple platforms, view them in different layouts, filter by various criteria, and see AI-powered compatibility scores. Includes three view modes: reels-like, flash-cards, and table view.

</domain>

<decisions>
## Implementation Decisions

### Job Sources
- **Library**: jobspy Python library for job aggregation
- **Platforms**: All major platforms (LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs)
- **Search trigger**: Auto-search when keywords or filters change

### Job Display
- **View modes**: Three options (user-selectable)
  1. **Reels-like** — Full-screen job cards with swipe/tap navigation (keyboard arrows on desktop)
  2. **Flash-cards** — Card-based layout with key info visible
  3. **Table view** — Traditional compact table with sortable columns
- **Job card content**: Full details (title, company, location, salary, source, description, requirements, apply link, match score)
- **Navigation in reels**: Swipe/tap on mobile, arrow keys on desktop

### Search & Filtering
- **UI**: Faceted filters sidebar
- **Filters available**:
  - Source (LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs)
  - Date range (past 24h, past week, past month, etc.)
  - Location (city, remote, etc.)
  - Salary range
  - Experience level (entry, mid, senior, lead)

### Scoring & Matching
- **Method**: Semantic similarity using AI (Ollama)
- **Comparison**: Job description vs user resume
- **Presentation**: Match score percentage + reasoning text (e.g., "Your skills in Python align with job requirements")

### Job Collections
- **Saved to apply later** — Jobs user saves for future application
- **Applied** — Jobs user has applied to
- **Viewed** — Jobs user scrolled past but not applied

### Duplicate Handling
- **Strategy**: Show all results with dedupe indicator (show duplicates but mark visually)

### Expired Jobs
- **Strategy**: Mark as expired, keep in history but don't show in active results

</decisions>

<specifics>
## Specific Ideas

- "I want it to be reels-like in tiktok, where you have a full view of the job and you navigate with the keyboard or side-arrows"
- Use jobspy Python library for job aggregation
- 3 view modes: reels-like, flash-cards, tabular

</specifics>

<canonical_refs>
## Canonical References

### Requirements
- `.planning/REQUIREMENTS.md` — JOB-01 to JOB-08, SCO-01 to SCO-04

### Phase 1 Context
- `.planning/phases/01-project-setup-resume-management/01-SUMMARY.md` — Completed resume management features

### Codebase
- `backend/app/models/models.py` — Job model definition
- `backend/app/api/jobs.py` — Empty stub to build upon
- `frontend/src/app/page.tsx` — Main page with existing UI components

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UploadDropzone`, `ParsedDataDisplay`, `KeywordInput`, `SettingsWizard` components
- `api` lib in `frontend/src/lib/api.ts` for API calls
- Job model already defined in `backend/app/models/models.py`
- Ollama already integrated for AI (Phase 1) — can reuse for semantic matching

### Established Patterns
- Tailwind CSS for styling
- shadcn/ui components
- SQLite with SQLAlchemy for data persistence
- FastAPI for backend

### Integration Points
- New `/api/jobs` endpoints needed (search, list, save)
- Job search component needs to integrate with existing page layout
- Settings already store job_sources — use those for search

</code_context>

<deferred>
## Deferred Ideas

- Auto-apply functionality — Phase 4
- Application tracking with status updates — Phase 3
- Notification system for new jobs — Phase 3

</deferred>

---

*Phase: 02-job-search*
*Context gathered: 2026-03-28*
