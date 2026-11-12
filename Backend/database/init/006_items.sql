-- Varetyper. Mængde og udløbsdato ligger på batches.
CREATE TABLE items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    unit          TEXT NOT NULL,
    min_quantity  NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    image_url     BYTEA,        -- item picture stored as raw image bytes (not a URL)
    image_updated_at TIMESTAMPTZ, -- changes on every upload, used to refresh cached images
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX items_company_idx ON items (company_id);
CREATE INDEX items_category_idx ON items (category_id);
