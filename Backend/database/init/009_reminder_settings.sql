-- Påmindelsesindstillinger. Én række pr. restaurant.
CREATE TABLE reminder_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    days_before_expiry  INT NOT NULL DEFAULT 3 CHECK (days_before_expiry >= 0),
    daily_check_time    TIME NOT NULL DEFAULT '08:00'
);
