BEGIN;

-- New notification types (see notification.md):
--   udsolgt        an item ran out of stock after someone used it
--   indkoebsliste  someone put an item on the shopping list
-- Safe to run more than once: the old check is dropped before the new one is added.
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('udloeb', 'lav_beholdning', 'udsolgt', 'indkoebsliste'));

COMMIT;
