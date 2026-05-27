#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
python wait_for_db.py
echo "PostgreSQL is up - executing command"

echo "Running migrations..."
alembic upgrade head

echo "Running seed script..."
python seed.py

echo "Starting Uvicorn server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
