-- Glemt password. Kun en HMAC af koden/tokenet gemmes, aldrig selve værdien.

-- 6-cifrede koder sendt på email. Gyldige i 10 minutter, maks 5 forsøg.
CREATE TABLE password_reset_codes (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash      BYTEA       NOT NULL,
    attempts       INTEGER     NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ NOT NULL,
    used_at        TIMESTAMPTZ,  -- koden blev bekræftet
    invalidated_at TIMESTAMPTZ   -- ny kode sendt, for mange forsøg eller password nulstillet
);

CREATE INDEX password_reset_codes_user_idx ON password_reset_codes (user_id, created_at DESC);

-- Kortlivede engangs-tokens, der udstedes når koden er bekræftet.
-- Kan kun bruges til at sætte et nyt password.
CREATE TABLE password_reset_tokens (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash     BYTEA       NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ NOT NULL,
    used_at        TIMESTAMPTZ,
    invalidated_at TIMESTAMPTZ
);

CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens (user_id);
