-- ============================================================
-- 002_seed.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
    admin_id   UUID := '00000000-0000-0000-0000-000000000001';
    org_id     UUID := '00000000-0000-0000-0000-000000000002';
    student_id UUID := '00000000-0000-0000-0000-000000000003';
    admin_hash TEXT;
    student_hash TEXT;
BEGIN

    admin_hash   := extensions.crypt('admin',       extensions.gen_salt('bf'));
    student_hash := extensions.crypt('Student@1234!', extensions.gen_salt('bf'));

-- ─── Insert into auth.users ───────────────────────────────────
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
)
VALUES
(
    admin_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@gmail.com', admin_hash,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"FHM Administrator","is_verified":true}', FALSE
),
(
    org_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'org@gmail.com', admin_hash,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fachhochschule des Mittelstands","is_verified":true}', FALSE
),
(
    student_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ali@example.com', student_hash,
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ali Hassan","is_verified":true}', FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ─── profiles ─────────────────────────────────────────────────
INSERT INTO profiles (user_id, full_name, email, phone, role, is_verified, country, nationality)
VALUES (admin_id, 'FHM Administrator', 'admin@gmail.com', '+4930123456', 'Admin', TRUE, 'Germany', 'German')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, full_name, email, phone, role, is_verified, country, nationality, website)
VALUES (org_id, 'Fachhochschule des Mittelstands', 'org@gmail.com', '+4952195210', 'Organization', TRUE, 'Germany', 'German', 'https://www.fhm.de')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, full_name, email, phone, role, is_verified, country, nationality, gender, date_of_birth, guardian_email, guardian_phone)
VALUES (student_id, 'Ali Hassan', 'ali@example.com', '+923001234567', 'Student', TRUE, 'Pakistan', 'Pakistani', 'male', '2000-05-15', 'parent@example.com', '+923009876543')
ON CONFLICT (user_id) DO NOTHING;

-- ─── academic_background ──────────────────────────────────────
INSERT INTO academic_background (user_id, qualification, institute_name, gpa, desired_program, campus, english_test, about)
VALUES (student_id, 'Bachelor''s Degree', 'University of Karachi', 3.5, 'MBA', 'Berlin', 'IELTS', 'I want to study in Germany to gain international exposure.')
ON CONFLICT DO NOTHING;

-- ─── experience ───────────────────────────────────────────────
INSERT INTO experience (user_id, name, organization, industry, country, start_date, end_date, responsibility)
VALUES (student_id, 'Software Engineer', 'Systems Ltd', 'Technology', 'Pakistan', '2022-01-01', '2024-06-30', 'Developed web applications using React and Node.js.')
ON CONFLICT DO NOTHING;

END $$;
