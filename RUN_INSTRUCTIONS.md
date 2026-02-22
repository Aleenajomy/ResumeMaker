# Resume Maker - Run Instructions

## Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis

## Backend Setup

1. **Navigate to backend folder:**
```bash
cd d:\resumemaker\backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**
```bash
venv\Scripts\activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Create .env file:**
```bash
copy .env.example .env
```
Then edit `.env` and add your actual values (SECRET_KEY, DB_PASSWORD, GROQ_API_KEY)

6. **Create logs directory:**
```bash
mkdir logs
```

7. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

8. **Create superuser (optional):**
```bash
python manage.py createsuperuser
```

9. **Run Django server:**
```bash
python manage.py runserver
```

Backend will run on: http://localhost:8000

---

## Frontend Setup

1. **Open NEW terminal and navigate to frontend folder:**
```bash
cd d:\resumemaker\frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
copy .env.example .env
```

4. **Run development server:**
```bash
npm run dev
```

Frontend will run on: http://localhost:5173

---

## Optional: Run Celery (for async tasks)

**Open NEW terminal:**
```bash
cd d:\resumemaker\backend
venv\Scripts\activate
celery -A config worker -l info
```

---

## Quick Start Commands

**Terminal 1 - Backend:**
```bash
cd d:\resumemaker\backend
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd d:\resumemaker\frontend
npm run dev
```

**Terminal 3 - Redis (if not running as service):**
```bash
redis-server
```

---

## Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Admin Panel: http://localhost:8000/admin

---

## Notes

- Make sure PostgreSQL is running
- Make sure Redis is running
- Update .env files with your actual credentials
- For production, set DEBUG=False and use proper SECRET_KEY
