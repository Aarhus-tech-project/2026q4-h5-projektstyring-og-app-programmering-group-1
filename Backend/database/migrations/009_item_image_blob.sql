BEGIN;

-- The item picture is stored as a blob directly in items.image_url (same approach as users.avatar_url).
-- Only convert while the column is still TEXT: running this again must never wipe uploaded pictures.
-- The TEXT column was never written to, so nothing is lost by the conversion.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items'
          AND column_name = 'image_url'
          AND data_type <> 'bytea'
    ) THEN
        ALTER TABLE items ALTER COLUMN image_url TYPE BYTEA USING NULL;
    END IF;
END $$;

-- Changes on every upload, so the app can bust its image cache (?v=...)
ALTER TABLE items
    ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;

COMMIT;
