-- ============================================================
-- 002_seed_platform_data.sql
-- Single platform seed migration (auth users + staff rows).
-- Constant reference data (course, degree, document_type, etc.)
-- is seeded in 001_initial_schema.sql.
-- Safe to re-run after operational data reset.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- ─── Development auth users ──────────────────────────────────
DO $$
DECLARE
    seed_user RECORD;
BEGIN
    FOR seed_user IN
        SELECT *
        FROM (VALUES
            (
                '00000000-0000-0000-0000-000000000001'::UUID,
                'developer@gmail.com',
                'Shar@123',
                'SUPER_ADMIN'::role_enum,
                'System',
                'Developer',
                '+4930000001'
            ),
            (
                '00000000-0000-0000-0000-000000000002'::UUID,
                'admin@gmail.com',
                'Shar@123',
                'ADMIN'::role_enum,
                'FHM',
                'Admin',
                '+4930000002'
            ),
            (
                '00000000-0000-0000-0000-000000000003'::UUID,
                'agent@gmail.com',
                'Shar@123',
                'AGENT'::role_enum,
                'Admissions',
                'Agent',
                '+4930000003'
            ),
            (
                '00000000-0000-0000-0000-000000000004'::UUID,
                'management@gmail.com',
                'Shar@123',
                'MANAGEMENT'::role_enum,
                'FHM',
                'Management',
                '+4930000004'
            ),
            (
                '00000000-0000-0000-0000-000000000005'::UUID,
                'student@gmail.com',
                'Shar@123',
                'STUDENT'::role_enum,
                'Direct',
                'Student',
                '+4930000005'
            ),
            (
                '00000000-0000-0000-0000-000000000006'::UUID,
                'student+agent@gmail.com',
                'Shar@123',
                'STUDENT'::role_enum,
                'Agent',
                'Student',
                '+4930000006'
            )
        ) AS users(id, email, plain_password, user_role, first_name, last_name, phone)
    LOOP
        IF EXISTS (
            SELECT 1
            FROM auth.users
            WHERE email = seed_user.email
              AND id <> seed_user.id
        ) THEN
            CONTINUE;
        END IF;

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            email_change_token_current,
            phone_change,
            phone_change_token,
            reauthentication_token
        )
        VALUES (
            seed_user.id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            seed_user.email,
            extensions.crypt(seed_user.plain_password, extensions.gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            jsonb_build_object(
                'provider', 'email',
                'providers', jsonb_build_array('email'),
                'role', seed_user.user_role::TEXT
            ),
            jsonb_build_object(
                'role', seed_user.user_role::TEXT,
                'first_name', seed_user.first_name,
                'last_name', seed_user.last_name,
                'phone', seed_user.phone
            ),
            FALSE,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
        )
        ON CONFLICT (id) DO UPDATE
        SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
            raw_app_meta_data = EXCLUDED.raw_app_meta_data,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            confirmation_token = '',
            recovery_token = '',
            email_change_token_new = '',
            email_change = '',
            email_change_token_current = '',
            phone_change = '',
            phone_change_token = '',
            reauthentication_token = '',
            updated_at = NOW();

        INSERT INTO profile (
            id,
            first_name,
            last_name,
            email,
            phone,
            role,
            updated_at
        )
        VALUES (
            seed_user.id,
            seed_user.first_name,
            seed_user.last_name,
            seed_user.email,
            seed_user.phone,
            seed_user.user_role,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            updated_at = NOW();

        IF EXISTS (
            SELECT 1
            FROM auth.identities
            WHERE user_id = seed_user.id
              AND provider = 'email'
        ) THEN
            UPDATE auth.identities
            SET
                provider_id = seed_user.id::TEXT,
                identity_data = jsonb_build_object(
                    'sub', seed_user.id::TEXT,
                    'email', seed_user.email,
                    'email_verified', TRUE
                ),
                updated_at = NOW()
            WHERE user_id = seed_user.id
              AND provider = 'email';
        ELSE
            INSERT INTO auth.identities (
                id,
                user_id,
                provider_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            )
            VALUES (
                seed_user.id,
                seed_user.id,
                seed_user.id::TEXT,
                jsonb_build_object(
                    'sub', seed_user.id::TEXT,
                    'email', seed_user.email,
                    'email_verified', TRUE
                ),
                'email',
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;

-- ─── Staff organization rows ─────────────────────────────────
INSERT INTO university (
    id,
    profile_id,
    website,
    country,
    city,
    address,
    description,
    updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'https://www.fhm.de',
        'Germany',
        'Bielefeld',
        'Ravensberger Str. 10G, 33602 Bielefeld',
        'Fachhochschule des Mittelstands (FHM)',
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000004',
        'https://www.fhm.de',
        'Germany',
        'Bielefeld',
        'Ravensberger Str. 10G, 33602 Bielefeld',
        'FHM Management Office',
        NOW()
    )
ON CONFLICT (profile_id) DO UPDATE
SET
    website = EXCLUDED.website,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO campus (
    profile_id,
    name,
    established_year,
    location,
    campus_type,
    status
)
SELECT
    '00000000-0000-0000-0000-000000000002'::UUID,
    'FHM Bielefeld',
    1999,
    'Bielefeld, Germany',
    'MAIN',
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1
    FROM campus
    WHERE profile_id = '00000000-0000-0000-0000-000000000002'
);

INSERT INTO agent (
    id,
    profile_id,
    contact_person_first_name,
    contact_person_last_name,
    nationality,
    country,
    city,
    address,
    experience_years,
    website,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Admissions',
    'Agent',
    'German',
    'Germany',
    'Bielefeld',
    'Ravensberger Str. 10G, 33602 Bielefeld',
    5,
    'https://www.fhm.de',
    NOW()
)
ON CONFLICT (profile_id) DO UPDATE
SET
    contact_person_first_name = EXCLUDED.contact_person_first_name,
    contact_person_last_name = EXCLUDED.contact_person_last_name,
    nationality = EXCLUDED.nationality,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    experience_years = EXCLUDED.experience_years,
    website = EXCLUDED.website,
    updated_at = NOW();

INSERT INTO student (
    id,
    profile_id,
    country,
    city,
    nationality,
    updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000005',
        'Germany',
        'Berlin',
        'German',
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000006',
        'Germany',
        'Berlin',
        'German',
        NOW()
    )
ON CONFLICT (profile_id) DO UPDATE
SET
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    nationality = EXCLUDED.nationality,
    updated_at = NOW();

UPDATE student AS s
SET
    created_by_agent_id = a.id,
    updated_at = NOW()
FROM agent AS a
WHERE s.profile_id = '00000000-0000-0000-0000-000000000006'
  AND a.profile_id = '00000000-0000-0000-0000-000000000003'
  AND s.created_by_agent_id IS DISTINCT FROM a.id;
