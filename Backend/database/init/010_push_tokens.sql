-- Expo push-tokens pr. enhed
CREATE TABLE push_tokens (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token  TEXT NOT NULL UNIQUE,
    platform         TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);
