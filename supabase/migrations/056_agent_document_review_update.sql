-- Allow agents to review (update) documents for students they created.

DROP POLICY IF EXISTS "document_review_agent_update" ON document_review;

CREATE POLICY "document_review_agent_update"
    ON document_review
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_review.document_id
              AND a.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_review.document_id
              AND a.profile_id = auth.uid()
        )
    );
