# Deployment Guide

## Best production path for this repo

This repository contains:

- `frontend`: Vite + React
- `backend`: FastAPI
- `db`: PostgreSQL

GitHub Pages cannot host the full app because it only supports static frontend files.

The simplest full-stack deployment for this repository is:

- `frontend` on Railway
- `backend` on Railway
- `PostgreSQL` on Railway

The repo is now prepared for that setup.

## Railway deployment structure

Create one Railway project with three services:

1. `frontend`
2. `backend`
3. `postgres`

Use the same GitHub repository for the frontend and backend services.

## Frontend Railway service

- Root Directory: `/frontend`
- Config-as-code file: `/frontend/railway.json`
- Public domain: generate one in Railway

Set this variable on the frontend service:

- `VITE_API_URL=https://your-backend-domain/api`

The frontend Docker build now accepts `VITE_API_URL` during build time.

## Backend Railway service

- Root Directory: `/backend`
- Config-as-code file: `/backend/railway.json`
- Public domain: generate one in Railway

Set these variables on the backend service:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_SECRET=your-strong-random-secret`
- `FRONTEND_URL=https://your-frontend-domain`

The backend startup now:

- waits for the database using [backend/wait_for_db.py](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/backend/wait_for_db.py)
- runs Alembic migrations
- seeds default data
- listens on Railway's `PORT`

## Postgres Railway service

Create a PostgreSQL service from Railway's database template and name it `Postgres` so the backend reference variable works as written:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`

## Useful files

- [frontend/src/lib/api.ts](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/frontend/src/lib/api.ts)
- [frontend/railway.json](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/frontend/railway.json)
- [backend/railway.json](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/backend/railway.json)
- [backend/.env.example](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/backend/.env.example)
- [frontend/.env.example](/C:/Users/Udhav/OneDrive/Attachments/Documents/Ecommerce/frontend/.env.example)
