FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps + XeLaTeX
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

RUN xelatex --version

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy project
COPY backend/ /app/

# Collect static files (IMPORTANT FIX)
RUN SECRET_KEY=build-only-dummy-key \
    DB_NAME=dummy DB_USER=dummy DB_PASSWORD=dummy DB_HOST=localhost DB_PORT=5432 \
    python manage.py collectstatic --noinput

EXPOSE 8080

COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]