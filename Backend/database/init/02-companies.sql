CREATE TABLE companies (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    cvr        VARCHAR(8)  NOT NULL UNIQUE,
    address    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT companies_cvr_format_check
        CHECK (cvr ~ '^[0-9]{8}$')
);