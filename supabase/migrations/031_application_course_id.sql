-- Replace application.program_id with application.course_id

ALTER TABLE application
    DROP CONSTRAINT IF EXISTS application_program_id_fkey;

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course(id) ON DELETE CASCADE;

-- Legacy rows cannot be mapped from program to course automatically.
DELETE FROM application
WHERE course_id IS NULL;

ALTER TABLE application
    DROP COLUMN IF EXISTS program_id;

ALTER TABLE application
    ALTER COLUMN course_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_course_id ON application(course_id);

-- Allow authenticated users to create applications for permitted profiles
DROP POLICY IF EXISTS "app_insert_own" ON application;
CREATE POLICY "app_insert_own" ON application
    FOR INSERT
    WITH CHECK (
        submitted_by_profile_id = auth.uid()
        OR profile_id = auth.uid()
    );
