-- ============================================================
-- 010_seed.sql  –  Default admin + university seed (ERD schema)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
    admin_uid UUID := '00000000-0000-0000-0000-000000000001';
    uni_uid   UUID := '00000000-0000-0000-0000-000000000002';
    uni_id    UUID;
    pw_hash   TEXT;
BEGIN
    pw_hash := extensions.crypt('Admin@1234!', extensions.gen_salt('bf'));

    -- ─── auth.users ──────────────────────────────────────────
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES
    (
        admin_uid, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'admin@fhm.de', pw_hash,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"FHM Administrator","role":"ADMIN"}',
        FALSE
    ),
    (
        uni_uid, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'university@fhm.de', pw_hash,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Fachhochschule des Mittelstands","role":"UNIVERSITY"}',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    -- ─── profile (trigger may have already created these) ────
    INSERT INTO profile (id, name, email, phone, role)
    VALUES
        (admin_uid, 'FHM Administrator',              'admin@fhm.de',      '+4930000001', 'ADMIN'),
        (uni_uid,   'Fachhochschule des Mittelstands', 'university@fhm.de', '+4952195210', 'UNIVERSITY')
    ON CONFLICT (id) DO UPDATE SET
        name  = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role  = EXCLUDED.role;

    -- ─── university record ───────────────────────────────────
    INSERT INTO university (profile_id, website, country, city, address, description)
    VALUES (
        uni_uid,
        'https://www.fhm.de',
        'Germany',
        'Bielefeld',
        'Ravensberger Str. 10G, 33602 Bielefeld',
        'Fachhochschule des Mittelstands (FHM) – University of Applied Sciences for SMEs.'
    )
    ON CONFLICT (profile_id) DO NOTHING
    RETURNING id INTO uni_id;

    -- ─── default campus ──────────────────────────────────────
    IF uni_id IS NOT NULL THEN
        INSERT INTO campus (profile_id, name, established_year, location, campus_type, status)
        VALUES (uni_uid, 'FHM Bielefeld', 1999, 'Bielefeld, Germany', 'MAIN', 'ACTIVE')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;
