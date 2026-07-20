-- Allow agents to read documents (and related rows) for students they created,
-- including documents uploaded by the student themselves.

DROP POLICY IF EXISTS "document_select_agent" ON document;
CREATE POLICY "document_select_agent"
    ON document
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM student s
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE s.profile_id = document.profile_id
              AND a.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_files_select_agent" ON document_files;
CREATE POLICY "document_files_select_agent"
    ON document_files
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_files.document_id
              AND a.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_review_select_agent" ON document_review;
CREATE POLICY "document_review_select_agent"
    ON document_review
    FOR SELECT
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
    );

-- Ensure uploader/owner can read reviews when policy was never applied
DROP POLICY IF EXISTS "doc_review_select_by_uploader" ON document_review;
CREATE POLICY "doc_review_select_by_uploader"
    ON document_review
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            WHERE d.id = document_review.document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );
