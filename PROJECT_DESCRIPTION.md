# ResumeMaker — Detailed Project Description

## 1. Overview

ResumeMaker is a full-stack, AI-powered **ATS Resume Optimizer and Job Application Assistant**. Given a candidate's base resume and a target job description, the system produces a complete application package:

- A tailored resume (LaTeX source + compiled PDF, or plain-text PDF)
- A professional cover letter (PDF via LaTeX + editable DOCX)
- A ready-to-send application email (subject + body)
- An ATS alignment score with matched/missing keyword analytics
- A token-level word diff between the original and updated resume

The project is designed for candidates who maintain their resume in LaTeX and want surgical, structure-preserving optimizations rather than a full AI rewrite.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Backend | Python 3.10+, Django 4.2, Django REST Framework 3.14, Simple JWT |
| Database | PostgreSQL (via `psycopg2-binary`) |
| AI Orchestration | OpenAI Python SDK — compatible with OpenAI, Google Gemini, and Groq endpoints |
| Document Engines | `pypdf` (text extraction), `python-docx` (DOCX generation), `reportlab` (fallback PDF), LaTeX compilers (`xelatex`, `tectonic`, `lualatex`, `pdflatex`) |
| Async Tasks | Celery 5.3 + Redis |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| HTTP Client | Axios (with JWT interceptor + silent token refresh) |
| Auth | JWT (access token: 1 hour, refresh token: 7 days) |
| Static Files | WhiteNoise |
| Deployment | Gunicorn, Docker, Railway / Render compatible |

---

## 3. Repository Structure

```
ResumeMaker/
├── backend/
│   ├── accounts/          # Custom User model (AbstractUser + email unique + subscription_tier)
│   ├── api/               # Core app: resume pipeline, AI service, PDF/LaTeX engines, views
│   ├── certifications/    # Certification CRUD (title, issuer, dates, credential URL, media file)
│   ├── config/            # Django settings, URL root, Celery config, WSGI/ASGI
│   ├── profiles/          # Candidate profile (name, contact, links, summary, skills JSON)
│   ├── templates/         # LaTeX resume base template (resume_template.tex)
│   ├── media/             # Uploaded and generated files (resumes, cover letters, LaTeX)
│   ├── logs/              # Django log output
│   ├── requirements.txt
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── components/    # AppHeader, Sidebar, ATSScore, FileUpload, LandingParticles, ProtectedRoute
│   │   ├── pages/         # HomePage, Auth, Dashboard, Home (optimizer), ProfileView, Certifications, ForgotPassword, ResetPassword
│   │   ├── services/      # api.ts — Axios client + all service modules
│   │   ├── types/         # TypeScript interfaces (Resume, Job, GeneratedDocument, DiffToken, etc.)
│   │   └── utils/         # auth.ts (token storage), apiError.ts
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── vercel.json
├── Dockerfile
└── START.bat
```

---

## 4. Data Models

### `accounts.User` (Custom AbstractUser)
| Field | Type | Notes |
|---|---|---|
| `email` | EmailField | Unique |
| `is_verified` | BooleanField | Default false |
| `subscription_tier` | CharField | Default `'free'` |

### `profiles.Profile` (OneToOne → User)
| Field | Type |
|---|---|
| `full_name`, `email`, `phone`, `location` | CharField / EmailField |
| `linkedin_url`, `github_url`, `portfolio_url` | URLField |
| `summary` | TextField |
| `skills` | JSONField (list of strings) |

### `certifications.Certification` (FK → User)
| Field | Type |
|---|---|
| `title`, `issuer` | CharField |
| `issue_date`, `expiry_date` | DateField |
| `credential_id`, `credential_url` | CharField / URLField |
| `media_file` | FileField |

### `api.Resume` (FK → User)
| Field | Type | Notes |
|---|---|---|
| `original_file` | FileField | PDF / DOCX / TXT |
| `latex_file` | FileField | `.tex` only |
| `parsed_content` | JSONField | AI-parsed structured resume |

