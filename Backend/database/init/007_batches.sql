-- Varepartier. Hvert parti har sin egen QR-kode, mængde og udløbsdato.
CREATE TABLE batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id             UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES users(id),
    qr_code             TEXT NOT NULL UNIQUE,
    initial_quantity    NUMERIC(12, 3) NOT NULL CHECK (initial_quantity > 0),
    remaining_quantity  NUMERIC(12, 3) NOT NULL
                    CHECK (remaining_quantity >= 0 AND remaining_quantity <= initial_quantity),
    purchase_date       DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX batches_item_idx ON batches (item_id);
CREATE INDEX batches_expiry_idx ON batches (expiry_date) WHERE remaining_quantity > 0;
