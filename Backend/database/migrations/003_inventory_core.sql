BEGIN;

-- Opretter lagerets grundtabeller.
-- Varekategorier pr. restaurant
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, name)
);

-- Varetyper. Mængde og udløbsdato ligger på batches.
CREATE TABLE items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    unit          TEXT NOT NULL,
    min_quantity  NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    image_url     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX items_company_idx ON items (company_id);
CREATE INDEX items_category_idx ON items (category_id);

-- Varepartier med mængde og udløbsdato. QR-kode er valgfri.
CREATE TABLE batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id             UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES users(id),
    qr_code TEXT UNIQUE,
    initial_quantity    NUMERIC(12, 3) NOT NULL CHECK (initial_quantity > 0),
    remaining_quantity  NUMERIC(12, 3) NOT NULL
                    CHECK (remaining_quantity >= 0 AND remaining_quantity <= initial_quantity),
    purchase_date       DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX batches_item_idx ON batches (item_id);
CREATE INDEX batches_expiry_idx ON batches (expiry_date) WHERE remaining_quantity > 0;


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


-- Påmindelsesindstillinger. Én række pr. restaurant.
CREATE TABLE reminder_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    days_before_expiry  INT NOT NULL DEFAULT 3 CHECK (days_before_expiry >= 0),
    daily_check_time    TIME NOT NULL DEFAULT '08:00'
);

-- Expo push-tokens pr. enhed
CREATE TABLE push_tokens (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token  TEXT NOT NULL UNIQUE,
    platform         TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);

-- Log over sendte notifikationer.
CREATE TABLE notifications (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    batch_id  UUID REFERENCES batches(id) ON DELETE SET NULL,
    item_id   UUID REFERENCES items(id) ON DELETE SET NULL,
    type      TEXT NOT NULL CHECK (type IN ('udloeb', 'lav_beholdning')),
    sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at   TIMESTAMPTZ
);

CREATE INDEX notifications_user_idx ON notifications (user_id, sent_at DESC);

COMMIT;