### `api.Job` (FK → User, FK → Resume)
Stores the job context submitted for each generation run: `company_name`, `job_title`, `job_description`, `requirements`, plus optional enrichment fields (`degree_or_role`, `primary_tech_stack`, `technologies`, `project_name`, `key_skills_or_features`).

### `api.GeneratedDocument` (FK → User, FK → Job, FK → Resume)
The output record for each optimization run:

| Field | Type | Notes |
|---|---|---|
| `tailored_resume_text` | TextField | Updated LaTeX or plain text |
| `cover_letter_text` | TextField | Full formatted cover letter |
| `email_subject` / `email_body` | CharField / TextField | Application email |
| `ats_score` | IntegerField | 0–100 |
| `matched_keywords` / `missing_keywords` | JSONField | ATS keyword lists |
| `resume_pdf` | FileField | Compiled PDF |
| `tailored_resume_tex` | FileField | Updated `.tex` source |
| `is_latex_based` | BooleanField | |
| `cover_letter_pdf` | FileField | |
| `diff_json` | JSONField | Token-level diff array |
| `ai_changes` | JSONField | Human-readable change log |
| `token_usage` | JSONField | AI token consumption |

---

## 5. Backend Architecture

### 5.1 Django Apps

**`accounts`** — Custom user model, no extra views. Auth is handled via Simple JWT (`/api/token/`, `/api/token/refresh/`).

**`profiles`** — Single profile per user. `GET /api/profile/me/` and `PUT/PATCH /api/profile/update_me/`.

**`certifications`** — Full CRUD at `/api/certifications/`. Supports media file upload (multipart).

**`api`** — The core application containing:
- `views.py` — All ViewSets
- `ai_service.py` — All AI logic
- `pdf_service.py` — PDF/DOCX generation and text extraction
- `latex_compiler.py` — LaTeX compiler detection and subprocess execution
- `serializers.py` — DRF serializers
- `tasks.py` — Celery async tasks
- `models.py` — Resume, Job, GeneratedDocument, JobDescription

### 5.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/token/` | Login, obtain JWT pair |
| POST | `/api/token/refresh/` | Refresh access token |
| POST | `/api/auth/password/forgot/` | Verify email, return uid + token |
| POST | `/api/auth/password/reset/` | Set new password |
| GET | `/api/profile/me/` | Get own profile |
| PUT/PATCH | `/api/profile/update_me/` | Update profile |
| GET/POST/DELETE | `/api/certifications/` | Certification CRUD |
| GET/POST/DELETE | `/api/resumes/` | Resume upload and management |
| GET | `/api/resumes/{id}/download/` | Download raw resume file |
| POST | `/api/resume-optimizer/generate/` | Synchronous generation (main endpoint) |
| POST | `/api/resume-optimizer/generate-async/` | Async generation via Celery |
| GET | `/api/resume-optimizer/task-status/{task_id}/` | Poll Celery task state |
| GET | `/api/jobs/` | View generation job history |
| GET | `/api/generated-documents/` | View previously generated documents |

### 5.3 Authentication & Security

- JWT via `djangorestframework-simplejwt`. Access token lifetime: 1 hour. Refresh: 7 days.
- Password reset is tokenless-email-free: the `/forgot/` endpoint verifies the email exists and returns a `uid` + Django token directly to the frontend, which then calls `/reset/` with the new password. No email sending is required in the default configuration.
- Rate limiting: general API at `200/hour` per user; optimizer endpoint at `10/minute`.
- CORS configured via `django-cors-headers`. Supports Railway/Render deployment with `SECURE_PROXY_SSL_HEADER`.
- File uploads capped at 10 MB. Allowed extensions enforced at serializer and model level.

---

## 6. AI Service (`api/ai_service.py`)

