#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing command"

echo "Running migrations..."
alembic upgrade head

echo "Running seed script..."
python seed.py

echo "Starting Uvicorn server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
