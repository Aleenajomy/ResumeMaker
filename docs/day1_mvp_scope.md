# Day 1 MVP Scope Freeze

Date: 2026-02-24
Project: ResumeMaker
Target: Simple ATS Resume Maker (MVP)

## 1) MVP Goal
Build one focused flow where a user provides a base resume + job description and gets:
- Tailored resume in PDF
- Tailored cover letter in PDF
- Professional copy-ready email template

## 2) In Scope (MVP)
- Authentication (existing)
- Resume source from dashboard upload or one-time upload
- Job description input
- One-click generation endpoint: `POST /api/resume-optimizer/generate/`
- ATS score + matched/missing keywords display
- Download tailored resume PDF
- Download cover letter PDF
- Copy email subject/body

## 3) Out of Scope (MVP)
- Multi-template builder
- Billing/subscription features
- Resume version history UI
- Standalone "Cover Letter" and "Email Template" pages
- ATS deep analytics or semantic scoring platform
- Certification auto-injection into resume optimization

## 4) Non-Negotiable Editing Rule
Only these resume areas may be changed by AI:
- Headline
- Summary
- Skills

These must remain unchanged:
- Experience
- Projects
- Education

## 5) MVP User Flow
1. Login
2. Open Resume Optimizer
3. Provide company name, job title, job description (requirements optional)
4. Select existing resume or upload new one
5. Click Generate
6. Download resume PDF + cover letter PDF
7. Copy professional email

## 6) Primary API Contract (Frozen)
Endpoint:
- `POST /api/resume-optimizer/generate/`

Request (`multipart/form-data`):
- `company_name` (required, min length 2)
- `job_title` (required, min length 2)
- `job_description` (required, min length 50)
- `requirements` (optional)
- `resume_id` (optional if `resume_file` is provided)
- `resume_file` (optional if `resume_id` is provided; pdf/docx/txt/tex)

Response (`201`):
- `document`

`document` fields used by frontend:
- `resume_pdf`
- `cover_letter_pdf`
- `email_subject`
- `email_body`
- `ats_score`
- `matched_keywords`
- `missing_keywords`
- `ai_changes`
- `diff_json`
- `tailored_resume_tex` (only when LaTeX path is used)
- `is_latex_based`

## 7) Output Format Decision
Day 1 decision: Resume PDF + Cover Letter PDF only for MVP speed.

Post-MVP option:
- Add DOCX cover letter export after MVP stabilization.

## 8) Keep vs Remove (For Day 2)
Keep:
- `/login`
- `/resume-optimizer`
- Minimal entry page routing to optimizer

Remove/Hide from MVP nav:
- `/cover-letter` placeholder route
- `/email-template` placeholder route
- Non-essential dashboard cards that imply separate products

## 9) Backend Focus (For Day 3-4)
- Keep `/api/resume-optimizer/generate/` as primary path
- Treat old split endpoints as legacy/internal for now
- Enforce section-lock behavior for all resume types
- Ensure LaTeX path does not modify certifications in MVP mode

## 10) Day 2-4 Tickets

Ticket D2-1: Frontend MVP Route Cleanup
- Remove "Coming Soon" routes/pages from active UX
- Keep one clear CTA to optimizer
- Acceptance: no dead-end routes in UI

Ticket D3-1: Single Endpoint Contract Hardening
- Validate request errors consistently
- Standardize error payloads for frontend
- Acceptance: predictable `error` message in failed requests

Ticket D4-1: Section-Lock Enforcement
- Guarantee only headline/summary/skills can change
- Guarantee experience/projects/education cannot change
- Acceptance: automated check fails if protected sections change

Ticket D4-2: Disable Certification Injection in MVP
- Remove certification updates from optimizer generation path
- Acceptance: generated resume no longer auto-inserts certification items
