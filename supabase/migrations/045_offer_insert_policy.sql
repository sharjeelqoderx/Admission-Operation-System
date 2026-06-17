-- Allow authenticated university/agent profiles to create offer letters
-- for applications they are allowed to manage (no service role required in API).

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
              AND (
                  (p.role = 'UNIVERSITY' AND a.university_id = auth.uid())
                  OR (p.role = 'AGENT' AND a.submitted_by_profile_id = auth.uid())
                  OR p.role = 'ADMIN'
              )
        )
    );
