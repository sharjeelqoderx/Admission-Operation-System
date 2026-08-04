-- MANAGEMENT staff share the same application scope as the university ADMIN profile.
-- Applications store university_id as the ADMIN profile id, not the MANAGEMENT user id.

CREATE OR REPLACE FUNCTION public.management_university_scope_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT p.id
    FROM public.profile AS p
    WHERE p.role = 'ADMIN'
    UNION
    SELECT DISTINCT l.university_id
    FROM public.levels AS l
    WHERE l.university_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.management_university_scope_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.management_university_scope_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.management_university_scope_ids() TO service_role;

CREATE OR REPLACE FUNCTION public.can_access_university_application(target_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT CASE public.current_profile_role()
        WHEN 'ADMIN' THEN target_university_id = auth.uid()
        WHEN 'MANAGEMENT' THEN target_university_id IN (
            SELECT public.management_university_scope_ids()
        )
        ELSE FALSE
    END;
$$;

REVOKE ALL ON FUNCTION public.can_access_university_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_university_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_university_application(uuid) TO service_role;

DROP POLICY IF EXISTS "application_select_university_staff" ON public.application;
CREATE POLICY "application_select_university_staff"
    ON public.application
    FOR SELECT
    TO authenticated
    USING (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    );

DROP POLICY IF EXISTS "application_update_university_staff" ON public.application;
CREATE POLICY "application_update_university_staff"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    )
    WITH CHECK (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    );

DROP POLICY IF EXISTS "application_review_insert_university_staff" ON public.application_review;
CREATE POLICY "application_review_insert_university_staff"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_university_role()
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND public.can_access_university_application(a.university_id)
        )
    );

DROP POLICY IF EXISTS "offer_select_university_staff" ON public.offer_letter;
CREATE POLICY "offer_select_university_staff"
    ON public.offer_letter
    FOR SELECT
    TO authenticated
    USING (
        public.is_university_role()
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = offer_letter.application_id
              AND public.can_access_university_application(a.university_id)
        )
    );
