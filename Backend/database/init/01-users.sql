-- LagerKlar schema
-- Runs automatically the first time the container starts with an empty data volume.

CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password TEXT        NOT NULL,
    role          TEXT        NOT NULL CHECK (role IN ('leder', 'medarbejder')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    phone_number  TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

