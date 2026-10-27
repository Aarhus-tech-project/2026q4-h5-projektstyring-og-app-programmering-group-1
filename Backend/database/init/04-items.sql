CREATE TABLE items (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID        NOT NULL, -- FK added in 02-companies.sql
    name          TEXT        NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


