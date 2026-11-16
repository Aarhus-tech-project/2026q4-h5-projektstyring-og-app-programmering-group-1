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
## Running the backend in Docker

`docker compose up -d --build` starts three containers: `db` (PostgreSQL), `backend` (the Go API, built from `Dockerfile`) and `caddy` (HTTPS reverse proxy on port 80/443 to the backend).

- Only Caddy is public. The backend (`backend:8080`) is reachable only on the internal Docker network; PostgreSQL is bound to `127.0.0.1:5432` on the host.
- API through Caddy: `https://localhost` locally, `https://<server IP>` on the server
- After changing Go code, rebuild just the backend: `docker compose up -d --build backend`
- Logs: `docker compose logs -f backend` / `docker compose logs -f caddy`
- Inside Docker, `DATABASE_URL` is set automatically to use the `db` host, so the `localhost` URL in `.env` still works for `go run .`

### HTTPS with an IP address (no domain)

In `.env` set `SITE_ADDRESS=https://<server IP>` and `TLS_DEFAULT_SNI=<server IP>`. The Caddyfile uses `tls internal`, so Caddy signs the certificate with its own local CA (Let's Encrypt does not issue certificates for IP addresses). Clients show a certificate warning unless they trust Caddy's root CA, which you can copy out with:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

The server/provider firewall must allow inbound TCP 80 and 443 (and UDP 443 for HTTP/3). If port 80 is used by another program (e.g. nginx), stop it or set `CADDY_HTTP_PORT` in `.env`.

### Switching to a domain later

1. Point the domain's DNS A record to the server IP.
2. In `.env` set `SITE_ADDRESS=api.example.com` and `TLS_DEFAULT_SNI=api.example.com`.
3. Remove the `tls internal` line from `caddy/Caddyfile`.
4. `docker compose up -d --force-recreate caddy`

Caddy then obtains and renews a trusted Let's Encrypt certificate automatically (ports 80 and 443 must be reachable from the internet).

To run the backend on your machine with `go run .` instead, start only the database: `docker compose up -d db`.

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
