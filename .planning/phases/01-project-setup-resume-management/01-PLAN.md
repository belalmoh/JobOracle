# Phase 1 Plan: Project Setup + Resume Management

**Phase:** 1 | **Status:** Ready for execution | **Created:** 2026-03-26

## Objective

Set up the project structure and implement resume upload, parsing, and keyword generation. Also configure settings via setup wizard.

## Tasks

### 1. Project Infrastructure Setup

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 1.1 | Initialize Next.js frontend with shadcn/ui | — | ⬜ |
| 1.2 | Set up FastAPI backend with PostgreSQL | — | ⬜ |
| 1.3 | Configure database schema | — | ⬜ |
| 1.4 | Set up authentication (session-based, local-only) | — | ⬜ |

### 2. Resume Upload (RES-01, RES-02)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 2.1 | Create drag-and-drop upload component | UI-SPEC: Dropzone | ⬜ |
| 2.2 | Implement PDF upload endpoint | RES-01 | ⬜ |
| 2.3 | Implement DOCX upload endpoint | RES-02 | ⬜ |
| 2.4 | Add file validation (PDF/DOCX only, 10MB limit) | CONTEXT | ⬜ |
| 2.5 | Add progress indicator | UI-SPEC: Progress Bar | ⬜ |
| 2.6 | Handle upload errors with toast | UI-SPEC: Error Toast | ⬜ |

### 3. Text Extraction (RES-03)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 3.1 | Integrate PyMuPDF for PDF text extraction | Stack | ⬜ |
| 3.2 | Integrate python-docx for DOCX extraction | Stack | ⬜ |
| 3.3 | Create /api/extract endpoint | API Design | ⬜ |
| 3.4 | Store extracted text in database | Schema | ⬜ |

### 4. AI Resume Parsing (RES-04)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 4.1 | Create /api/parse endpoint | API Design | ⬜ |
| 4.2 | Integrate AI model (free/available) | CONTEXT | ⬜ |
| 4.3 | Parse: skills, experience, education, contact, summary | RES-04 | ⬜ |
| 4.4 | Store parsed data in JSONB column | Schema | ⬜ |
| 4.5 | Add loading state while parsing | CONTEXT | ⬜ |

### 5. Keyword Generation (RES-05)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 5.1 | Extract keywords from parsed resume | RES-05 | ⬜ |
| 5.2 | Create /api/keywords/generate endpoint | API Design | ⬜ |
| 5.3 | Store keywords in database | Schema | ⬜ |
| 5.4 | Return keywords to frontend | — | ⬜ |

### 6. Parsed Data Display (RES-06)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 6.1 | Create collapsible sections (Skills, Experience, Education) | UI-SPEC | ⬜ |
| 6.2 | Add view toggle (parsed vs source text) | UI-SPEC | ⬜ |
| 6.3 | Display skills as tags/chips with remove | UI-SPEC | ⬜ |
| 6.4 | Add save with validation on edit | CONTEXT | ⬜ |

### 7. Keyword Management (RES-07)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 7.1 | Create keyword input with Enter key handler | UI-SPEC | ⬜ |
| 7.2 | Implement bulk edit modal (comma-separated) | UI-SPEC | ⬜ |
| 7.3 | Create /api/keywords endpoint (GET/POST/PUT) | API Design | ⬜ |
| 7.4 | Add success message on save | CONTEXT | ⬜ |

### 8. Settings/Setup Wizard (SET-01, SET-02, SET-03)

| # | Task | Requirements | Status |
|---|------|--------------|--------|
| 8.1 | Create multi-step wizard component | UI-SPEC | ⬜ |
| 8.2 | Job source selection (checkboxes) | SET-01, UI-SPEC | ⬜ |
| 8.3 | Default search parameters form | SET-02 | ⬜ |
| 8.4 | Notification preferences form | SET-03 | ⬜ |
| 8.5 | Preview screen before save | UI-SPEC | ⬜ |
| 8.6 | Store settings in database | Schema | ⬜ |
| 8.7 | Trigger wizard on first use | CONTEXT | ⬜ |

## Dependencies

```
1.1 → 1.2 → 1.3 → 1.4
  ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6
  ↓
3.1 → 3.2 → 3.3 → 3.4
  ↓
4.1 → 4.2 → 4.3 → 4.4 → 4.5
  ↓
5.1 → 5.2 → 5.3 → 5.4
  ↓
6.1 → 6.2 → 6.3 → 6.4
  ↓
7.1 → 7.2 → 7.3 → 7.4
  ↓
8.1 → 8.2 → 8.3 → 8.4 → 8.5 → 8.6 → 8.7
```

## Implementation Order

1. **Week 1**: Infrastructure (1.1–1.4) + Upload (2.1–2.6)
2. **Week 2**: Extraction (3.1–3.4) + Parsing (4.1–4.5)
3. **Week 3**: Keywords (5.1–5.4) + Display (6.1–6.4) + Management (7.1–7.4)
4. **Week 4**: Settings wizard (8.1–8.7) + Integration + Testing

## Success Criteria

From ROADMAP.md:
- [ ] User can upload PDF and see extracted text
- [ ] User can upload DOCX and see extracted text
- [ ] AI successfully parses resume and extracts skills
- [ ] Keywords are auto-generated and displayed
- [ ] User can add/edit keywords manually
- [ ] Settings configured via wizard on first use

---

*Plan created: 2026-03-26*