-- soft_delete_document_template still referenced legacy UNIVERSITY enum (renamed in 068).

CREATE OR REPLACE FUNCTION public.soft_delete_document_template(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_role public.role_enum;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.role
    INTO v_role
    FROM public.profile AS p
    WHERE p.id = auth.uid();

    IF NOT EXISTS (
        SELECT 1
        FROM public.document_template AS dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
          AND (
              dt.created_by_profile_id = auth.uid()
              OR v_role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
          )
    ) THEN
        RAISE EXCEPTION 'Document template not found or not deletable';
    END IF;

    UPDATE public.document_template
    SET is_deleted = true,
        updated_at = NOW()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO service_role;
