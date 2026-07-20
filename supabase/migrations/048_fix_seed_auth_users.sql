-- Fix seeded admin/university auth users for email/password login.
-- Raw INSERT into auth.users leaves NULL token columns and no auth.identities row,
-- which causes GoTrue error: "Database error querying schema".

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
    seed_user RECORD;
BEGIN
    FOR seed_user IN
        SELECT *
        FROM (VALUES
            ('00000000-0000-0000-0000-000000000001'::uuid, 'sharjeel.qoderx@gmail.com', 'Admin@123'),
            ('00000000-0000-0000-0000-000000000002'::uuid, 'fhm@gmail.com', 'University@123')
        ) AS t(id, email, plain_password)
    LOOP
        UPDATE auth.users
        SET
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change = COALESCE(email_change, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            phone_change = COALESCE(phone_change, ''),
            phone_change_token = COALESCE(phone_change_token, ''),
            reauthentication_token = COALESCE(reauthentication_token, ''),
            encrypted_password = extensions.crypt(seed_user.plain_password, extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = seed_user.id;

        IF NOT EXISTS (
            SELECT 1
            FROM auth.identities
            WHERE user_id = seed_user.id
              AND provider = 'email'
        ) THEN
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
                seed_user.id::text,
                jsonb_build_object('sub', seed_user.id::text, 'email', seed_user.email),
                'email',
                NOW(),
                NOW(),
                NOW()
            );
        ELSE
            UPDATE auth.identities
            SET
                provider_id = seed_user.id::text,
                identity_data = jsonb_build_object('sub', seed_user.id::text, 'email', seed_user.email),
                created_at = COALESCE(created_at, NOW()),
                updated_at = NOW()
            WHERE user_id = seed_user.id
              AND provider = 'email';
        END IF;
    END LOOP;
END $$;
