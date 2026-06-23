-- Allow university/admin to manage programs without service role key

DROP POLICY IF EXISTS "program_write" ON program;
DROP POLICY IF EXISTS "program_university_write" ON program;

CREATE POLICY "program_university_write" ON program
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'UNIVERSITY'
              AND program.profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'UNIVERSITY'
              AND profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "degree_insert" ON degree;
DROP POLICY IF EXISTS "degree_update" ON degree;
DROP POLICY IF EXISTS "degree_delete" ON degree;
DROP POLICY IF EXISTS "degree_staff_insert" ON degree;
DROP POLICY IF EXISTS "degree_staff_update" ON degree;
DROP POLICY IF EXISTS "degree_staff_delete" ON degree;

CREATE POLICY "degree_staff_insert" ON degree
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "degree_staff_update" ON degree
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "degree_staff_delete" ON degree
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "course_insert" ON course;
DROP POLICY IF EXISTS "course_update" ON course;
DROP POLICY IF EXISTS "course_delete" ON course;
DROP POLICY IF EXISTS "course_staff_insert" ON course;
DROP POLICY IF EXISTS "course_staff_update" ON course;
DROP POLICY IF EXISTS "course_staff_delete" ON course;

CREATE POLICY "course_staff_insert" ON course
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "course_staff_update" ON course
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "course_staff_delete" ON course
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "pdr_service" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_read" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_write" ON program_document_requirements;

CREATE POLICY "pdr_staff_read" ON program_document_requirements
    FOR SELECT
    USING (true);

CREATE POLICY "pdr_staff_write" ON program_document_requirements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "pdr_service" ON program_document_requirements
    FOR ALL
    USING (auth.role() = 'service_role');
