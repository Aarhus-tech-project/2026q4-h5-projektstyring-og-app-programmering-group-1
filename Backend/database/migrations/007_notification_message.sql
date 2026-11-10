BEGIN;

-- Selve teksten i notifikationen, så appen kan vise den i notifikationslisten.
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

-- Sættes når brugeren sletter (swiper) en notifikation. Rækken beholdes, så
-- notifikationstjekket kan se at den allerede er sendt og ikke opretter den igen.
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMIT;
