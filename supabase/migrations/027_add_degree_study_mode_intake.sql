-- Add study_mode (full_time / part_time) and intake_date to degree

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_mode_enum') THEN
        CREATE TYPE study_mode_enum AS ENUM ('full_time', 'part_time');
    END IF;
END $$;

ALTER TABLE degree
    ADD COLUMN IF NOT EXISTS study_mode  study_mode_enum,
    ADD COLUMN IF NOT EXISTS intake_date DATE;

CREATE INDEX IF NOT EXISTS idx_degree_study_mode  ON degree(study_mode);
CREATE INDEX IF NOT EXISTS idx_degree_intake_date ON degree(intake_date);
