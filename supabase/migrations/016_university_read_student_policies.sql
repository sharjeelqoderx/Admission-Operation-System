-- ============================================================
-- 016_university_read_student_policies.sql
-- Allow UNIVERSITY role users to read all student + profile data
-- ============================================================

-- University can read ALL student records
CREATE POLICY "student_select_university"
ON student FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profile p
        WHERE p.id = auth.uid()
        AND p.role = 'UNIVERSITY'
    )
);

-- University can read ALL profiles (needed to join student → profile)
CREATE POLICY "profile_select_university"
ON profile FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profile p
        WHERE p.id = auth.uid()
        AND p.role = 'UNIVERSITY'
    )
);
