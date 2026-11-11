BEGIN;

-- The profile picture is stored as a blob directly in users.avatar_url.
-- Existing text values (old URLs) cannot be converted to image bytes, so they are cleared.
ALTER TABLE users
    ALTER COLUMN avatar_url TYPE BYTEA USING NULL;

COMMIT;
