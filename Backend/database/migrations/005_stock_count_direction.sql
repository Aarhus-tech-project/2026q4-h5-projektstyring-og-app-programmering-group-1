BEGIN;

-- Angiver retningen for manuelle lageroptællinger.
ALTER TABLE stock_movements
    ADD COLUMN direction TEXT
    CHECK (
        direction IS NULL
        OR (type = 'optælling' AND direction IN ('plus', 'minus'))
    );

COMMIT;
