# ResumeMaker Project Report

Report date: March 12, 2026

## 1. Executive Summary

ResumeMaker is a full-stack ATS resume assistant built around a Django REST backend and a React/Vite frontend. The current primary product flow is a LaTeX-first resume optimization pipeline: the user uploads a base `.tex` resume, supplies job details, and receives a tailored resume PDF, cover letter PDF and DOCX, a professional email template, ATS scoring, and a token-level diff.

The project is beyond prototype stage in terms of feature breadth. It has working authentication, profile management, certification management, resume upload, AI-driven document generation, LaTeX compilation support, and deployment configuration for Railway and Vercel-style frontend hosting.

The main gap is alignment between the current product flow and the persistence/data model layer. The live optimizer endpoint returns generated artifacts but does not persist `Job` or `GeneratedDocument` records, while several legacy models and endpoints still exist. Security hardening and production media handling also need attention.

## 2. Project Snapshot

- Repository size: 89 tracked files
- Backend source: 54 Python files, about 5,599 lines
- Frontend source: 17 TypeScript/TSX files, about 2,637 lines
- Backend test classes: 11
- Current backend test run: 25 tests executed, 1 failing
- Current frontend build status: production build passes

## 3. Product Purpose

The application helps a candidate generate a job-specific application package from a base resume. Based on the current implementation, the intended user journey is:

1. Register or log in.
2. Fill profile details in the dashboard.
3. Upload a LaTeX resume.
4. Open the Resume Optimizer page.
5. Paste company and job details.
6. Generate tailored documents.
7. Download the tailored resume PDF, cover letter PDF/DOCX, and copy the generated email.

## 4. Current Architecture

### Frontend

Stack:

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion

Main frontend routes:

- `/login`
- `/forgot-password`
- `/reset-password`
- `/resume-optimizer`
- `/dashboard`
- `/profile-view`
- `/certifications`

Frontend responsibilities:

- JWT-based auth state using `localStorage`
- Protected-route enforcement
- Resume upload
- Profile editing
- Certification CRUD
- Resume optimizer form submission
- Downloading generated artifacts
- Presenting ATS score and resume diff

Notable frontend behavior:

- The optimizer UI only works with resumes that have a `latex_file`.
- The app exposes `ProfileView` and `Certifications` routes, but the sidebar currently links only to Dashboard and Resume Optimizer.
- Downloads from the optimizer are handled well because the backend returns data URLs or authenticated fetches.
- Direct file viewing in Dashboard/Profile/Certifications relies on raw media URLs and may fail in production if media files are not publicly served.

### Backend

Stack:

- Django 4.2
- Django REST Framework
- Simple JWT
- PostgreSQL
- OpenAI SDK with OpenAI-compatible base URL support
- Celery + Redis configuration
- `pypdf`, `python-docx`, `reportlab`
- LaTeX compiler integration (`xelatex`, `tectonic`, `lualatex`, `pdflatex`)

Backend app structure:

- `accounts`: custom user model
- `profiles`: personal details and skill profile
- `certifications`: certification CRUD with optional media
- `api`: resumes, optimizer flow, AI service, PDF service, legacy resume/JD endpoints
- `config`: Django settings, routing, Celery bootstrap

### Deployment

Current deployment-related assets:

- Root `Dockerfile`
- `backend/Dockerfile`
- `railway.json`
- `nixpacks.toml`
- `frontend/vercel.json`

Observed deployment model:

- Backend is set up for Railway using Nixpacks and Gunicorn.
- Frontend is set up for static SPA hosting with Vercel-style rewrites.
- LaTeX packages are explicitly installed in container build config.

## 5. Core Backend Domain Model

### Accounts

- Custom `User` extends `AbstractUser`
- `email` is unique
- Includes `is_verified` and `subscription_tier`, though no subscription workflow is currently wired into product flow

### Profiles

- One-to-one with user
- Stores full name, email, phone, location, LinkedIn, GitHub, portfolio, summary, and skills
- Supplies personalization context for cover letter and email generation

### Certifications

- User-owned certification records
- Supports title, issuer, dates, credential URL, ID, and uploaded media

### Resume and Generation Models

