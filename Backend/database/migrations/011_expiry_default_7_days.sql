-- Expiry notifications now start 7 days before the expiry date, the same as the app's
-- "Udløber snart" marking (EXPIRY_WARNING_DAYS in Frontend/src/utils/inventoryUtils.js).
ALTER TABLE reminder_settings ALTER COLUMN days_before_expiry SET DEFAULT 7;
