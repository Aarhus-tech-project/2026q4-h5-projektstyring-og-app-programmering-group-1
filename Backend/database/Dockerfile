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

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" || exit 1

EXPOSE 5432