- `Resume`: stores original uploaded file and/or LaTeX file plus parsed resume content
- `JobDescription`: stores user-saved job descriptions and extracted keywords
- `OptimizedResume`: legacy structured optimization output
- `CoverLetter`: legacy cover letter output
- `Job`: intended to store a generation request
- `GeneratedDocument`: intended to store final tailored resume, cover letter, email, ATS score, diff, and token usage

Important state mismatch:

- The current optimizer endpoint returns a generated `document` payload but does not create `Job` or `GeneratedDocument` rows.
- As a result, the `jobs` and `generated-documents` read-only endpoints are present but are not populated by the main flow.

## 6. API Surface

### Actively Used by Frontend

- `POST /api/auth/register/`
- `POST /api/token/`
- `POST /api/token/refresh/`
- `POST /api/auth/password/forgot/`
- `POST /api/auth/password/reset/`
- `GET /api/profile/me/`
- `PUT /api/profile/update_me/`
- Resume CRUD at `/api/resumes/`
- Certification CRUD at `/api/certifications/`
- `POST /api/resume-optimizer/generate/`

### Present but Not Used by Current Frontend Flow

- `/api/job-descriptions/`
- `/api/optimized-resumes/`
- `/api/cover-letters/`
- `/api/jobs/`
- `/api/generated-documents/`

Interpretation:

- The backend contains an older structured-resume optimization workflow plus the newer LaTeX-first workflow.
- The frontend currently uses only the newer direct generation path.

## 7. AI and Document Generation Pipeline

### Resume Ingestion

- Upload supports `.pdf`, `.docx`, `.txt`, and `.tex`
- Current UX strongly enforces `.tex` as the preferred and effectively required format
- LaTeX files are converted to plain text for parsing and ATS calculation

### Optimization Strategy

For LaTeX resumes:

- Extract LaTeX sections
- Keep document structure intact
- Only update Summary and Skills
- Keep Experience, Projects, and Education unchanged
- Optionally render placeholders if `{{HEADLINE}}`, `{{SUMMARY}}`, `{{SKILLS}}` exist
- Compile updated LaTeX into PDF
- Fall back to text PDF if compilation fails and strict mode is off

For plain-text resumes:

- Update only the headline line, Summary, and Skills
- Keep protected sections unchanged

### Output Artifacts

- Tailored resume PDF
- Tailored LaTeX source as a data URL
- Cover letter PDF
- Cover letter DOCX
- Email subject and email body
- ATS score with matched and missing keywords
- Token-level diff
- AI change summary
- Token-usage metadata

### Service Layer Quality

Strengths:

- Clear AI-service separation
- Retry handling around provider failures
- Structured JSON output enforcement
- LaTeX compiler detection with fallback priority
- Cover letter export supports PDF and DOCX

Weaknesses:

- Current generation is synchronous and potentially slow under real traffic
- Legacy Celery tasks exist but are not part of the main user-facing flow
- Several old code paths remain, increasing maintenance cost

## 8. Frontend UX Assessment

What works well:

- Simple auth flow
- Clear dashboard upload/edit workflow
- Main optimizer page is straightforward
- ATS visualization is clear
- Diff summary/highlight modes are useful
- Error extraction helper improves API messaging consistency

Current UX limitations:

- Sidebar does not expose all protected pages
- Password reset is implemented as a token handoff directly in the UI, not an email-based flow
- Resume upload policy is effectively single-file; the dashboard uploads a new resume and then attempts to delete all previous resumes
- The UI uses `alert()` extensively rather than inline status patterns
- The visual system is functional but basic; it is more utility-admin than product-polished

## 9. Testing and Verification

### Completed During This Audit

Frontend:

- `npm run build`
- Result: passed

Backend:

- `python manage.py test`
- Result: 25 tests executed, 1 failure

### Failing Test

Failing test:

- `api.tests.LatexSectionLockTests.test_optimize_latex_resume_only_updates_summary_and_skills`

Observed failure:

- `KeyError: 'education'`

Likely cause:

- The LaTeX section parser alias map includes summary, experience, projects, skills, and certifications, but not education.
- The test expects education to be detected and protected, so current implementation and tests are out of sync.

### Test Coverage Observations

Covered areas:

- Plain-text resume section locking
- LaTeX section locking
- Placeholder rendering
- Cover letter export
- LaTeX compile fallback behavior
- Compiler detection
- AI JSON parsing
- Password reset flow

