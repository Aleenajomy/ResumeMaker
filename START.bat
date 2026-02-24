@echo off
echo ========================================
echo Resume Maker - Quick Start Guide
echo ========================================
echo.

echo STEP 1: Backend Setup
echo ----------------------
echo 1. Install PostgreSQL and create database 'resumemaker'
echo 2. Install Redis
echo 3. Get OpenAI API key from https://platform.openai.com/
echo.
echo Commands:
echo   cd backend
echo   python -m venv venv
echo   venv\Scripts\activate
echo   pip install -r requirements.txt
echo   copy .env.example .env
echo   [Edit .env with your credentials]
echo   python manage.py migrate
echo   python manage.py createsuperuser
echo   python manage.py runserver
echo.

echo STEP 2: Frontend Setup (in new terminal)
echo -----------------------------------------
echo Commands:
echo   cd frontend
echo   npm install
echo   npm run dev
echo.

echo STEP 3: Access Application
echo --------------------------
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/api
echo Admin Panel: http://localhost:8000/admin
echo.

pause
