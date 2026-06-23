-- Allow university users to read agents and related KYC data for the agent dashboard.

DROP POLICY IF EXISTS "agent_university_read" ON agent;
CREATE POLICY "agent_university_read"
    ON agent
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_university_read" ON document;
CREATE POLICY "document_university_read"
    ON document
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_review_university_read" ON document_review;
CREATE POLICY "document_review_university_read"
    ON document_review
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_files_university_read" ON document_files;
CREATE POLICY "document_files_university_read"
    ON document_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );
