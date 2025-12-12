#!/bin/bash
# Startup script for Render - runs both Django and FastAPI

# Run Django migrations
python manage.py migrate --noinput

# Start Django in background
python manage.py runserver 0.0.0.0:8001 &

# Start FastAPI on main port (Render will assign PORT env var)
uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
