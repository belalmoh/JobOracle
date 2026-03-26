# Pitfalls Research: JobOracle

## Common Mistakes to Avoid

### 1. Job Scraping Blocks
**Problem**: Job sites (LinkedIn, Indeed) detect and block scrapers.
**Warning Signs**: 
- 403 errors after several requests
- Captcha challenges
- Empty results unexpectedly

**Prevention**:
- Use rate limiting (10 requests/minute max)
- Rotate user agents
- Add delays between requests
- Use jobspy which handles this
- Consider API alternatives where available

**Phase**: Phase 2 (Job Service)

### 2. Resume Parsing Failures
**Problem**: AI parsing fails on non-standard resume formats.
**Warning Signs**:
- Incomplete skill extraction
- Missing experience sections
- Garbled text output

**Prevention**:
- Fallback to basic PyMuPDF text extraction if AI fails
- Validate extracted data completeness
- Allow manual keyword addition
- Test with various resume formats

**Phase**: Phase 1 (Resume Service)

### 3. Match Score Inaccuracy
**Problem**: Resume-to-job scoring gives misleading percentages.
**Warning Signs**:
- Jobs with 0% match that are relevant
- High scores for irrelevant jobs
- User complaints about scoring

**Prevention**:
- Combine keyword overlap + semantic similarity
- Weight skills more than job title keywords
- Allow user feedback on score accuracy
- Display match reasoning (which keywords matched)

**Phase**: Phase 2 (Matching Service)

### 4. Auto-Apply Account Bans
**Problem**: Job sites ban accounts that use automation.
**Warning Signs**:
- Account suddenly blocked
- Cannot login anymore
- Form submission fails repeatedly

**Prevention**:
- Use dedicated "job search" accounts for automation
- Add randomization to form filling
- Limit auto-apply volume per day
- Add human-like delays between actions
- Allow user to pause/stop anytime

**Phase**: Phase 3 (Playwright Service)

### 5. Data Privacy Issues
**Problem**: Storing resume data insecurely.
**Warning Signs**:
- Logs containing resume content
- Database without encryption
- API responses exposing sensitive data

**Prevention**:
- Don't log resume content
- Use environment variables for API keys
- Sanitize error messages
- Consider encrypting resume data at rest
- Local-only storage (no cloud)

**Phase**: All phases

### 6. Notification Fatigue
**Problem**: Too many notifications annoy users.
**Warning Signs**:
- User turns off all notifications
- Complaints about spam
- Low notification open rate

**Prevention**:
- Batch notifications (daily digest vs instant)
- Let user configure frequency
- Only notify on meaningful events
- Easy unsubscribe in every notification

**Phase**: Phase 2 (Notification Service)

### 7. Scope Creep
**Problem**: Building too many features before core works.
**Warning Signs**:
- 6+ months without shipping
- Multiple incomplete features
- Feature requests for "nice to have"

**Prevention**:
- Strict v1 scope definition
- Defer differentiators to v2
- Launch with 80% of features, iterate
- Regular scope review

**Phase**: Planning/Roadmap

## Phase Mapping

| Pitfall | Phase to Address |
|---------|------------------|
| Scraping blocks | Phase 2 |
| Parsing failures | Phase 1 |
| Score inaccuracy | Phase 2 |
| Auto-apply bans | Phase 3 |
| Privacy issues | Phase 1 |
| Notification fatigue | Phase 2 |
| Scope creep | Planning |

---
*Last updated: 2026-03-26 after research*