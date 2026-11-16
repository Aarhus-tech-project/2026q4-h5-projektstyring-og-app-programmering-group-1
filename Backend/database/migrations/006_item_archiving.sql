BEGIN;

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS items_active_company_idx
    ON items (company_id)
    WHERE archived_at IS NULL;

COMMIT;
