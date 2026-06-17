-- Allow staff roles to create offers for any application (All Application View workflow)
DROP POLICY IF EXISTS "offer_insert_university_agent" ON offer_letter;

CREATE POLICY "offer_insert_university_agent"
    ON offer_letter
    FOR INSERT
    TO authenticated
    WITH CHECK (
        issued_by_profile_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM application a
            INNER JOIN profile p ON p.id = auth.uid()
            WHERE a.id = application_id
              AND p.role IN ('UNIVERSITY', 'AGENT', 'ADMIN')
        )
    );
