-- Many-to-many: one offer template can link to multiple courses/programs.
-- Each course may still belong to only one active template.

CREATE TABLE IF NOT EXISTS public.document_template_course (
    document_template_id UUID NOT NULL REFERENCES public.document_template(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (document_template_id, course_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_template_course_course_id_unique_idx
    ON public.document_template_course(course_id);

CREATE INDEX IF NOT EXISTS document_template_course_template_id_idx
    ON public.document_template_course(document_template_id);

COMMENT ON TABLE public.document_template_course IS
    'Links offer document templates to one or more courses. Each course may appear once.';

-- Backfill from legacy single course_id column
INSERT INTO public.document_template_course (document_template_id, course_id)
SELECT dt.id, dt.course_id
FROM public.document_template AS dt
WHERE dt.course_id IS NOT NULL
  AND dt.is_deleted = false
ON CONFLICT DO NOTHING;

-- Uniqueness now lives on the junction table
DROP INDEX IF EXISTS public.document_template_course_id_unique_idx;

ALTER TABLE public.document_template_course ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_template_course_select_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_select_auth"
    ON public.document_template_course
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "document_template_course_insert_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_insert_auth"
    ON public.document_template_course
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "document_template_course_update_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_update_auth"
    ON public.document_template_course
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "document_template_course_delete_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_delete_auth"
    ON public.document_template_course
    FOR DELETE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "document_template_course_service" ON public.document_template_course;
CREATE POLICY "document_template_course_service"
    ON public.document_template_course
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Soft-delete should free course assignments
CREATE OR REPLACE FUNCTION public.soft_delete_document_template(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role public.role_enum;
BEGIN
    SELECT p.role INTO caller_role
    FROM public.profile AS p
    WHERE p.id = auth.uid();

    IF caller_role IS NULL OR caller_role NOT IN (
        'SUPER_ADMIN'::public.role_enum,
        'ADMIN'::public.role_enum,
        'MANAGEMENT'::public.role_enum,
        'AGENT'::public.role_enum
    ) THEN
        RAISE EXCEPTION 'Forbidden';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.document_template AS dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Document template not found';
    END IF;

    DELETE FROM public.document_template_course
    WHERE document_template_id = template_id;

    UPDATE public.document_template
    SET
        is_deleted = true,
        course_id = NULL,
        updated_at = now()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO service_role;
