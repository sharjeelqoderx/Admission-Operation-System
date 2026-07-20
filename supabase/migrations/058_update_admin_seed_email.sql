-- Update seeded admin login email to sharjeel.qoderx@gmail.com

DO $$
DECLARE
    admin_uid UUID := '00000000-0000-0000-0000-000000000001';
    new_email TEXT := 'sharjeel.qoderx@gmail.com';
BEGIN
    UPDATE auth.users
    SET
        email = new_email,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = admin_uid;

    UPDATE auth.identities
    SET
        identity_data = jsonb_build_object('sub', admin_uid::text, 'email', new_email),
        updated_at = NOW()
    WHERE user_id = admin_uid
      AND provider = 'email';

    UPDATE profile
    SET
        email = new_email,
        updated_at = NOW()
    WHERE id = admin_uid;
END $$;
