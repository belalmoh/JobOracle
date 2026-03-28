# Requirements: JobOracle

**Defined:** 2026-03-26
**Core Value:** Help job seekers land interviews faster by automating the tedious parts of job hunting — finding relevant positions, scoring them against their profile, tracking applications, and optionally auto-applying.

## v1 Requirements

### Resume Management

- [ ] **RES-01**: User can upload resume (PDF format)
- [ ] **RES-02**: User can upload resume (DOCX format)
- [ ] **RES-03**: System extracts text from uploaded resume
- [ ] **RES-04**: System parses resume using AI to extract skills, experience, education
- [ ] **RES-05**: System auto-generates keywords from parsed resume
- [ ] **RES-06**: User can view parsed resume data
- [ ] **RES-07**: User can manually add/edit keywords

### Job Search

- [ ] **JOB-01**: User can configure job sources (LinkedIn, Indeed, ZipRecruiter, Glassdoor, Google Jobs)
- [ ] **JOB-02**: User can enter search keywords (manual or from resume)
- [ ] **JOB-03**: User can set location filter (city, remote, etc.)
- [ ] **JOB-04**: System searches multiple job platforms simultaneously
- [ ] **JOB-05**: System removes duplicate job listings
- [x] **JOB-06**: User can view list of matching jobs (title, company, location, source, date)
- [x] **JOB-07**: User can view full job details (description, requirements, apply link)
- [x] **JOB-08**: User can filter job list by source, date, location

### Scoring/Matching

- [ ] **SCO-01**: System calculates compatibility score between resume and job
- [ ] **SCO-02**: Score combines keyword overlap + semantic similarity
- [ ] **SCO-03**: Jobs are ranked by match score
- [ ] **SCO-04**: User can see which keywords matched (match explanation)

### Application Tracking

- [ ] **APP-01**: User can manually add an application (from any job)
- [ ] **APP-02**: User can set application status (Applied, Pending, Rejected, Interview)
- [ ] **APP-03**: User can add notes to an application
- [ ] **APP-04**: User can view application history (all applications)
- [ ] **APP-05**: User can filter applications by status

### Notifications

- [ ] **NOT-01**: User can configure email notifications
- [ ] **NOT-02**: User receives notification when new matching jobs found
- [ ] **NOT-03**: User can configure browser notifications
- [ ] **NOT-04**: User can set notification frequency (instant, daily digest)

### Manual Apply

- [ ] **APL-01**: User can click apply and open job site in new tab
- [ ] **APL-02**: User can quickly copy resume text for manual pasting

### Auto-Apply (Playwright)

- [ ] **AUTO-01**: User can enable auto-apply feature
- [ ] **AUTO-02**: System uses Playwright to fill application forms
- [ ] **AUTO-03**: System submits application automatically
- [ ] **AUTO-04**: Auto-apply respects rate limits to avoid account bans
- [ ] **AUTO-05**: User can pause/stop auto-apply at any time

### Settings

- [ ] **SET-01**: User can configure job sources to use
- [ ] **SET-02**: User can set default search parameters
- [ ] **SET-03**: User can manage notification preferences

## v2 Requirements

### AI Features
- **AI-01**: AI-powered job suggestions based on profile
- **AI-02**: Resume optimization tips for specific jobs

### Advanced Features
- **ADV-01**: Export applications to CSV
- **ADV-02**: Application analytics (success rate, time to response)
- **ADV-03**: Company insights (size, funding)

### Browser Extension
- **EXT-01**: Auto-fill forms on job sites (browser extension)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user accounts | Local-only for v1 |
| Cloud sync | Privacy-focused, local storage |
| Cover letter generation | Add after core is solid |
| Interview prep AI | Beyond v1 scope |
| Salary database | External API needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RES-01 to RES-07 | Phase 1 | Pending |
| JOB-01 to JOB-08 | Phase 2 | Pending |
| SCO-01 to SCO-04 | Phase 2 | Pending |
| APP-01 to APP-05 | Phase 3 | Pending |
| NOT-01 to NOT-04 | Phase 3 | Pending |
| APL-01 to APL-02 | Phase 3 | Pending |
| AUTO-01 to AUTO-05 | Phase 4 | Pending |
| SET-01 to SET-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*