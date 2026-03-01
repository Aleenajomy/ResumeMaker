# Day 1 Audit Notes

Date: 2026-02-24

## Frontend Audit

Keep for MVP:
- `/login`
- `/resume-optimizer`
- Primary generate UI in `frontend/src/pages/Home.tsx`

Needs cleanup on Day 2:
- Placeholder routes still present:
  - `/cover-letter`
  - `/email-template`
- Homepage cards that imply separate product modules:
  - Cover Letter
  - Email Templates

Reference files:
- `frontend/src/App.tsx`
- `frontend/src/pages/HomePage.tsx`

## Backend Audit

Primary path for MVP:
- `POST /api/resume-optimizer/generate/`

Legacy/split resources currently also exposed:
- `/api/resumes/`
- `/api/job-descriptions/`
- `/api/optimized-resumes/`
- `/api/cover-letters/`
- `/api/jobs/`
- `/api/generated-documents/`

Reference files:
- `backend/api/urls.py`
- `backend/api/views.py`

## Risk Notes Captured for Day 3-4
- Ensure non-LaTeX flow also respects section-lock constraints.
- Remove certification auto-injection from MVP optimization path.
- Standardize error payloads for frontend consumption.

