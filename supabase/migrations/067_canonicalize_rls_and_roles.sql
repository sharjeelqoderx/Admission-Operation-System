-- Canonical security correction after reviewing the complete migration chain.
-- Removes anonymous access to sensitive records, prevents role escalation,
-- restores scoped authenticated access, and gives ADMIN explicit access.

-- ─── Trusted role resolution ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT p.role
    FROM public.profile AS p
    WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO service_role;

-- Signup metadata is user-controlled; staff roles must only come from
-- server-controlled app metadata.
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

    IF app_role IN ('ADMIN', 'UNIVERSITY', 'AGENT') THEN
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
    ELSIF new_role = 'UNIVERSITY' THEN
        INSERT INTO public.university (profile_id)
        VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- ─── Remove dangerous anonymous policies ─────────────────────
DROP POLICY IF EXISTS "profile_public_read" ON public.profile;
DROP POLICY IF EXISTS "profile_public_update" ON public.profile;
DROP POLICY IF EXISTS "student_public_read" ON public.student;
DROP POLICY IF EXISTS "application_public_read" ON public.application;
DROP POLICY IF EXISTS "application_review_public_read" ON public.application_review;
DROP POLICY IF EXISTS "offer_public_read" ON public.offer_letter;
DROP POLICY IF EXISTS "offer_public_update" ON public.offer_letter;

-- Legacy duplicate policies superseded by canonical policies.
DROP POLICY IF EXISTS "profile_select_agent" ON public.profile;
DROP POLICY IF EXISTS "student_select_agent" ON public.student;
DROP POLICY IF EXISTS "education_select_agent" ON public.education;
DROP POLICY IF EXISTS "agent_university_read" ON public.agent;
DROP POLICY IF EXISTS "document_university_read" ON public.document;
DROP POLICY IF EXISTS "document_review_university_read" ON public.document_review;
DROP POLICY IF EXISTS "document_files_university_read" ON public.document_files;

-- ─── Protect profile role and identity columns ───────────────
REVOKE UPDATE ON public.profile FROM anon;
REVOKE UPDATE ON public.profile FROM authenticated;

GRANT UPDATE (
    first_name,
    last_name,
    title,
    phone,
    date_of_birth,
    gender,
    avatar_url
) ON public.profile TO authenticated;

DROP POLICY IF EXISTS "profile_select_own" ON public.profile;
CREATE POLICY "profile_select_own"
    ON public.profile
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "profile_update_own" ON public.profile;
CREATE POLICY "profile_update_own"
    ON public.profile
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ─── Canonical self/scoped reads ─────────────────────────────
DROP POLICY IF EXISTS "student_select_own_canonical" ON public.student;
CREATE POLICY "student_select_own_canonical"
    ON public.student
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "application_select_participant" ON public.application;
CREATE POLICY "application_select_participant"
    ON public.application
    FOR SELECT
    TO authenticated
    USING (
        profile_id = auth.uid()
        OR submitted_by_profile_id = auth.uid()
        OR university_id = auth.uid()
    );

DROP POLICY IF EXISTS "application_review_select_participant" ON public.application_review;
CREATE POLICY "application_review_select_participant"
    ON public.application_review
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND (
                  a.profile_id = auth.uid()
                  OR a.submitted_by_profile_id = auth.uid()
                  OR a.university_id = auth.uid()
              )
        )
    );

DROP POLICY IF EXISTS "application_document_select_participant" ON public.application_document;
CREATE POLICY "application_document_select_participant"
    ON public.application_document
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_document.application_id
              AND (
                  a.profile_id = auth.uid()
                  OR a.submitted_by_profile_id = auth.uid()
                  OR a.university_id = auth.uid()
              )
        )
    );

DROP POLICY IF EXISTS "offer_select_participant" ON public.offer_letter;
CREATE POLICY "offer_select_participant"
    ON public.offer_letter
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = offer_letter.application_id
              AND (
                  a.profile_id = auth.uid()
                  OR a.submitted_by_profile_id = auth.uid()
                  OR a.university_id = auth.uid()
              )
        )
    );

DROP POLICY IF EXISTS "message_insert_participant" ON public.message;
DROP POLICY IF EXISTS "msg_insert_own" ON public.message;
CREATE POLICY "message_insert_participant"
    ON public.message
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_profile_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.conversation AS c
            WHERE c.id = message.conversation_id
              AND auth.uid() IN (c.student_id, c.agent_id, c.university_id)
        )
    );

-- Universities can maintain their own organization profile.
DROP POLICY IF EXISTS "university_manage_own" ON public.university;
CREATE POLICY "university_manage_own"
    ON public.university
    FOR ALL
    TO authenticated
    USING (
        profile_id = auth.uid()
        AND public.current_profile_role() = 'UNIVERSITY'
    )
    WITH CHECK (
        profile_id = auth.uid()
        AND public.current_profile_role() = 'UNIVERSITY'
    );

-- Students can read payments tied to their own applications.
DROP POLICY IF EXISTS "payment_select_student_own" ON public.payment;
CREATE POLICY "payment_select_student_own"
    ON public.payment
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = payment.application_id
              AND a.profile_id = auth.uid()
        )
    );

-- Course removal is soft-delete. Only ADMIN may hard-delete.
DROP POLICY IF EXISTS "course_staff_delete" ON public.course;
DROP POLICY IF EXISTS "course_delete" ON public.course;
DROP POLICY IF EXISTS "course_admin_delete" ON public.course;
CREATE POLICY "course_admin_delete"
    ON public.course
    FOR DELETE
    TO authenticated
    USING (public.current_profile_role() = 'ADMIN');

-- Preserve template ownership during updates.
CREATE OR REPLACE FUNCTION public.preserve_document_template_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.created_by_profile_id IS DISTINCT FROM OLD.created_by_profile_id THEN
        RAISE EXCEPTION 'Template ownership cannot be changed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preserve_document_template_owner
    ON public.document_template;
CREATE TRIGGER trg_preserve_document_template_owner
    BEFORE UPDATE ON public.document_template
    FOR EACH ROW
    EXECUTE FUNCTION public.preserve_document_template_owner();

DROP POLICY IF EXISTS "document_template_update_auth" ON public.document_template;
CREATE POLICY "document_template_update_auth"
    ON public.document_template
    FOR UPDATE
    TO authenticated
    USING (
        is_deleted = false
        AND (
            created_by_profile_id = auth.uid()
            OR public.current_profile_role() IN ('ADMIN', 'UNIVERSITY', 'AGENT')
        )
    )
    WITH CHECK (
        created_by_profile_id = auth.uid()
        OR public.current_profile_role() IN ('ADMIN', 'UNIVERSITY', 'AGENT')
    );

-- ─── Explicit ADMIN access across all application tables ─────
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
             USING (public.current_profile_role() = ''ADMIN'')
             WITH CHECK (public.current_profile_role() = ''ADMIN'')',
            table_name
        );
    END LOOP;
END $$;
