-- Soft delete via SECURITY DEFINER RPC so authenticated users can delete
-- without fighting UPDATE ... WITH CHECK RLS on is_deleted = true.

CREATE OR REPLACE FUNCTION soft_delete_document_template(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role role_enum;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.role
    INTO v_role
    FROM profile p
    WHERE p.id = auth.uid();

    IF NOT EXISTS (
        SELECT 1
        FROM document_template dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
          AND (
              dt.created_by_profile_id = auth.uid()
              OR v_role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
          )
    ) THEN
        RAISE EXCEPTION 'Document template not found or not deletable';
    END IF;

    UPDATE document_template
    SET is_deleted = true,
        updated_at = NOW()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_document_template(UUID) TO authenticated;

-- Also relax UPDATE WITH CHECK so direct API updates can soft-delete if needed.
DROP POLICY IF EXISTS "document_template_update_auth" ON document_template;

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
    WITH CHECK (true);
