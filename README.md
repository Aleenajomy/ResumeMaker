# 📄 ResumeMaker

ResumeMaker is a full-stack, AI-powered **ATS Resume Optimizer & Application Assistant**. It compiles LaTeX and plain-text resumes tailored to specific job descriptions, generates structured cover letters (PDF/DOCX), drafts custom application emails, and calculates an ATS alignment score using token-level diff visualization.

---

## ✨ Features

*   **LaTeX-First Exact Structure Mode:** Tailors your resume's **Summary**, **Headline**, and **Skills** sections while preserving the formatting and content of your **Experience**, **Projects**, and **Education** sections.
*   **Template Injection:** Supports dynamic rendering of LaTeX placeholders (`{{HEADLINE}}`, `{{SUMMARY}}`, `{{SKILLS}}`) on base templates.
*   **Automated Document Generation:**
    *   **Tailored Resume:** Optimized LaTeX source code and compiled PDF.
    *   **Cover Letter:** Fixed-structure professional cover letter exported as PDF and editable Word DOCX.
    *   **Application Email:** Context-specific email subject and body (tailored for technical and non-technical roles).
*   **ATS Alignment Analytics:** Extracted keywords, matching percentages, missing terminology, and token-level diff highlighting.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, Django 4.2, Django REST Framework, Simple JWT, PostgreSQL, Celery, Redis |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **AI Orchestration** | OpenAI SDK (fully compatible with Google Gemini / Groq base endpoints) |
| **Document Engines** | `pypdf`, `python-docx`, `reportlab`, LaTeX compilers (`tectonic` / `xelatex` / `pdflatex`) |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
*   Python 3.10+ & `pip`
*   Node.js 18+ & `npm`
*   PostgreSQL running database
*   OpenAI-compatible API key (e.g. Gemini, Groq, or OpenAI)
*   A LaTeX compiler installed on your system (e.g., Tectonic or XeLaTeX)

---

### 1. Backend Setup

Navigate to the `backend` directory, initialize the environment, and run database migrations:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
# On Windows (CMD):
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
copy .env.example .env  # On Windows
cp .env.example .env    # On macOS/Linux

# Apply migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

> [!TIP]
> If running backend commands without activating the virtual environment in your terminal, use explicit paths:
> *   **Windows:** `venv\Scripts\python.exe manage.py <command>`
> *   **macOS/Linux:** `venv/bin/python manage.py <command>`

Backend runs locally at: `http://localhost:8000`

---

### 2. Frontend Setup

In a new terminal window, navigate to the `frontend` directory, install node modules, and start the development server:

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite server
npm run dev
```

Frontend runs locally at: `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Key | Required | Description / Example |
| :--- | :---: | :--- |
| `SECRET_KEY` | Yes | Django secret key for session/token signing. |
| `DEBUG` | No | `True` for development, `False` for production. |
| `DB_NAME` | Yes | Name of PostgreSQL database (e.g. `resumemaker_db`). |
| `DB_USER` | Yes | PostgreSQL username (e.g. `resumemaker_db_user`). |
| `DB_PASSWORD` | Yes | PostgreSQL password. |
| `DB_HOST` | Yes | Local `localhost` or Render host (e.g. `*.oregon-postgres.render.com`). |
| `DB_PORT` | Yes | Database port (typically `5432`). |
| `OPENAI_API_KEY` | Yes | Your API key for the AI model. |
| `OPENAI_BASE_URL` | Yes | OpenAI compatible endpoint url (e.g., Gemini's OpenAI base url). |
| `AI_MODEL` | Yes | Target model name (e.g. `gemini-2.0-flash`). |
| `CORS_ALLOWED_ORIGINS`| Yes | Allowed origins (e.g., `http://localhost:5173`). |
| `LATEX_STRICT_MODE` | No | Set `True` to disable text PDF fallbacks if compile fails. |

### Frontend (`frontend/.env`)
*   `VITE_API_BASE_URL=http://localhost:8000`

---

## 📡 API Endpoint Reference

### Authentication
*   `POST /api/auth/register/` — Register a new account.
*   `POST /api/token/` — Log in and obtain JWT.
*   `POST /api/token/refresh/` — Refresh access token.
*   `POST /api/auth/password/forgot/` — Request password reset.
*   `POST /api/auth/password/reset/` — Confirm password reset.

### Profiles & Certifications
*   `GET /api/profile/me/` — Retrieve user profile.
*   `PUT/PATCH /api/profile/update_me/` — Edit profile details.
*   `GET/POST/PUT/DELETE /api/certifications/` — CRUD user certifications.

### Resumes & Generation
*   `GET/POST/DELETE /api/resumes/` — CRUD uploaded resumes (Upload `.tex` for optimization).
*   `POST /api/resume-optimizer/generate/` — Generate customized resume, cover letter, and application email payload.
*   `GET /api/jobs/` — View generation job history.
*   `GET /api/generated-documents/` — Retrieve previously generated document configurations.

---

## 🔍 Troubleshooting

#### ⚠️ "No dashboard .tex resume found"
Upload your resume in LaTeX (`.tex`) format in the dashboard first. The main optimization flow operates directly on LaTeX structure.

#### ⚠️ "Job description must be at least 50 characters"
Ensure the provided job description contains enough textual data for keyword matching and role parsing.

#### ⚠️ "No LaTeX compiler found"
*   Install a local compiler (`tectonic`, `xelatex`, or `pdflatex`).
*   On Railway/Render deployments, verify that the package list contains `texlive-xetex` and `texlive-latex-extra`.
*   Set the `LATEX_COMPILER=xelatex` environment variable.

#### ⚠️ "HTTP 500 (Internal Server Error) after deploying to Render"
*   **Environment Variables:** Verify that all environment variables from `backend/.env` (such as `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `SECRET_KEY`) are set in the Render Web Service **Environment** tab.
*   **Database Host:** Ensure `DB_HOST` is set to the **Internal Hostname** inside Render (`dpg-*`) and the **External Hostname** (`dpg-*.oregon-postgres.render.com`) for local connections.
*   **Database Migrations:** Ensure migrations are applied to the active database using:
    ```bash
    venv\Scripts\python.exe manage.py migrate
    ```
