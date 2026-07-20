-- Update seeded university login email to fhm@gmail.com

DO $$
DECLARE
    uni_uid UUID := '00000000-0000-0000-0000-000000000002';
    new_email TEXT := 'fhm@gmail.com';
BEGIN
    UPDATE auth.users
    SET
        email = new_email,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = uni_uid;

    UPDATE auth.identities
    SET
        identity_data = jsonb_build_object('sub', uni_uid::text, 'email', new_email),
        updated_at = NOW()
    WHERE user_id = uni_uid
      AND provider = 'email';

    UPDATE profile
    SET
        email = new_email,
        updated_at = NOW()
    WHERE id = uni_uid;
END $$;
