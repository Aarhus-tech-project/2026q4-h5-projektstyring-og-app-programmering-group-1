# LagerKlar – PostgreSQL database
FROM postgres:16-alpine

# Default values (override in docker-compose.yml / .env – never commit real passwords)
ENV POSTGRES_DB=lagerklar \
    POSTGRES_USER=lagerklar \
    TZ=Europe/Copenhagen \
    PGTZ=Europe/Copenhagen

# Scripts in this folder run automatically, in alphabetical order,
# the FIRST time the container starts with an empty data volume.
COPY ./init/ /docker-entrypoint-initdb.d/

# All files in migrations/ run AFTER the init scripts (999_ sorts last).
# Migrations that are already part of init/ fail and are skipped (see run-migrations.sh).
COPY ./migrations/ /docker-entrypoint-migrations/
COPY ./run-migrations.sh /docker-entrypoint-initdb.d/999_run_migrations.sh
# Remove Windows line endings (CRLF), otherwise the script can't run in Linux
RUN sed -i 's/\r$//' /docker-entrypoint-initdb.d/999_run_migrations.sh \
    && chmod +x /docker-entrypoint-initdb.d/999_run_migrations.sh

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1

EXPOSE 5432