The `AIService` class is a static-method service that wraps the OpenAI SDK. It is provider-agnostic — the base URL and model name are injected from environment variables, making it compatible with Gemini, Groq, or any OpenAI-compatible endpoint.

### 6.1 Core AI Call

`_call_openai_with_retry` — Sends a chat completion request with `response_format: json_object`, retries up to 3 times on rate limits (with exponential backoff), and raises typed exceptions (`AIServiceUnavailableError`, `AIServiceProviderError`) for upstream error handling.

### 6.2 Resume Mode Detection

Before every AI call, the system computes an ATS score using pure token matching (no AI call) and classifies the optimization into one of three modes:

| Mode | Condition | Behavior |
|---|---|---|
| `SAFE` | ATS score ≥ 40 | Only use existing skills; at most 1 new adjacent skill tagged as `(Beginner - Currently Learning)` |
| `EXPANSION` | ATS score < 40 | Introduce multiple JD keywords as learning intent, tagged as `(Beginner)`, `(Currently Learning)`, or `(Familiar)` |
| `ROLE_SHIFT` | Non-technical JD + ATS score < 30 | Reframe the entire resume positioning toward HR/Admin/Operations; strip technical identity from headline and summary |

### 6.3 LaTeX Optimization Pipeline

The primary path for `.tex` resumes:

1. **Section extraction** — `extract_latex_sections` uses regex to locate `\section{...}` boundaries and maps them to canonical keys (`summary`, `skills`, `experience`, `projects`, `education`, `certifications`).
2. **Headline extraction** — `extract_latex_headline` detects the title line below the candidate name using a `\scshape` pattern.
3. **Single AI call** — `generate_latex_all_documents` sends the current summary section, skills section, allowed skills list, job data, and user profile in one prompt. The AI returns `headline`, `summary`, `cover_letter_text`, `email_subject`, `email_body`, and `changes_made`.
4. **Skills reordering** — `build_latex_skills_section_update` reorders existing `\item` blocks by JD keyword overlap score using pure Python — the AI is never trusted to output valid LaTeX structure for skills.
5. **Section injection** — `apply_latex_section_updates` splices the updated summary and reordered skills back into the original LaTeX source by character offset, preserving all other sections exactly.
6. **Headline injection** — `apply_latex_headline_update` replaces only the headline text in-place.
7. **Template placeholder support** — If the `.tex` file contains `{{HEADLINE}}`, `{{SUMMARY}}`, or `{{SKILLS}}` tokens, `render_latex_template_placeholders` substitutes them instead of using section-based injection.
8. **LaTeX sanitization** — All AI-returned section content is validated to reject any output containing `\section`, `\begin{document}`, or `\end{document}` commands before injection.

### 6.4 Plain-Text Optimization Pipeline

For non-LaTeX resumes:

1. `extract_plain_text_sections` detects section headings via regex and maps them to canonical keys.
2. `extract_plain_text_headline` identifies the headline line (second non-empty line, not a section heading, not a contact line).
3. A single AI call returns updated `headline`, `summary`, `skills`, and `changes_made`.
4. Role-shift enforcement functions (`_enforce_role_shift_headline`, `_enforce_role_shift_summary`, `_enforce_role_shift_skills`) post-process the AI output to guarantee banned technical terms are removed when in `ROLE_SHIFT` mode.

### 6.5 Cover Letter Generation

The cover letter body is generated by the AI as part of the combined prompt. The backend then wraps it in a fixed professional template via `format_cover_letter_template`, which adds the candidate's contact header, date, hiring manager address block, greeting, and sign-off. The AI body is cleaned of any duplicate greeting/sign-off lines before insertion.

### 6.6 Email Generation

The email body is always rebuilt by `_build_email_body_fallback`, which constructs a structured email from the user profile and job data, optionally incorporating the AI-generated body as a middle paragraph. The subject line is normalized to `"Application for {role} Position"`.

### 6.7 ATS Score Calculation

