# Inventory & Order Management System

Production-ready container setup for:
- FastAPI backend
- React frontend (served via Nginx)
- PostgreSQL database

## Prerequisites

- Docker
- Docker Compose (v2)
- Docker Hub account (for image push)

## Environment Setup

1. Copy the example env file at the project root:

   ```bash
   cp .env.example .env
   ```

2. Update credentials in `.env` (especially `POSTGRES_PASSWORD`).

## Run Full Stack Locally

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- PostgreSQL: `localhost:5432`

To stop:

```bash
docker compose down
```

To stop and remove DB volume:

```bash
docker compose down -v
```

## Build Backend Image for Production

1. Build backend image:

   ```bash
   docker build -t <your-dockerhub-username>/inventory-backend:latest ./backend
   ```

2. (Optional) Tag with version:

   ```bash
   docker tag <your-dockerhub-username>/inventory-backend:latest <your-dockerhub-username>/inventory-backend:v1.0.0
   ```

## Push Backend Image to Docker Hub

1. Login:

   ```bash
   docker login
   ```

2. Push tags:

   ```bash
   docker push <your-dockerhub-username>/inventory-backend:latest
   docker push <your-dockerhub-username>/inventory-backend:v1.0.0
   ```

## Notes

- Frontend image is built with a multi-stage Docker build:
  - Node Alpine to build React assets
  - Nginx Alpine to serve static assets
- Frontend proxies `/api/*` requests to the backend container.
- PostgreSQL data persists in the named Docker volume `postgres_data`.
