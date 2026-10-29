BEGIN;

CREATE TABLE company_memberships (
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('leder', 'medarbejder')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (company_id, user_id)
);

-- Overfør de eksisterende relationer mellem brugere og virksomheder.
INSERT INTO company_memberships (company_id, user_id, role)
SELECT company_id, id, role
FROM users;

-- Eksisterende virksomheder mangler disse oplysninger, så NULL tillades under migreringen.
-- Nye virksomheder skal få værdierne via API-validering.
ALTER TABLE companies
    ADD COLUMN cvr VARCHAR(8),
    ADD COLUMN address TEXT;

ALTER TABLE companies
    ADD CONSTRAINT companies_cvr_format_check
    CHECK (cvr IS NULL OR cvr ~ '^[0-9]{8}$');

CREATE UNIQUE INDEX companies_cvr_unique
    ON companies (cvr)
    WHERE cvr IS NOT NULL;

CREATE TABLE company_invitations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email      TEXT NOT NULL,
    role       TEXT NOT NULL CHECK (role IN ('leder', 'medarbejder')),
    invited_by UUID NOT NULL REFERENCES users(id),
    status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX company_invitations_pending_email_unique
    ON company_invitations (company_id, lower(email))
    WHERE status = 'pending';

-- Fjern de gamle kolonner, som nu håndteres af company_memberships.
ALTER TABLE users
    DROP CONSTRAINT users_company_id_fkey,
    DROP CONSTRAINT users_role_check;

DROP INDEX idx_users_company_id;

ALTER TABLE users
    DROP COLUMN company_id,
    DROP COLUMN role;

COMMIT;