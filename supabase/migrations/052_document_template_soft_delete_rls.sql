-- Fix document_template RLS so soft delete (UPDATE is_deleted = true) works
-- for creators and staff roles (ADMIN, UNIVERSITY, AGENT).

DROP POLICY IF EXISTS "document_template_update_auth" ON document_template;
DROP POLICY IF EXISTS "document_template_delete_auth" ON document_template;

CREATE POLICY "document_template_update_auth"
    ON document_template
    FOR UPDATE
    TO authenticated
    USING (
        is_deleted = false
        AND (
            auth.uid() = created_by_profile_id
            OR EXISTS (
                SELECT 1
                FROM profile p
                WHERE p.id = auth.uid()
                  AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
            )
        )
    )
    WITH CHECK (
        auth.uid() = created_by_profile_id
        OR EXISTS (
            SELECT 1
            FROM profile p
            WHERE p.id = auth.uid()
              AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
        )
    );

CREATE POLICY "document_template_delete_auth"
    ON document_template
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by_profile_id
        OR EXISTS (
            SELECT 1
            FROM profile p
            WHERE p.id = auth.uid()
              AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
        )
    );