Missing or weakly covered areas:

- End-to-end optimizer request/response flow
- Persistence behavior for current generation path
- Frontend route and component behavior
- Media serving/download behavior in production
- Security-sensitive endpoints beyond password reset happy-path logic

## 10. Key Risks and Gaps

### High Priority

1. Password reset is not email-based.
   - The `forgot_password` endpoint returns `uid` and reset `token` directly in the API response.
   - The frontend immediately redirects to `/reset-password` using those values.
   - This exposes reset tokens to the client and enables account enumeration through different responses for known vs unknown emails.

2. Public LaTeX debug endpoint leaks environment details.
   - `debug_latex` is marked `AllowAny`.
   - It exposes compiler paths and environment values such as `PATH`, `LATEX_COMPILER`, and `LATEX_COMPILER_PATH`.

3. Current generation flow is not persisted.
   - The main `resume-optimizer/generate` endpoint returns a response payload only.
   - It does not save `Job` or `GeneratedDocument`.
   - Existing read-only endpoints for those models therefore do not reflect the main workflow.

4. Production media access is incomplete.
   - Django only serves media through URL patterns when `DEBUG=True`.
   - Resume files and certification files are still linked directly from the frontend.
   - In production, those links are likely to break unless an external media storage/serving layer exists outside this repo.

### Medium Priority

5. Legacy and current flows coexist without clear separation.
   - `JobDescription`, `OptimizedResume`, `CoverLetter`, and Celery tasks represent an older workflow.
   - The frontend uses the newer direct-generation flow.
   - This creates maintenance overhead and potential confusion.

6. Documentation references missing tracked assets.
   - The README references `backend/.env.example`, but that file is not present in tracked files.

7. Two Dockerfiles exist with overlapping intent.
   - Root `Dockerfile` and `backend/Dockerfile` are not identical.
   - This increases the chance of environment drift between local and deployed behavior.

8. Backend test suite is not green.
   - The failing LaTeX section test indicates parser/test mismatch on protected sections.

### Lower Priority

9. `drf-spectacular` is in dependencies but not wired into installed apps or URLs.

10. Some frontend pages use broad `any` typing and could be tightened.

11. UI navigation does not expose every implemented page.

## 11. Codebase Maturity Assessment

### What Is Production-leaning

- Core auth and JWT flow
- Resume upload and profile editing
- Main AI generation path
- LaTeX compiler detection/fallback logic
- Frontend production build
- Railway-oriented deployment scaffolding

### What Still Feels Transitional

- Persistence model alignment
- Security posture of password reset and debug endpoints
- Media delivery strategy
- Legacy endpoint cleanup
- Test suite completeness
- Frontend product polish

Overall maturity:

- Functional MVP moving toward production, but not yet operationally hardened.

## 12. Recommended Next Steps

### Immediate

1. Fix password reset flow.
   - Send reset links by email.
   - Return a generic success message regardless of account existence.
   - Stop returning raw reset tokens to the browser.

2. Lock down or remove `debug_latex`.
   - Require authentication and admin-only access at minimum.
   - Avoid returning raw environment values in production.

3. Decide whether generation results should persist.
   - If yes, save `Job` and `GeneratedDocument` in the main optimizer flow.
   - If no, remove the unused persistence endpoints and models from the public surface.

4. Implement production media storage/serving.
   - Use S3-compatible storage or another proper media backend.
   - Align frontend file links with that strategy.

### Near Term

5. Repair the failing backend test by aligning LaTeX protected-section parsing with intended behavior.

6. Remove or isolate legacy flow code that is no longer part of the current product.

7. Add an actual tracked environment template and deployment checklist.

8. Add end-to-end tests for the optimizer endpoint and its frontend flow.

### Later

9. Improve UX polish and replace `alert()` driven interactions with inline feedback.

10. Expose all intended sections in the main navigation or remove dormant pages.

## 13. Final Assessment

ResumeMaker already contains a solid core product idea and a meaningful amount of implemented functionality. The strongest part of the project is the LaTeX-first optimization pipeline and its supporting document generation utilities. The weakest part is not feature breadth, but platform hardening: security, persistence consistency, and production media handling.

If the next development phase focuses on those three areas, this codebase can move from "feature-complete MVP" to a more defensible production-ready application.
