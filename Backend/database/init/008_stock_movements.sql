-- Log over alle lagerændringer (UC-03).
-- Opdatér batches.remaining_quantity og indsæt her i samme transaktion.
CREATE TABLE stock_movements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    user_id     UUID NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL CHECK (type IN ('modtaget', 'brugt', 'solgt', 'kasseret', 'optælling')),
    quantity    NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX stock_movements_batch_idx ON stock_movements (batch_id);
CREATE INDEX stock_movements_user_idx ON stock_movements (user_id);
