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
## Forgot password

Endpoints (public): `POST /v1/password-reset/request`, `/verify` and `/reset`.
The 6-digit code is emailed through Gmail, so `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` must be set in `.env` (see `.env.example`).

Existing databases need the new tables:

```bash
docker exec -i lagerklar-db psql -U lagerklar -d lagerklar < database/migrations/008_password_reset.sql
```

### Running the tests

The password reset tests need an empty throwaway PostgreSQL (never your real database):

```bash
docker run -d --name lagerklar-test -e POSTGRES_DB=lagerklar_test -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -p 55432:5432 -v "$(pwd)/database/init:/docker-entrypoint-initdb.d:ro" postgres:16-alpine
TEST_DATABASE_URL="postgres://test:test@localhost:55432/lagerklar_test?sslmode=disable" go test ./...
docker rm -f lagerklar-test
```

Without `TEST_DATABASE_URL` those tests are skipped.
