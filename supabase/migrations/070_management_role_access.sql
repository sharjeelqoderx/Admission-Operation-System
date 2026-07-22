-- Grant MANAGEMENT the same university-scoped access as ADMIN.

CREATE OR REPLACE FUNCTION public.is_university_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.current_profile_role() IN ('ADMIN', 'MANAGEMENT');
$$;

REVOKE ALL ON FUNCTION public.is_university_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_university_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_university_role() TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    new_role public.role_enum := 'STUDENT';
    app_role TEXT;
BEGIN
    app_role := NEW.raw_app_meta_data->>'role';

    IF app_role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT') THEN
        new_role := app_role::public.role_enum;
    END IF;

    INSERT INTO public.profile (
        id,
        first_name,
        last_name,
        title,
        email,
        phone,
        role
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'title',
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        new_role
    )
    ON CONFLICT (id) DO NOTHING;

    IF new_role = 'AGENT' THEN
        INSERT INTO public.agent (profile_id)
        VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    ELSIF new_role = 'STUDENT' THEN
        INSERT INTO public.student (profile_id)
        VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    ELSIF new_role IN ('ADMIN', 'MANAGEMENT') THEN
        INSERT INTO public.university (profile_id)
        VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "university_manage_own" ON public.university;
CREATE POLICY "university_manage_own"
    ON public.university
    FOR ALL
    TO authenticated
    USING (
        profile_id = auth.uid()
        AND public.is_university_role()
    )
    WITH CHECK (
        profile_id = auth.uid()
        AND public.is_university_role()
    );

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'profile',
        'student',
        'education',
        'work_experience',
        'agent',
        'university',
        'campus',
        'program',
        'campus_program_junction',
        'education_type',
        'document_type',
        'degree_requirement',
        'levels',
        'document_type_level',
        'degree',
        'course',
        'program_document_requirements',
        'document',
        'document_files',
        'document_review',
        'application',
        'application_document',
        'application_review',
        'offer_letter',
        'payment',
        'conversation',
        'message',
        'document_template'
    ]
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS "canonical_admin_all" ON public.%I',
            table_name
        );
        EXECUTE format(
            'CREATE POLICY "canonical_admin_all" ON public.%I
             FOR ALL TO authenticated
             USING (public.is_university_role())
             WITH CHECK (public.is_university_role())',
            table_name
        );
    END LOOP;
END $$;

DROP POLICY IF EXISTS "profile_select_university_staff" ON public.profile;
CREATE POLICY "profile_select_university_staff"
    ON public.profile
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "student_select_university_staff" ON public.student;
CREATE POLICY "student_select_university_staff"
    ON public.student
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "education_select_university_staff" ON public.education;
CREATE POLICY "education_select_university_staff"
    ON public.education
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "work_experience_select_university_staff" ON public.work_experience;
CREATE POLICY "work_experience_select_university_staff"
    ON public.work_experience
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "application_select_university_staff" ON public.application;
CREATE POLICY "application_select_university_staff"
    ON public.application
    FOR SELECT
    TO authenticated
    USING (
        public.is_university_role()
        AND university_id = auth.uid()
    );

DROP POLICY IF EXISTS "application_review_select_university_staff" ON public.application_review;
CREATE POLICY "application_review_select_university_staff"
    ON public.application_review
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

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
              AND a.university_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_select_university_staff" ON public.document;
CREATE POLICY "document_select_university_staff"
    ON public.document
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "document_files_select_university_staff" ON public.document_files;
CREATE POLICY "document_files_select_university_staff"
    ON public.document_files
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "document_review_select_university_staff" ON public.document_review;
CREATE POLICY "document_review_select_university_staff"
    ON public.document_review
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "payment_select_university_staff" ON public.payment;
CREATE POLICY "payment_select_university_staff"
    ON public.payment
    FOR SELECT
    TO authenticated
    USING (public.is_university_role());

DROP POLICY IF EXISTS "document_template_update_auth" ON public.document_template;
CREATE POLICY "document_template_update_auth"
    ON public.document_template
    FOR UPDATE
    TO authenticated
    USING (
        is_deleted = false
        AND (
            created_by_profile_id = auth.uid()
            OR public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
        )
    )
    WITH CHECK (
        created_by_profile_id = auth.uid()
        OR public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
    );
