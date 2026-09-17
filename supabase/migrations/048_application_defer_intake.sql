-- Defer Intake feature: Add columns to application table
-- is_deferred: Marks applications created via deferral (the duplicate/new application)
-- deferred_from_application_id: Links the deferred application back to the original rejected one
-- custom_intake_date: Overrides course/degree intake_date for deferred applications with new intake

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS is_deferred BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS deferred_from_application_id UUID
    REFERENCES application(id) ON DELETE SET NULL;

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS custom_intake_date DATE;

CREATE INDEX IF NOT EXISTS idx_application_is_deferred ON application(is_deferred);
CREATE INDEX IF NOT EXISTS idx_application_deferred_from ON application(deferred_from_application_id);
