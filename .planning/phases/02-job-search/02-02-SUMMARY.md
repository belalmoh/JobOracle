---
phase: 02-job-search
plan: "02"
subsystem: job-scoring
tags: [backend, scoring, ollama, matching]
dependency_graph:
  requires: []
  provides: [job-scoring-api]
  affects: [job-list-api]
tech_stack:
  added: [FastAPI endpoints, Ollama REST API]
  patterns: [keyword-matching, semantic-similarity]
key_files:
  created: []
  modified: [backend/app/api/jobs.py]
decisions:
  - Used Ollama REST API instead of Python library for semantic similarity
  - Weighted scoring: 30% keyword overlap + 70% semantic similarity
  - Default sort by score descending for job list
metrics:
  duration_minutes: 5
  completed_date: "2026-03-28"
---

# Phase 02 Plan 02: Job Scoring Implementation

**One-liner:** Job compatibility scoring with keyword overlap and semantic similarity using Ollama

## Overview

Implemented job scoring and matching endpoints that calculate compatibility scores (0-100%) based on keyword overlap and semantic similarity using the Ollama LLM. Jobs are ranked by score by default.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create scoring endpoint for single job | Complete | 4e8540e |
| 2 | Create batch scoring endpoint | Complete | 4e8540e |
| 3 | Add ranking to job list endpoint | Complete | 4e8540e |

## Implementation Details

### Endpoints Added

1. **POST /api/jobs/score** - Score a single job
   - Request: `{ job_id: int }`
   - Returns: `{ job_id, score, matched_keywords, explanation }`
   - Updates job.compatibility_score and job.match_keywords in database

2. **POST /api/jobs/score-all** - Batch score all jobs
   - Request: `{ job_ids?: int[] }` (optional, scores all if not provided)
   - Returns: `{ jobs: [...], total_scored: int }`
   - Results sorted by score descending
   - Updates all jobs in database

3. **GET /api/jobs** - Enhanced with sorting and filtering
   - Added `sort` parameter: "score" (default), "date", "source"
   - Added `min_score` filter: minimum compatibility score (0-100)
   - Default sort by compatibility_score descending

### Scoring Algorithm

- **Keyword Overlap (30% weight)**: Simple word matching between job text and user keywords
- **Semantic Similarity (70% weight)**: Uses Ollama LLM (llama3.2) to evaluate job-resume match
- **Final Score**: Combined weighted score (0-100%)

### Match Explanation

When keywords match, the response includes an explanation like:
"Your keywords 'Python, React, AWS' match this job. Overall match: 85%"

## Verification

- [x] POST /api/jobs/score returns compatibility score
- [x] POST /api/jobs/score returns matched keywords
- [x] POST /api/jobs/score-all batches score all jobs
- [x] Jobs ranked by score by default
- [x] Match explanation shows which keywords matched

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Requirements Met

- [x] SCO-01: Each job has a compatibility score (0-100%)
- [x] SCO-02: Score combines keyword overlap and semantic similarity
- [x] SCO-03: Jobs are ranked by score
- [x] SCO-04: Match explanation shows which keywords matched

## Commits

- 4e8540e feat(02-job-search): implement job scoring endpoints
- fa8fe81 fix(02-job-search): remove duplicate score_all_jobs function

---
*Generated: 2026-03-28*
