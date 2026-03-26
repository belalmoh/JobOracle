---
created: 2026-03-26T19:50:16.770Z
title: Fix Phase 1 UAT Issues
area: frontend
files:
  - src/components/settings/SettingsWizard.tsx
  - backend/app/api/parse.py
---

## Problem

Two issues found during UAT testing:

1. **Stepper visual bug**: In SettingsWizard, the connecting lines between step circles are broken/visually cut in half
2. **Resume parsing incomplete**: Parsing only extracts skills, but not experience, education, or summary from resume text
3. **Error handling**: Uploading a non-resume PDF causes "keyword generation failed" error instead of graceful handling

## Solution

1. Fix CSS/layout in SettingsWizard stepper - likely height/width issue with the connecting div lines
2. Enhance parse.py to extract experience, education sections from resume using pattern matching
3. Add try-catch in keyword generation to handle cases where parsed data is empty/incomplete