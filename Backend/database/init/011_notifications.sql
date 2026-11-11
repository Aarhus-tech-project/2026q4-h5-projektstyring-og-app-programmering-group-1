-- Log over sendte notifikationer.
CREATE TABLE notifications (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    batch_id  UUID REFERENCES batches(id) ON DELETE SET NULL,
    item_id   UUID REFERENCES items(id) ON DELETE SET NULL,
    type      TEXT NOT NULL CHECK (type IN ('udloeb', 'lav_beholdning')),
    message   TEXT NOT NULL DEFAULT '',
    sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at   TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ  -- sat når brugeren sletter notifikationen
);

CREATE INDEX notifications_user_idx ON notifications (user_id, sent_at DESC);
