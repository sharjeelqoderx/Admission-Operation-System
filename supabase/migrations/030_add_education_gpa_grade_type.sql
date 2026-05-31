-- Add GPA and grade type (percentage | gpa) to education

ALTER TABLE education
    ADD COLUMN IF NOT EXISTS gpa NUMERIC(4, 2),
    ADD COLUMN IF NOT EXISTS grade_type TEXT;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'education_grade_type_check'
    ) THEN
        ALTER TABLE education
            ADD CONSTRAINT education_grade_type_check
            CHECK (grade_type IS NULL OR grade_type IN ('percentage', 'gpa'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_education_grade_type ON education(grade_type);
