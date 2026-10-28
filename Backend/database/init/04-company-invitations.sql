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