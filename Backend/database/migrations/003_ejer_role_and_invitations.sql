BEGIN;

ALTER TABLE company_memberships
    DROP CONSTRAINT company_memberships_role_check;


ALTER TABLE company_memberships
    ADD CONSTRAINT company_memberships_role_check
    CHECK (role IN ('ejer', 'leder', 'medarbejder'));


DO $$
DECLARE
    unclear_companies INT;
BEGIN
    SELECT count(*) INTO unclear_companies
    FROM companies c
    WHERE (
        SELECT count(*)
        FROM company_memberships cm
        WHERE cm.company_id = c.id AND cm.role = 'leder'
    ) <> 1;

    IF unclear_companies > 0 THEN
        RAISE EXCEPTION '% companies do not have exactly one leder. Choose their ejer manually.', unclear_companies;
    END IF;
END $$;

UPDATE company_memberships
SET role = 'ejer'
WHERE role = 'leder';

CREATE UNIQUE INDEX company_memberships_ejer_unique
    ON company_memberships (company_id)
    WHERE role = 'ejer';


ALTER TABLE company_invitations
    DROP COLUMN IF EXISTS token_hash;


UPDATE company_invitations
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

ALTER TABLE company_invitations
    ALTER COLUMN expires_at SET NOT NULL;

COMMIT;




