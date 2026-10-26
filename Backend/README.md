# LagerKlar – Database (PostgreSQL in Docker)

The database for LagerKlar runs as a PostgreSQL 16 container. The schema in `database/init/` is loaded automatically the first time the container starts.


## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose v2)
- Check that it works: `docker --version` and `docker compose version`

## First-time setup

1. Copy the env file and set a password:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and change `POSTGRES_PASSWORD` (and the password in `DATABASE_URL`).
   **Never commit `.env` to GitHub** – add it to `.gitignore`.

2. Build and start the database:

   ```bash
   docker compose up -d --build
   ```

3. Check that it is running and healthy:

   ```bash
   docker compose ps
   ```

   The `db` service should show `healthy`.
|
## Connecting from the Go backend

Use the connection string from `.env`:

```
postgres://lagerklar:<password>@localhost:5432/lagerklar?sslmode=disable
```

If the backend also runs in Docker Compose, use the service name `db` instead of `localhost`:

```
postgres://lagerklar:<password>@db:5432/lagerklar?sslmode=disable
```

## Updating the database
1. Delete the old database and rebuild:

   ```bash
   docker compose down -v
   docker compose up -d --build