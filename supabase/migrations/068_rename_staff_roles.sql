-- Rename staff roles without changing their existing access semantics:
-- ADMIN becomes SUPER_ADMIN, and UNIVERSITY becomes ADMIN.

ALTER TYPE public.role_enum RENAME VALUE 'ADMIN' TO 'SUPER_ADMIN';
ALTER TYPE public.role_enum RENAME VALUE 'UNIVERSITY' TO 'ADMIN';

-- JSON auth metadata is not backed by role_enum and must be migrated explicitly.
UPDATE auth.users
SET
    raw_app_meta_data = CASE raw_app_meta_data->>'role'
        WHEN 'ADMIN' THEN jsonb_set(raw_app_meta_data, '{role}', '"SUPER_ADMIN"', true)
        WHEN 'UNIVERSITY' THEN jsonb_set(raw_app_meta_data, '{role}', '"ADMIN"', true)
        ELSE raw_app_meta_data
    END,
    raw_user_meta_data = CASE raw_user_meta_data->>'role'
        WHEN 'ADMIN' THEN jsonb_set(raw_user_meta_data, '{role}', '"SUPER_ADMIN"', true)
        WHEN 'UNIVERSITY' THEN jsonb_set(raw_user_meta_data, '{role}', '"ADMIN"', true)
        ELSE raw_user_meta_data
    END,
    updated_at = NOW()
WHERE raw_app_meta_data->>'role' IN ('ADMIN', 'UNIVERSITY')
   OR raw_user_meta_data->>'role' IN ('ADMIN', 'UNIVERSITY');

-- New accounts only trust server-controlled app metadata for staff roles.
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

    IF app_role IN ('SUPER_ADMIN', 'ADMIN', 'AGENT') THEN
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
    ELSIF new_role = 'ADMIN' THEN
        INSERT INTO public.university (profile_id)
        VALUES (NEW.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Keep policy names aligned with the renamed roles. Enum constants inside
-- existing policies already follow the renamed enum values.
DROP POLICY IF EXISTS "course_admin_delete" ON public.course;
DROP POLICY IF EXISTS "course_super_admin_delete" ON public.course;
CREATE POLICY "course_super_admin_delete"
    ON public.course
    FOR DELETE
    TO authenticated
    USING (public.current_profile_role() = 'SUPER_ADMIN');

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
            'DROP POLICY IF EXISTS "canonical_super_admin_all" ON public.%I',
            table_name
        );
        EXECUTE format(
            'CREATE POLICY "canonical_super_admin_all" ON public.%I
             FOR ALL TO authenticated
             USING (public.current_profile_role() = ''SUPER_ADMIN'')
             WITH CHECK (public.current_profile_role() = ''SUPER_ADMIN'')',
            table_name
        );
    END LOOP;
END $$;
