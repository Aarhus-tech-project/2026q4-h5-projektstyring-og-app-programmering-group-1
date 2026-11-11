-- User accounts. The password column stores a bcrypt hash, never a plain-text password.
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password      TEXT        NOT NULL,
    phone_number  TEXT,
    avatar_url    BYTEA,      -- profile picture stored as raw image bytes (not a URL)
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
