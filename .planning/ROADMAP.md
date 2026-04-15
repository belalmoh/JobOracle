# Roadmap: JobOracle

**Created:** 2026-03-26
**Phases:** 6 | **Requirements:** 31+ | **Mode:** Interactive

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Project Setup + Resume | Upload and parse resumes, generate keywords | RES-01 to RES-07, SET-01 to SET-03 | 5 ✓ |
| 2 | Browser Extension | Auto-fill job forms, score matching, resume suggestions | NEW | TBD |
| 3 | Job Search | Search multiple platforms, display and filter jobs | JOB-01 to JOB-08 | 8 ✓ |
| 4 | Scoring + Tracking | Match resume to jobs, track applications, notify | SCO-01 to SCO-04, APP-01 to APP-05, NOT-01 to NOT-04, APL-01 to APL-02 | 11 |
| 5 | Auto-Apply | Automate application submission via Playwright | AUTO-01 to AUTO-05 | 5 |
| 6 | Polish | Error handling, performance, refinements | All | 2 |

## Phase Details

### Phase 1: Project Setup + Resume Management

**Goal:** Set up the project structure and implement resume upload, parsing, and keyword generation.

**Status:** ✓ Complete (2026-03-26)

**Requirements:**
- RES-01: Upload PDF resume
- RES-02: Upload DOCX resume
- RES-03: Extract text from resume
- RES-04: AI parse resume (skills, experience, education)
- RES-05: Auto-generate keywords
- RES-06: View parsed resume data
- RES-07: Manual keyword editing
- SET-01: Configure job sources
- SET-02: Default search parameters
- SET-03: Notification preferences

**Success Criteria:**
1. User can upload PDF and see extracted text
2. User can upload DOCX and see extracted text
3. AI successfully parses resume and extracts skills
4. Keywords are auto-generated and displayed
5. User can add/edit keywords manually

**Dependencies:** None

---

### Phase 2: Browser Extension

**Goal:** Browser extension for auto-filling job forms, score matching with resume, suggesting enhancements, and generating tailored resumes for specific jobs.

**Status:** Not Started

**Requirements:**
- EXT-01: Auto-fill forms on job sites (browser extension)
- EXT-02: Score matching against user resume
- EXT-03: Suggest resume enhancements for specific jobs
- EXT-04: Generate tailored resume for job posting

**Success Criteria:**
1. Extension works on major job sites (LinkedIn, Indeed, etc.)
2. Auto-fill populated from user resume data
3. Match score calculated when viewing job
4. Resume suggestions generated based on job requirements
5. One-click tailored resume generation

**Dependencies:** Phase 1 complete

---

### Phase 3: Job Search

**Goal:** Implement multi-platform job search, display, and filtering.

**Status:** ✓ Complete (3/3 plans complete)

**Requirements:**
- JOB-01: Configure job sources (LinkedIn, Indeed, etc.)
- JOB-02: Enter search keywords
- JOB-03: Set location filter
- JOB-04: Search multiple platforms
- JOB-05: Remove duplicates
- JOB-06: View job list (title, company, location, source, date)
- JOB-07: View job details (description, requirements, apply link)
- JOB-08: Filter by source, date, location

**Success Criteria:**
1. User can select which job sources to use
2. Job search returns results from multiple platforms
3. Duplicate jobs are filtered out
4. Job list displays all required information
5. User can click job to see full details
6. Filters work correctly (source, date, location)

**Dependencies:** Phase 1 complete

**Plans:**
- [x] 03-01-PLAN.md — Backend: Job Search API & Integration (Complete)
- [x] 03-02-PLAN.md — Backend: Job Scoring & Matching (Complete)
- [x] 03-03-PLAN.md — Frontend: Job Search UI (Complete)

---

### Phase 4: Scoring + Application Tracking + Notifications

**Goal:** Implement resume-to-job matching, application tracking, and notifications.

**Requirements:**
- SCO-01: Calculate compatibility score
- SCO-02: Combine keyword + semantic similarity
- SCO-03: Rank jobs by score
- SCO-04: Show match explanation
- APP-01: Manually add application
- APP-02: Set application status
- APP-03: Add notes to application
- APP-04: View application history
- APP-05: Filter by status
- NOT-01: Configure email notifications
- NOT-02: New job notifications
- NOT-03: Browser notifications
- NOT-04: Notification frequency
- APL-01: Open apply link in new tab
- APL-02: Copy resume text

**Success Criteria:**
1. Each job shows a match score (0-100%)
2. Match explanation shows which keywords matched
3. User can add applications manually
4. User can track status (Applied, Pending, Rejected, Interview)
5. User receives notifications for new matching jobs

**Dependencies:** Phase 1 + Phase 3 complete

---

### Phase 5: Auto-Apply

**Goal:** Implement automated application submission using Playwright.

**Requirements:**
- AUTO-01: Enable auto-apply feature
- AUTO-02: Fill forms with resume data
- AUTO-03: Submit applications automatically
- AUTO-04: Rate limiting to avoid bans
- AUTO-05: Pause/stop auto-apply

**Success Criteria:**
1. User can enable auto-apply for selected jobs
2. Playwright fills forms correctly
3. Applications are submitted successfully
4. Rate limiting prevents account bans
5. User can stop auto-apply at any time

**Dependencies:** Phase 1 + Phase 4 complete

---

### Phase 6: Polish

**Goal:** Error handling, performance optimization, and refinements.

**Requirements:**
- All requirements from previous phases

**Success Criteria:**
1. Graceful error handling throughout
2. Good performance (fast load times, responsive UI)
3. Edge cases handled (empty states, large datasets)

**Dependencies:** Phase 1-5 complete

---

## Traceability

All v1 requirements mapped to phases above.

## Notes

- Phase 2 (Browser Extension) added 2026-04-15
- Phase 6 is about polish/refinement - no new requirements
- Auto-apply is complex - may need iteration
- Notifications can be basic in v1, enhance in future

---
*Created: 2026-03-26*
*Last updated: 2026-04-15 after milestone restructure*