-- Ensure seeded university account stays UNIVERSITY (not STUDENT)

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
    uni_uid UUID := '00000000-0000-0000-0000-000000000002';
    uni_email TEXT := 'fhm@gmail.com';
    uni_password TEXT := 'University@123';
BEGIN
    UPDATE auth.users
    SET
        email = uni_email,
        encrypted_password = extensions.crypt(uni_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'role', 'UNIVERSITY',
                'full_name', 'Fachhochschule des Mittelstands'
            ),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
            || jsonb_build_object(
                'provider', 'email',
                'providers', jsonb_build_array('email'),
                'role', 'UNIVERSITY'
            ),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        updated_at = NOW()
    WHERE id = uni_uid;

    UPDATE auth.identities
    SET
        provider_id = uni_uid::text,
        identity_data = jsonb_build_object('sub', uni_uid::text, 'email', uni_email),
        updated_at = NOW()
    WHERE user_id = uni_uid
      AND provider = 'email';

    IF NOT EXISTS (
        SELECT 1 FROM auth.identities WHERE user_id = uni_uid AND provider = 'email'
    ) THEN
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            uni_uid, uni_uid, uni_uid::text,
            jsonb_build_object('sub', uni_uid::text, 'email', uni_email),
            'email', NOW(), NOW(), NOW()
        );
    END IF;

    UPDATE profile
    SET
        email = uni_email,
        role = 'UNIVERSITY',
        first_name = COALESCE(NULLIF(first_name, ''), 'Fachhochschule'),
        last_name = COALESCE(NULLIF(last_name, ''), 'des Mittelstands'),
        updated_at = NOW()
    WHERE id = uni_uid;

    INSERT INTO university (profile_id, website, country, city, address, description)
    VALUES (
        uni_uid,
        'https://www.fhm.de',
        'Germany',
        'Bielefeld',
        'Ravensberger Str. 10G, 33602 Bielefeld',
        'Fachhochschule des Mittelstands (FHM) – University of Applied Sciences for SMEs.'
    )
    ON CONFLICT (profile_id) DO NOTHING;

    DELETE FROM student WHERE profile_id = uni_uid;
END $$;