`calculate_ats_score_from_text` — First attempts an AI call to extract the 20 most important ATS keywords from the JD. Falls back to frequency-based token extraction if the AI call fails. Keyword matching against the resume uses normalized phrase matching, token set intersection, singular/plural normalization, and primary-word matching for multi-word phrases.

### 6.8 Diff Generation

`generate_diff` uses Python's `difflib.ndiff` on word-split tokens to produce a list of `{type, word}` objects (`added`, `removed`, `unchanged`) for token-level visualization in the frontend.

---

## 7. Document Engine (`api/pdf_service.py`, `api/latex_compiler.py`)

### LaTeX Compiler (`latex_compiler.py`)

- Auto-detects the available compiler in priority order: `xelatex → tectonic → lualatex → pdflatex`.
- Supports explicit override via `LATEX_COMPILER` and `LATEX_COMPILER_PATH` environment variables.
- Hardcoded path hints for Railway/Render Nix environments.
- Runs the compiler in a subprocess with a configurable timeout (default 180 seconds).

### PDF Service (`pdf_service.py`)

- `compile_latex_to_pdf` — Writes the LaTeX source to a temp directory, runs the compiler, reads the output PDF into a `BytesIO` buffer. Tries up to 4 variants: original, without `glyphtounicode`, without `fontawesome5`, and both combined.
- `extract_text` — Dispatches to `pypdf` (PDF), `python-docx` (DOCX), or raw read (TXT/TEX).
- `generate_cover_letter_pdf_via_latex` — Builds a minimal `letter` document class LaTeX source from the cover letter content and compiles it.
- `generate_cover_letter_pdf` — ReportLab fallback for cover letter PDF.
- `generate_cover_letter_docx` — `python-docx` DOCX export.
- `generate_text_pdf` — ReportLab plain-text PDF fallback for resumes.

All generated files are returned as `BytesIO` buffers and encoded as base64 data URLs in the API response. The frontend receives them inline and offers download links without requiring a second request.

### `LATEX_STRICT_MODE`

When `LATEX_STRICT_MODE=True`, any LaTeX compilation failure raises a `RuntimeError` and the request fails with HTTP 500. When false (default), the system falls back to a ReportLab text PDF and appends a note to `ai_changes`.

---

## 8. Async Task Pipeline (`api/tasks.py`)

The `generate_documents_task` Celery task mirrors the synchronous `generate` view but runs in a background worker. It reports progress states (`PENDING → PROGRESS → SUCCESS/FAILURE`) that the frontend polls via `/api/resume-optimizer/task-status/{task_id}/`.

Additional tasks:
- `parse_resume_task` — Parses a resume asynchronously after upload.
- `extract_keywords_task` — Extracts keywords from a job description asynchronously.

---

## 9. Frontend Architecture

### Routing (`App.tsx`)

| Route | Component | Auth Required |
|---|---|---|
| `/` | `HomePage` | No |
| `/login` | `Auth` | No |
| `/forgot-password` | `ForgotPassword` | No |
| `/reset-password` | `ResetPassword` | No |
| `/resume-optimizer` | `Home` | Yes |
| `/dashboard` | `Dashboard` | Yes |
| `/profile-view` | `ProfileView` | Yes |
| `/certifications` | `Certifications` | Yes |

Protected routes are wrapped in `ProtectedRoute`, which checks for a valid access token and redirects to `/login` if absent.

### API Service Layer (`services/api.ts`)

A single Axios instance with:
- Base URL from `VITE_API_BASE_URL` env var.
- Request interceptor: attaches `Authorization: Bearer {token}` header.
- Response interceptor: on 401, silently refreshes the access token using the stored refresh token and retries the original request. On refresh failure, clears tokens and redirects to `/login`.

Service modules exported:
- `authService` — register, login, requestPasswordReset, resetPassword, logout
- `profileService` — get, update
- `certificationService` — list, create, update, delete
- `resumeService` — upload, list, delete, viewFile
- `resumeOptimizerService` — generate (sync), generateAsync, pollTaskStatus

