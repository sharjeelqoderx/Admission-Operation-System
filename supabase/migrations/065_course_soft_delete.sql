-- Soft-delete courses so historical references remain intact.
ALTER TABLE course
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_course_is_deleted
    ON course (is_deleted);
