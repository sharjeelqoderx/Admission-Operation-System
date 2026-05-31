-- Add application deadline date to course

ALTER TABLE course
    ADD COLUMN IF NOT EXISTS deadline_date DATE;

CREATE INDEX IF NOT EXISTS idx_course_deadline_date ON course(deadline_date);
