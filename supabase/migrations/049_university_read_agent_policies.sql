-- Allow university users to read agents and related KYC data for the agent dashboard.

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