### Key Components

- `ATSScore` — Renders the ATS score gauge, matched keywords, and missing keywords.
- `FileUpload` — Drag-and-drop resume upload with `.tex` / PDF / DOCX / TXT support.
- `Sidebar` — Navigation sidebar with route links.
- `AppHeader` — Top bar with user info and logout.
- `LandingParticles` — Animated particle background for the landing page.

---

## 10. Configuration & Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Django secret key |
| `DEBUG` | No | `True` / `False` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Yes | PostgreSQL connection |
| `OPENAI_API_KEY` | Yes | AI provider API key |
| `OPENAI_BASE_URL` | Yes | OpenAI-compatible base URL (e.g. Gemini, Groq) |
| `AI_MODEL` | Yes | Model name (e.g. `gemini-2.0-flash`) |
| `GROQ_API_KEY` | No | If set, overrides `OPENAI_API_KEY` and sets Groq base URL automatically |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed frontend origins |
| `REDIS_URL` | No | Celery broker/backend (default: `redis://localhost:6379/0`) |
| `LATEX_COMPILER` | No | Preferred compiler name (`xelatex`, `tectonic`, etc.) |
| `LATEX_COMPILER_PATH` | No | Absolute path to compiler binary |
| `LATEX_STRICT_MODE` | No | `True` to disable PDF fallbacks |
| `SECURE_SSL_REDIRECT` | No | `True` in production behind HTTPS proxy |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:8000`) |

---

## 11. Generation Flow (End-to-End)

```
User submits form (company, job title, JD, requirements, optional resume_id)
        │
        ▼
ResumeOptimizerViewSet.generate()
        │
        ├─ _resolve_resume()         → find latest .tex resume for user
        ├─ _extract_resume_source()  → read .tex file, convert to plain text
        ├─ _build_user_profile_payload() → fetch Profile model
        │
        ▼
AIService.generate_latex_all_documents()
        │
        ├─ extract_latex_sections()          → locate Summary, Skills sections
        ├─ extract_allowed_skills_from_latex_section() → parse skills list
        ├─ calculate_ats_score_from_text()   → compute mode (SAFE/EXPANSION/ROLE_SHIFT)
        ├─ _call_openai_with_retry()         → single AI call → headline, summary, cover letter, email
        ├─ build_latex_skills_section_update() → Python-only skills reordering
        ├─ apply_latex_section_updates()     → splice summary + skills into LaTeX
        ├─ apply_latex_headline_update()     → update headline in LaTeX
        └─ format_cover_letter_template()   → wrap AI body in full cover letter template
        │
        ▼
PDFService.compile_latex_to_pdf()    → xelatex/tectonic subprocess → PDF buffer
PDFService.generate_cover_letter_pdf_via_latex() → cover letter PDF buffer
PDFService.generate_cover_letter_docx()          → cover letter DOCX buffer
        │
        ▼
AIService.calculate_ats_score_from_text()  → AI keyword extraction → score + matched/missing
AIService.generate_diff()                  → difflib word diff
        │
        ▼
All buffers base64-encoded as data URLs
Response: { document: { resume_pdf, tailored_resume_tex, cover_letter_pdf,
                         cover_letter_docx, ats_score, matched_keywords,
                         missing_keywords, diff_json, ai_changes, email_* } }
```

---

## 12. Deployment Notes

- The `Dockerfile` and `start.sh` are configured for Railway/Render.
- `WhiteNoise` serves static files directly from Django (no separate static server needed).
- `SECURE_PROXY_SSL_HEADER` and `USE_X_FORWARDED_HOST` are set for reverse proxy compatibility.
- The frontend has a `vercel.json` for Vercel SPA deployment with catch-all redirect to `index.html`.
- The `START.bat` script is a Windows convenience launcher for local development.
- Pyrefly (`pyrefly.toml`) is configured as the Python linter for the backend.
