-- Allow agents to create offers for applications submitted by their linked students
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
                  OR (
                      p.role = 'AGENT'
                      AND EXISTS (
                          SELECT 1
                          FROM student s
                          INNER JOIN agent ag ON ag.id = s.created_by_agent_id
                          WHERE s.profile_id = a.profile_id
                            AND ag.profile_id = auth.uid()
                      )
                  )
                  OR p.role = 'ADMIN'
              )
        )
    );
