CREATE TABLE company_memberships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('ejer', 'leder', 'medarbejder')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, company_id)
);
CREATE UNIQUE INDEX company_memberships_ejer_unique
    ON company_memberships (company_id)
    WHERE role = 'ejer';
