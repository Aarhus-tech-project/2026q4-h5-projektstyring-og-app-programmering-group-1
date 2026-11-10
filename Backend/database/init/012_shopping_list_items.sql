-- Virksomhedens fælles indkøbsliste.
ALTER TABLE items
    ADD CONSTRAINT items_company_id_unique UNIQUE (company_id, id);

CREATE TABLE shopping_list_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_id     UUID NOT NULL,
    quantity    NUMERIC(12, 3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT shopping_list_items_company_item_fk
        FOREIGN KEY (company_id, item_id)
        REFERENCES items(company_id, id)
        ON DELETE CASCADE,

    CONSTRAINT shopping_list_items_company_item_unique
        UNIQUE (company_id, item_id)
);
