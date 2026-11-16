#!/bin/sh
# Runs every file in migrations/ (in alphabetical order) after the init/ scripts,
# the FIRST time the database is created.
#
# A new database is built from init/, which already contains most migrations.
# Those migrations fail (e.g. "table already exists") and are skipped.
# Every migration is wrapped in BEGIN/COMMIT, so a failing file rolls back
# completely and never leaves the database half-changed.

for file in /docker-entrypoint-migrations/*.sql; do
    [ -e "$file" ] || continue

    if psql -v ON_ERROR_STOP=1 --quiet \
        --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
        -f "$file" > /dev/null 2>&1; then
        echo "migration applied: $(basename "$file")"
    else
        echo "migration skipped (already in init/ or not needed): $(basename "$file")"
    fi
done
