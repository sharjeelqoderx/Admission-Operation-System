-- ============================================================
-- 001_initial_schema.sql
-- Single squashed migration: schema, RLS policies, indexes,
-- functions, and idempotent platform user seeds.
-- Bulk CSV reference data is applied separately (already on
-- the linked database) and is not replayed here to avoid
-- deleting operational rows.
-- ============================================================


-- >>> BEGIN 001_init.sql

-- ============================================================
-- 001_init.sql  –  Full schema + seed
-- ============================================================

-- ─── ENUMs ───────────────────────────────────────────────────
CREATE TYPE gender_enum         AS ENUM ('MALE', 'FEMALE');
CREATE TYPE role_enum           AS ENUM ('STUDENT', 'AGENT', 'UNIVERSITY', 'ADMIN');
CREATE TYPE campus_status_enum  AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE program_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE doc_status_enum     AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVISION');
CREATE TYPE app_status_enum     AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVISION', 'PENDING');
CREATE TYPE offer_status_enum   AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TYPE conv_status_enum    AS ENUM ('OPEN', 'CLOSED');

-- ─── profile ─────────────────────────────────────────────────
CREATE TABLE profile (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT,
    email         TEXT UNIQUE,
    phone         TEXT,
    date_of_birth DATE,
    gender        gender_enum,
    avatar_url    TEXT,
    role          role_enum NOT NULL DEFAULT 'STUDENT',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── student ─────────────────────────────────────────────────
CREATE TABLE student (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL UNIQUE REFERENCES profile(id) ON DELETE CASCADE,
    student_code        TEXT,
    nationality         TEXT,
    country             TEXT,
    city                TEXT,
    address             TEXT,
    zip_code            TEXT,
    guardian_email      TEXT,
    guardian_phone      TEXT,
    passport_file_url   TEXT,
    created_by_agent_id UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── education ───────────────────────────────────────────────
CREATE TABLE education (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id       UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    qualification    TEXT,
    institution_name TEXT,
    cumulative_gpa   TEXT,
    honors           TEXT,
    start_date       DATE,
    end_date         DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── work_experience ─────────────────────────────────────────
CREATE TABLE work_experience (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id           UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title                TEXT,
    organization_name    TEXT,
    industry_sector      TEXT,
    country              TEXT,
    start_date           DATE,
    end_date             DATE,
    key_responsibilities TEXT,
    timeline_gap_years   NUMERIC,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── agent ───────────────────────────────────────────────────
CREATE TABLE agent (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id           UUID NOT NULL UNIQUE REFERENCES profile(id) ON DELETE CASCADE,
    contact_person_name  TEXT,
    nationality          TEXT,
    country              TEXT,
    city                 TEXT,
    address              TEXT,
    other_contact_number TEXT,
    website              TEXT,
    experience_years     NUMERIC,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student
    ADD CONSTRAINT fk_student_agent
    FOREIGN KEY (created_by_agent_id) REFERENCES agent(id) ON DELETE SET NULL;

-- ─── university ──────────────────────────────────────────────
CREATE TABLE university (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID NOT NULL UNIQUE REFERENCES profile(id) ON DELETE CASCADE,
    website     TEXT,
    country     TEXT,
    city        TEXT,
    address     TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── campus ──────────────────────────────────────────────────
CREATE TABLE campus (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id        UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    name              TEXT,
    established_year  INTEGER,
    short_description TEXT,
    total_area        TEXT,
    location          TEXT,
    campus_type       TEXT,
    faculties         TEXT,
    departments       TEXT,
    cover_image       TEXT,
    department_image  TEXT,
    status            campus_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── program ─────────────────────────────────────────────────
CREATE TABLE program (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id                 UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    name                       TEXT,
    category                   TEXT,
    location                   TEXT,
    program_length             TEXT,
    program_detail             TEXT,
    admission_requirements     TEXT,
    perspectives               TEXT,
    prospects_after_graduation TEXT,
    competency_model           TEXT,
    professional_skills        TEXT,
    management_skills          TEXT,
    status                     program_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── campus_program_junction ─────────────────────────────────
CREATE TABLE campus_program_junction (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id            UUID NOT NULL REFERENCES campus(id) ON DELETE CASCADE,
    program_id           UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
    tuition_fee          NUMERIC,
    agent_commission     NUMERIC,
    currency             TEXT NOT NULL DEFAULT 'USD',
    total_seats          INTEGER,
    intake_date          DATE,
    study_type           TEXT,
    application_deadline DATE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── document ────────────────────────────────────────────────
CREATE TABLE document (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id             UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    uploaded_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    url                    TEXT,
    name                   TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── document_review ─────────────────────────────────────────
CREATE TABLE document_review (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id            UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    reviewed_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    status                 doc_status_enum NOT NULL DEFAULT 'NEEDS_REVISION',
    feedback               TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── application ─────────────────────────────────────────────
CREATE TABLE application (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id           UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    program_id              UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
    profile_id              UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    submitted_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    application_no          TEXT UNIQUE,
    status                  app_status_enum NOT NULL DEFAULT 'PENDING',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── application_document ────────────────────────────────────
CREATE TABLE application_document (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    document_id    UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── application_review ──────────────────────────────────────
CREATE TABLE application_review (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id         UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    reviewed_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    feedback               TEXT,
    status                 app_status_enum NOT NULL DEFAULT 'PENDING',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── offer_letter ────────────────────────────────────────────
CREATE TABLE offer_letter (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id       UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    issued_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    file_url             TEXT,
    status               offer_status_enum NOT NULL DEFAULT 'PENDING',
    accepted_at          TIMESTAMPTZ,
    rejected_at          TIMESTAMPTZ,
    feedback             TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── payment ─────────────────────────────────────────────────
CREATE TABLE payment (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id             UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    paid_by_profile_id         UUID REFERENCES profile(id) ON DELETE SET NULL,
    amount                     NUMERIC,
    currency                   TEXT NOT NULL DEFAULT 'USD',
    provider                   TEXT,
    provider_payment_intent_id TEXT,
    provider_account_id        TEXT,
    status                     payment_status_enum NOT NULL DEFAULT 'PENDING',
    paid_at                    TIMESTAMPTZ,
    proof_url                  TEXT,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── conversation ────────────────────────────────────────────
CREATE TABLE conversation (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES application(id) ON DELETE SET NULL,
    student_id     UUID REFERENCES profile(id) ON DELETE SET NULL,
    agent_id       UUID REFERENCES profile(id) ON DELETE SET NULL,
    university_id  UUID REFERENCES profile(id) ON DELETE SET NULL,
    subject        TEXT,
    status         conv_status_enum NOT NULL DEFAULT 'OPEN',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── message ─────────────────────────────────────────────────
CREATE TABLE message (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    body              TEXT,
    attachment_url    TEXT,
    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profile','student','education','work_experience','agent','university',
    'campus','program','campus_program_junction','document','document_review',
    'application','application_document','application_review','offer_letter',
    'conversation','message'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ─── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- first_name/last_name/title are added in later migrations; keep this aligned with the profile columns created here.
  INSERT INTO profile (id, name, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE profile                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE student                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE education               ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE university              ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE program                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_program_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE document                ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review         ENABLE ROW LEVEL SECURITY;
ALTER TABLE application             ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_document    ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_review      ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letter            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation            ENABLE ROW LEVEL SECURITY;
ALTER TABLE message                 ENABLE ROW LEVEL SECURITY;

-- profile
CREATE POLICY "profile_select_own" ON profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_insert_own" ON profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update_own" ON profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_service"    ON profile FOR ALL   USING (auth.role() = 'service_role');

-- student
CREATE POLICY "student_select_own" ON student FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "student_insert_own" ON student FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "student_update_own" ON student FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "student_delete_own" ON student FOR DELETE USING (profile_id = auth.uid());
CREATE POLICY "student_service"    ON student FOR ALL USING (auth.role() = 'service_role');

-- education
CREATE POLICY "education_own"     ON education FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "education_service" ON education FOR ALL USING (auth.role() = 'service_role');

-- work_experience
CREATE POLICY "work_exp_own"     ON work_experience FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "work_exp_service" ON work_experience FOR ALL USING (auth.role() = 'service_role');

-- agent
CREATE POLICY "agent_own"     ON agent FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "agent_service" ON agent FOR ALL USING (auth.role() = 'service_role');

-- university
CREATE POLICY "university_own"     ON university FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "university_service" ON university FOR ALL USING (auth.role() = 'service_role');

-- campus
CREATE POLICY "campus_read"    ON campus FOR SELECT USING (true);
CREATE POLICY "campus_write"   ON campus FOR ALL   USING (profile_id = auth.uid());
CREATE POLICY "campus_service" ON campus FOR ALL   USING (auth.role() = 'service_role');

-- program
CREATE POLICY "program_read"    ON program FOR SELECT USING (true);
CREATE POLICY "program_write"   ON program FOR ALL   USING (profile_id = auth.uid());
CREATE POLICY "program_service" ON program FOR ALL   USING (auth.role() = 'service_role');

-- campus_program_junction
CREATE POLICY "cpj_read"    ON campus_program_junction FOR SELECT USING (true);
CREATE POLICY "cpj_service" ON campus_program_junction FOR ALL   USING (auth.role() = 'service_role');

-- document
CREATE POLICY "doc_own"     ON document FOR ALL USING (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid());
CREATE POLICY "doc_service" ON document FOR ALL USING (auth.role() = 'service_role');

-- document_review
CREATE POLICY "doc_review_service" ON document_review FOR ALL USING (auth.role() = 'service_role');

-- application
CREATE POLICY "app_read_own" ON application FOR SELECT
  USING (profile_id = auth.uid() OR submitted_by_profile_id = auth.uid() OR university_id = auth.uid());
CREATE POLICY "app_service"  ON application FOR ALL USING (auth.role() = 'service_role');

-- application_document
CREATE POLICY "app_doc_service" ON application_document FOR ALL USING (auth.role() = 'service_role');

-- application_review
CREATE POLICY "app_rev_service" ON application_review FOR ALL USING (auth.role() = 'service_role');

-- offer_letter
CREATE POLICY "offer_service" ON offer_letter FOR ALL USING (auth.role() = 'service_role');

-- payment
CREATE POLICY "payment_service" ON payment FOR ALL USING (auth.role() = 'service_role');

-- conversation
CREATE POLICY "conv_read_own" ON conversation FOR SELECT
  USING (student_id = auth.uid() OR agent_id = auth.uid() OR university_id = auth.uid());
CREATE POLICY "conv_service"  ON conversation FOR ALL USING (auth.role() = 'service_role');

-- message
CREATE POLICY "msg_read_own" ON message FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation c WHERE c.id = conversation_id
    AND (c.student_id = auth.uid() OR c.agent_id = auth.uid() OR c.university_id = auth.uid()))
);
CREATE POLICY "msg_insert_own" ON message FOR INSERT WITH CHECK (sender_profile_id = auth.uid());
CREATE POLICY "msg_service"    ON message FOR ALL USING (auth.role() = 'service_role');

-- ─── Seed: admin + university ─────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
    admin_uid  UUID := '00000000-0000-0000-0000-000000000001';
    uni_uid    UUID := '00000000-0000-0000-0000-000000000002';
    uni_id     UUID;
    admin_hash TEXT;
    uni_hash   TEXT;
BEGIN
    admin_hash := extensions.crypt('Admin@123', extensions.gen_salt('bf'));
    uni_hash   := extensions.crypt('University@123', extensions.gen_salt('bf'));

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES
    (
        admin_uid, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'sharjeel.qoderx@gmail.com', admin_hash, NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"FHM Administrator","role":"ADMIN"}',
        FALSE
    ),
    (
        uni_uid, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        'fhm@gmail.com', uni_hash, NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Fachhochschule des Mittelstands","role":"UNIVERSITY"}',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profile (id, name, email, phone, role)
    VALUES
        (admin_uid, 'FHM Administrator',               'sharjeel.qoderx@gmail.com', '+4930000001', 'ADMIN'),
        (uni_uid,   'Fachhochschule des Mittelstands',  'fhm@gmail.com',             '+4952195210', 'UNIVERSITY')
    ON CONFLICT (id) DO UPDATE SET
        name  = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role  = EXCLUDED.role;

    INSERT INTO university (profile_id, website, country, city, address, description)
    VALUES (
        uni_uid, 'https://www.fhm.de', 'Germany', 'Bielefeld',
        'Ravensberger Str. 10G, 33602 Bielefeld',
        'Fachhochschule des Mittelstands (FHM) – University of Applied Sciences for SMEs.'
    )
    ON CONFLICT (profile_id) DO NOTHING
    RETURNING id INTO uni_id;

    IF uni_id IS NOT NULL THEN
        INSERT INTO campus (profile_id, name, established_year, location, campus_type, status)
        VALUES (uni_uid, 'FHM Bielefeld', 1999, 'Bielefeld, Germany', 'MAIN', 'ACTIVE')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- <<< END 001_init.sql

-- >>> BEGIN 011_fix_rls_insert_checks.sql

-- Fix RLS policies for INSERT/UPSERT (WITH CHECK required)

-- student
DROP POLICY IF EXISTS "student_own" ON public.student;
CREATE POLICY "student_own"
    ON public.student
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- education
DROP POLICY IF EXISTS "education_own" ON public.education;
CREATE POLICY "education_own"
    ON public.education
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- work_experience
DROP POLICY IF EXISTS "work_exp_own" ON public.work_experience;
CREATE POLICY "work_exp_own"
    ON public.work_experience
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- <<< END 011_fix_rls_insert_checks.sql

-- >>> BEGIN 012_fix_document_rls_with_check.sql

-- document: INSERT requires WITH CHECK (otherwise "new row violates RLS")
DROP POLICY IF EXISTS "doc_own" ON public.document;
CREATE POLICY "doc_own"
    ON public.document
    FOR ALL
    USING (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid());

-- <<< END 012_fix_document_rls_with_check.sql

-- >>> BEGIN 013_agent_read_student_policies.sql

-- Allow agents to read profiles of students they created
CREATE POLICY "profile_select_agent"
ON profile FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM student s
        JOIN agent a ON a.id = s.created_by_agent_id
        WHERE s.profile_id = profile.id
        AND a.profile_id = auth.uid()
    )
);

-- Allow agents to read student rows they created
CREATE POLICY "student_select_agent"
ON student FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM agent a
        WHERE a.id = student.created_by_agent_id
        AND a.profile_id = auth.uid()
    )
);

-- Allow agents to read education of students they created
CREATE POLICY "education_select_agent"
ON education FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM student s
        JOIN agent a ON a.id = s.created_by_agent_id
        WHERE s.profile_id = education.profile_id
        AND a.profile_id = auth.uid()
    )
);

-- <<< END 013_agent_read_student_policies.sql

-- >>> BEGIN 014_multi_file_documents.sql

-- Create document_files table
CREATE TABLE document_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('FRONT', 'BACK')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Apply RLS policies (matching document table access)
CREATE POLICY "doc_files_own"
    ON public.document_files
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM document d
            WHERE d.id = document_files.document_id
            AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document d
            WHERE d.id = document_files.document_id
            AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

CREATE POLICY "doc_files_service"
    ON public.document_files
    FOR ALL
    USING (auth.role() = 'service_role');

-- Data Migration: Move existing document.url to document_files as 'FRONT'
INSERT INTO document_files (document_id, file_url, type, created_at)
SELECT id, url, 'FRONT', created_at
FROM document
WHERE url IS NOT NULL;

-- Remove old url column from document table
ALTER TABLE document DROP COLUMN url;

-- <<< END 014_multi_file_documents.sql

-- >>> BEGIN 015_auto_generate_student_code.sql

-- ============================================================
-- 015_auto_generate_student_code.sql
-- Description: Automatically generate a student code on insert.
-- Format: STU-XXXXXX (where X is a random alphanumeric character)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    -- Loop until we find a unique code
    LOOP
        new_code := 'STU-';
        FOR i IN 1..6 LOOP
            new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;

        SELECT EXISTS(SELECT 1 FROM student WHERE student_code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;

    NEW.student_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_student_code ON student;

CREATE TRIGGER trigger_generate_student_code
BEFORE INSERT OR UPDATE ON student
FOR EACH ROW
WHEN (NEW.student_code IS NULL)
EXECUTE FUNCTION generate_student_code();

-- <<< END 015_auto_generate_student_code.sql

-- >>> BEGIN 016_education_type_document_type.sql

-- ============================================================
-- 016_education_type_document_type.sql
-- Tasks:
--   1. Create education_type table + seed
--   2. Create document_type table + seed
--   3. Update education: drop qualification + cumulative_gpa,
--                        add degree_id + obtained_marks + total_marks
--   4. Update document: drop name, add document_type_id
--   5. Verify indexes + constraints
-- ============================================================


-- ─── TASK 1: education_type ──────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level_enum') THEN
        CREATE TYPE education_level_enum AS ENUM ('SCHOOL', 'COLLEGE', 'DIPLOMA', 'UNIVERSITY');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS education_type (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    level         education_level_enum NOT NULL,
    university_id UUID        REFERENCES profile(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_type_university_id ON education_type(university_id);
CREATE INDEX IF NOT EXISTS idx_education_type_level         ON education_type(level);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_education_type_updated_at'
    ) THEN
        CREATE TRIGGER trg_education_type_updated_at
            BEFORE UPDATE ON education_type
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE education_type ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "education_type_read"    ON education_type;
DROP POLICY IF EXISTS "education_type_service" ON education_type;
CREATE POLICY "education_type_read"    ON education_type FOR SELECT USING (true);
CREATE POLICY "education_type_service" ON education_type FOR ALL    USING (auth.role() = 'service_role');

-- Seed education_type (skip if already seeded)
INSERT INTO education_type (name, level, university_id)
SELECT name, level::education_level_enum, '00000000-0000-0000-0000-000000000002'
FROM (VALUES
    ('Matric',             'SCHOOL'),
    ('Intermediate',       'COLLEGE'),
    ('Diploma',            'DIPLOMA'),
    ('Associate Degree',   'UNIVERSITY'),
    ('Bachelor''s Degree', 'UNIVERSITY'),
    ('Master''s Degree',   'UNIVERSITY'),
    ('MPhil',              'UNIVERSITY'),
    ('PhD',                'UNIVERSITY')
) AS t(name, level)
WHERE NOT EXISTS (
    SELECT 1 FROM education_type WHERE education_type.name = t.name
);


-- ─── TASK 2: document_type ───────────────────────────────────

CREATE TABLE IF NOT EXISTS document_type (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    description   TEXT,
    university_id UUID        REFERENCES profile(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_type_university_id ON document_type(university_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_document_type_updated_at'
    ) THEN
        CREATE TRIGGER trg_document_type_updated_at
            BEFORE UPDATE ON document_type
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE document_type ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_type_read"    ON document_type;
DROP POLICY IF EXISTS "document_type_service" ON document_type;
CREATE POLICY "document_type_read"    ON document_type FOR SELECT USING (true);
CREATE POLICY "document_type_service" ON document_type FOR ALL    USING (auth.role() = 'service_role');

-- Seed document_type (skip if already seeded)
INSERT INTO document_type (name, description, university_id)
SELECT name, description, '00000000-0000-0000-0000-000000000002'
FROM (VALUES
    ('Degree Certificate',    'Official degree certificate issued by institution'),
    ('Transcript',            'Academic transcript with grades and courses'),
    ('Result Card',           'Examination result card'),
    ('Passport',              'Valid travel passport'),
    ('CNIC',                  'National identity card'),
    ('IELTS',                 'IELTS English proficiency test result'),
    ('Recommendation Letter', 'Letter of recommendation from institution/employer'),
    ('Personal Statement',    'Personal statement or statement of purpose')
) AS t(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM document_type WHERE document_type.name = t.name
);


-- ─── TASK 3: UPDATE education table ─────────────────────────

-- 3a. Drop obsolete columns
ALTER TABLE education DROP COLUMN IF EXISTS qualification;
ALTER TABLE education DROP COLUMN IF EXISTS cumulative_gpa;

-- 3b. Add degree_id FK
ALTER TABLE education
    ADD COLUMN IF NOT EXISTS degree_id UUID REFERENCES education_type(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_education_degree_id ON education(degree_id);

-- 3c. Add obtained_marks + total_marks (NUMERIC supports decimals)
ALTER TABLE education
    ADD COLUMN IF NOT EXISTS obtained_marks NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS total_marks    NUMERIC(8, 2);


-- ─── TASK 4: UPDATE document table ──────────────────────────

-- 4a. Drop name column
ALTER TABLE document DROP COLUMN IF EXISTS name;

-- 4b. Add document_type_id FK
ALTER TABLE document
    ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES document_type(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_document_type_id ON document(document_type_id);


-- ─── TASK 5: DROP timeline_gap_years from work_experience ────

ALTER TABLE work_experience DROP COLUMN IF EXISTS timeline_gap_years;


-- ─── TASK 6: VERIFY ─────────────────────────────────────────
-- Relations:
--   education.degree_id          → education_type(id)  ✓
--   education_type.university_id → profile(id)          ✓
--   document.document_type_id    → document_type(id)   ✓
--   document_type.university_id  → profile(id)          ✓
--
-- Indexes:
--   idx_education_type_university_id  ✓
--   idx_education_type_level          ✓
--   idx_document_type_university_id   ✓
--   idx_education_degree_id           ✓
--   idx_document_document_type_id     ✓
--
-- Removed columns:
--   education.qualification          ✓
--   education.cumulative_gpa         ✓
--   document.name                    ✓
--   work_experience.timeline_gap_years ✓

-- <<< END 016_education_type_document_type.sql

-- >>> BEGIN 017_program_document_requirements.sql

-- ============================================================
-- 017_program_document_requirements.sql
-- Creates program_document_requirements table
-- Links programs to their required document types
-- ============================================================

CREATE TABLE IF NOT EXISTS program_document_requirements (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id       UUID        NOT NULL REFERENCES program(id) ON DELETE CASCADE,
    document_type_id UUID        NOT NULL REFERENCES document_type(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_program_document_type UNIQUE (program_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_pdr_program_id       ON program_document_requirements(program_id);
CREATE INDEX IF NOT EXISTS idx_pdr_document_type_id ON program_document_requirements(document_type_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_pdr_updated_at'
    ) THEN
        CREATE TRIGGER trg_pdr_updated_at
            BEFORE UPDATE ON program_document_requirements
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE program_document_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pdr_read"    ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_service" ON program_document_requirements;

CREATE POLICY "pdr_read"    ON program_document_requirements FOR SELECT USING (true);
CREATE POLICY "pdr_service" ON program_document_requirements FOR ALL    USING (auth.role() = 'service_role');

-- <<< END 017_program_document_requirements.sql

-- >>> BEGIN 018_add_state_column.sql

-- State / province (separate from city)
ALTER TABLE student ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS state text;

-- <<< END 018_add_state_column.sql

-- >>> BEGIN 019_add_education_qualification.sql

-- Agent/student forms store free-text qualification per education row (migration 016 dropped this column).
ALTER TABLE education ADD COLUMN IF NOT EXISTS qualification TEXT;

-- <<< END 019_add_education_qualification.sql

-- >>> BEGIN 020_degree_levels_document_type.sql

-- ============================================================
-- 020_degree_levels_document_type.sql
-- Tasks:
--   1. Create degree table + RLS (read, insert, update, delete) + seed
--   2. Create degree_requirement table
--   3. Create levels table + seed
--   4. Update document_type columns + reseed
-- ============================================================


-- ─── TASK 1: degree ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS degree (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT        NOT NULL,
    credits            INTEGER,
    location           TEXT,
    language_of_study  TEXT,
    duration           TEXT,
    fees               TEXT
);

CREATE INDEX IF NOT EXISTS idx_degree_name ON degree(name);

ALTER TABLE degree ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "degree_read"   ON degree;
DROP POLICY IF EXISTS "degree_insert" ON degree;
DROP POLICY IF EXISTS "degree_update" ON degree;
DROP POLICY IF EXISTS "degree_delete" ON degree;

CREATE POLICY "degree_read"   ON degree FOR SELECT USING (true);
CREATE POLICY "degree_insert" ON degree FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "degree_update" ON degree FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "degree_delete" ON degree FOR DELETE USING (auth.role() = 'service_role');

INSERT INTO degree (name, credits, location, language_of_study, duration, fees)
SELECT name, credits, location, language_of_study, duration, fees
FROM (VALUES
    ('Master of Science (M. Sc.)',                         120, 'Berlin',  'English', '2 Years',    '18830 Euro'),
    ('Master of Business Administration (MBA)',            90,  'Berlin',  'English', '18 Months',  '16.520 EUR'),
    ('Master of Arts (MA)',                                120, 'Berlin',  'Eglish',  '2 years',    '22500 EUR'),
    ('Master of Science (M. Sc.)',                         120, 'Berlin',  'Eglish',  '3 years',    '20000 EUR'),
    ('Master of Science (M. Sc.)',                         90,  'Duren',   'Eglish',  '18 Minths',  '18830 Euro'),
    ('Master of Science (M. Sc.)',                         120, 'Duren',   'Eglish',  '2 yaers',    '18830 Euro'),
    ('Master of Science (M. Sc.)',                         120, 'Duren',   'Eglish',  '2 years',    '18830 Euro'),
    ('Master of Arts (MA)',                                120, 'Berlin',  'English', '2 Years',    '18830 Euro'),
    ('Bachelor of Engg',                                   180, 'Campus Köln (Campus Köln Freshen):', 'English', '3 years', '27.770,00 EUR'),
    ('Bachelor of Engg',                                   180, 'Campus Köln (Campus Köln Freshen):', 'English', '3 years', '27.770,00 EUR'),
    ('Bachelor of Arts (B.A.)',                            180, 'Düren',   'English', '3 years',    '28070 EURO'),
    ('Bachelor of Arts (B.A.)',                            180, 'Koln/Fresen', 'English', '3 years', '27.770,00 EUR'),
    ('Studienkolleg',                                      NULL, 'Bielefeld', 'English', '12 months', 'Offered along with Bachelors'),
    ('Studienkolleg',                                      NULL, 'Bielefeld', 'German',  '12 months', '13500.00 Euro (To be Paid Fully, No instalment)'),
    ('Bachelor of Arts (B.A.)',                            180, 'berlin',  'English', '3 years',    '27.770,00 EUR'),
    ('Bachelor of Arts (B.A.)',                            180, 'Berlin',  'Eglish',  '3 years',    '27.770,00 EUR'),
    ('Bachelor of Arts (B.A.)',                            180, 'Duren',   'Eglish',  '3 years',    '27.770,00 EUR'),
    ('Bachelor of Science',                                210, 'Waldshut', 'German', '4.5',        'To be defined by May 2026'),
    ('Bachelor of Science',                                210, 'Waldshut', 'German', '4.5',        'To be defined by May 2026'),
    ('Bachelor of Science',                                210, 'Waldshut', 'German', '4.5',        'To be defined by May 2026'),
    ('Bachelor of Science',                                210, 'Waldshut', 'German', '3 years',    'To be defined by May 2026'),
    ('Bachelor of Science',                                240, 'Waldshut', 'German', '3 years',    'To be defined by May 2026')
) AS t(name, credits, location, language_of_study, duration, fees)
WHERE NOT EXISTS (SELECT 1 FROM degree LIMIT 1);


-- ─── TASK 2: degree_requirement ──────────────────────────────

CREATE TABLE IF NOT EXISTS degree_requirement (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    degree_id        UUID        NOT NULL REFERENCES degree(id) ON DELETE CASCADE,
    document_type_id UUID        NOT NULL REFERENCES document_type(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_degree_document_type UNIQUE (degree_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_degree_requirement_degree_id        ON degree_requirement(degree_id);
CREATE INDEX IF NOT EXISTS idx_degree_requirement_document_type_id ON degree_requirement(document_type_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_degree_requirement_updated_at'
    ) THEN
        CREATE TRIGGER trg_degree_requirement_updated_at
            BEFORE UPDATE ON degree_requirement
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE degree_requirement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "degree_requirement_read"    ON degree_requirement;
DROP POLICY IF EXISTS "degree_requirement_service" ON degree_requirement;

CREATE POLICY "degree_requirement_read"    ON degree_requirement FOR SELECT USING (true);
CREATE POLICY "degree_requirement_service" ON degree_requirement FOR ALL    USING (auth.role() = 'service_role');


-- ─── TASK 3: levels ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS levels (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    university_id UUID        REFERENCES profile(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_levels_university_id ON levels(university_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_levels_updated_at'
    ) THEN
        CREATE TRIGGER trg_levels_updated_at
            BEFORE UPDATE ON levels
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "levels_read"    ON levels;
DROP POLICY IF EXISTS "levels_service" ON levels;

CREATE POLICY "levels_read"    ON levels FOR SELECT USING (true);
CREATE POLICY "levels_service" ON levels FOR ALL    USING (auth.role() = 'service_role');

INSERT INTO levels (name, university_id)
SELECT name, '00000000-0000-0000-0000-000000000002'::UUID
FROM (VALUES
    ('Bachelor'),
    ('Foundation'),
    ('Master'),
    ('MBA')
) AS t(name)
WHERE NOT EXISTS (
    SELECT 1 FROM levels WHERE levels.name = t.name
);


-- ─── TASK 4: document_type update + reseed ───────────────────

ALTER TABLE document_type
    ADD COLUMN IF NOT EXISTS code       TEXT,
    ADD COLUMN IF NOT EXISTS type       TEXT,
    ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS may_expire BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_document_type_code'
    ) THEN
        ALTER TABLE document_type ADD CONSTRAINT uq_document_type_code UNIQUE (code);
    END IF;
END $$;

DELETE FROM document_type
WHERE code IS NULL
  AND name IN (
    'Degree Certificate',
    'Transcript',
    'Result Card',
    'Passport',
    'CNIC',
    'IELTS',
    'Recommendation Letter',
    'Personal Statement'
  );

INSERT INTO document_type (name, code, type, description, is_active, may_expire, university_id)
SELECT name, code, type, description, is_active, may_expire, '00000000-0000-0000-0000-000000000002'::UUID
FROM (VALUES
    ('A Valid Passport Copy',                              'PASSPORT',          'Identity',              'A valid passport showing your personal details and photo page',                              true,  true),
    ('Curriculum Vitae (CV)',                              'CV',                'Professional',          'Your latest CV with education, work experience, and skills',                                 true,  false),
    ('English Proficiency Test',                           'LANGUAGE_SCORE',    'Language Proficiency',  'Valid English language test result (IELTS, TOEFL, PTE, etc.)',                               true,  true),
    ('S.S.C Marksheet',                                    'SSC_MARKSHEET',     'Academic',              'Official marksheet of your 10th (secondary school) exams',                                   true,  false),
    ('S.S.C Passing Certificate',                          'SSC_CERTIFICATE',   'Academic',              'Certificate proving you have passed 10th grade',                                             true,  false),
    ('H.S.C / UG Diploma Marksheet/s',                     'HSC_UGD_MARKSHEET', 'Academic',              'Official marksheet of your 12th (higher secondary) exams',                                   true,  false),
    ('H.S.C / UG Diploma Passing Certificate',             'HSC_UGD_CERTIFICATE', 'Academic',            'Certificate proving you have passed 12th grade',                                             true,  false),
    ('Bachelor / Advanced Diploma All Semester Marksheets', 'BD_AD_MARKSHEET',  'Academic',              'All semester/year marksheets of your bachelor''s degree',                                    true,  false),
    ('Bachelor''s Degree / Advanced Diploma Certificate',  'BD_AD_DEGREE',      'Academic',              'Official certificate confirming your bachelor''s degree completion',                         true,  false),
    ('Bachelor''s Degree / Advanced Diploma Transcript', 'BD_AD_TRANSCRIPT',  'Academic',              'Official academic record issued by your institution (sealed or stamped)',                    true,  false),
    ('APS Certificate',                                    'APS',               'Academic Recognition',  'APS verification certificate required for certain countries (e.g. Germany)',                   true,  false),
    ('Work Experience Certificate',                        'WORK_EXP_LETTER',   'Professional',          'Letter from employer confirming your work experience',                                         true,  false)
) AS t(name, code, type, description, is_active, may_expire)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    type        = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active   = EXCLUDED.is_active,
    may_expire  = EXCLUDED.may_expire;

-- <<< END 020_degree_levels_document_type.sql

-- >>> BEGIN 021_course.sql

-- ============================================================
-- 021_course.sql
-- Creates course table linked to degree + seed (degree_id NULL)
-- ============================================================

CREATE TABLE IF NOT EXISTS course (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      TEXT NOT NULL,
    degree_id UUID REFERENCES degree(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_course_name      ON course(name);
CREATE INDEX IF NOT EXISTS idx_course_degree_id ON course(degree_id);

ALTER TABLE course ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_read"   ON course;
DROP POLICY IF EXISTS "course_insert" ON course;
DROP POLICY IF EXISTS "course_update" ON course;
DROP POLICY IF EXISTS "course_delete" ON course;

CREATE POLICY "course_read"   ON course FOR SELECT USING (true);
CREATE POLICY "course_insert" ON course FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "course_update" ON course FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "course_delete" ON course FOR DELETE USING (auth.role() = 'service_role');

INSERT INTO course (name, degree_id)
SELECT name, NULL::UUID
FROM (VALUES
    ('Master of science (M.Sc. ITTM) International Technology Transfer Management'),
    ('Master of Business Administration (MBA): General Technology Management Automotive and Mobility Management'),
    ('Master of Business Administration (MBA): General Technology Management Data Science'),
    ('Master of Business Administration (MBA): General Technology Management Environment and Energy Management'),
    ('MA International Management'),
    ('MA Sustainability and Climate Management'),
    ('Msc Digital Transformation Management'),
    ('Msc AI and Data Science Management'),
    ('Msc Finance and Fintech'),
    ('Master of Arts (M.A.) Global SMEs'),
    ('B.Eng. Management & Technology Mechanical Engineering'),
    ('B.Eng. Management & Technology Energy and Environment Engineering'),
    ('B.A. Digital Business Management'),
    ('B.A. Marketing Management'),
    ('Pre-Studies Program (PSP) – English T-course for technical studies, W-course for business studies'),
    ('Pre-Studies Program (PSP) – German Taught T-course for technical studies, W-course for business studies'),
    ('BA International Business Administration'),
    ('BA Sports Management'),
    ('BA Artificial intelligence'),
    ('Uniperp + Bsc Physiotherapy'),
    ('Uniperp + Bsc Occupational Therapy'),
    ('Uniperp + BSc Care and Management'),
    ('Uniperp + BSc Care and Management'),
    ('Uniperp + Bsc Physician Asssitant')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM course LIMIT 1);

-- <<< END 021_course.sql

-- >>> BEGIN 022_agent_kyc_document_types.sql

-- Agent onboarding KYC document types (replaces removed CNIC type)
INSERT INTO document_type (name, code, type, description, is_active, may_expire, university_id)
SELECT name, code, type, description, is_active, may_expire, '00000000-0000-0000-0000-000000000002'::UUID
FROM (VALUES
    ('Agent Registration Certificate', 'AGENT_REGISTRATION', 'Identity', 'Agent agency registration certificate', true, false),
    ('Agent ID Card Front',          'AGENT_ID_FRONT',     'Identity', 'Agent ID card front side',          true, false),
    ('Agent ID Card Back',           'AGENT_ID_BACK',      'Identity', 'Agent ID card back side',           true, false)
) AS t(name, code, type, description, is_active, may_expire)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    type        = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active   = EXCLUDED.is_active,
    may_expire  = EXCLUDED.may_expire;

-- <<< END 022_agent_kyc_document_types.sql

-- >>> BEGIN 023_drop_agent_id_columns.sql

-- Remove redundant ID card URL columns from agent (KYC files live in document/document_files)
ALTER TABLE agent DROP COLUMN IF EXISTS id_front;
ALTER TABLE agent DROP COLUMN IF EXISTS id_back;

-- <<< END 023_drop_agent_id_columns.sql

-- >>> BEGIN 024_document_type_levels.sql

-- ============================================================
-- 024_document_type_levels.sql
-- Links document_type to levels (many-to-many) + seed
-- ============================================================

CREATE TABLE IF NOT EXISTS document_type_level (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id UUID        NOT NULL REFERENCES document_type(id) ON DELETE CASCADE,
    level_id         UUID        NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_document_type_level UNIQUE (document_type_id, level_id)
);

CREATE INDEX IF NOT EXISTS idx_document_type_level_document_type_id ON document_type_level(document_type_id);
CREATE INDEX IF NOT EXISTS idx_document_type_level_level_id         ON document_type_level(level_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_document_type_level_updated_at'
    ) THEN
        CREATE TRIGGER trg_document_type_level_updated_at
            BEFORE UPDATE ON document_type_level
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE document_type_level ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_type_level_read"    ON document_type_level;
DROP POLICY IF EXISTS "document_type_level_service" ON document_type_level;

CREATE POLICY "document_type_level_read"    ON document_type_level FOR SELECT USING (true);
CREATE POLICY "document_type_level_service" ON document_type_level FOR ALL    USING (auth.role() = 'service_role');

-- Seed: document code → allowed level names
WITH mapping AS (
    SELECT * FROM (VALUES
        ('PASSPORT',          ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('CV',                ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('LANGUAGE_SCORE',    ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('SSC_MARKSHEET',     ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('SSC_CERTIFICATE',   ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('HSC_UGD_MARKSHEET', ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('HSC_UGD_CERTIFICATE', ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('BD_AD_MARKSHEET',   ARRAY['Master', 'MBA']),
        ('BD_AD_DEGREE',      ARRAY['Master', 'MBA']),
        ('BD_AD_TRANSCRIPT',  ARRAY['Master', 'MBA']),
        ('APS',               ARRAY['Bachelor', 'Foundation', 'Master', 'MBA']),
        ('WORK_EXP_LETTER',   ARRAY['MBA'])
    ) AS t(doc_code, level_names)
),
expanded AS (
    SELECT m.doc_code, level_name
    FROM mapping m
    CROSS JOIN LATERAL unnest(m.level_names) AS level_name
)
INSERT INTO document_type_level (document_type_id, level_id)
SELECT dt.id, l.id
FROM expanded e
JOIN document_type dt ON dt.code = e.doc_code
JOIN levels l ON l.name = e.level_name
ON CONFLICT (document_type_id, level_id) DO NOTHING;

-- <<< END 024_document_type_levels.sql

-- >>> BEGIN 026_course_degree_requirements_seed.sql

-- ============================================================
-- 026_course_degree_requirements_seed.sql
-- 1. Link course → exact degree row (name + credits + location + language + duration)
-- 2. Seed degree_requirement (degree_id + document_type_id)
-- ============================================================

-- ─── Resolve degree rows by business key ─────────────────────

CREATE TEMP TABLE tmp_degree_key ON COMMIT DROP AS
SELECT DISTINCT ON (t.degree_key)
    t.degree_key,
    d.id AS degree_id
FROM (VALUES
    ('msc_berlin_en_2y',       'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%English%', '%2%Year%'),
    ('mba_berlin',             'Master of Business Administration (MBA)',            90,  '%Berlin%',  '%English%', '%18%Month%'),
    ('ma_berlin_eglish_2y',    'Master of Arts (MA)',                                120, '%Berlin%',  '%Eglish%',  '%2%year%'),
    ('ma_berlin_en_2y',        'Master of Arts (MA)',                                120, '%Berlin%',  '%English%', '%2%Year%'),
    ('msc_berlin_eglish_3y',   'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%Eglish%',  '%3%year%'),
    ('msc_duren_90_18m',       'Master of Science (M. Sc.)',                         90,  '%Duren%',   '%Eglish%',  '%18%Minth%'),
    ('msc_duren_120_2y_typo',  'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%yaer%'),
    ('msc_duren_120_2y',       'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%year%'),
    ('beng_koln',              'Bachelor of Engg',                                   180, '%Köln%',    '%English%', '%3%year%'),
    ('ba_duren',               'Bachelor of Arts (B.A.)',                            180, '%Düren%',   '%English%', '%3%year%'),
    ('ba_koln',                'Bachelor of Arts (B.A.)',                            180, '%Koln%',    '%English%', '%3%year%'),
    ('studienkolleg_en',       'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%English%', '%12%month%'),
    ('studienkolleg_de',       'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%German%',  '%12%month%'),
    ('ba_berlin_en',           'Bachelor of Arts (B.A.)',                            180, '%berlin%',  '%English%', '%3%year%'),
    ('ba_berlin_eglish',       'Bachelor of Arts (B.A.)',                            180, '%Berlin%',  '%Eglish%',  '%3%year%'),
    ('ba_duren_eglish',        'Bachelor of Arts (B.A.)',                            180, '%Duren%',   '%Eglish%',  '%3%year%'),
    ('bsc_waldshut_210_45',    'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%4.5%'),
    ('bsc_waldshut_210_3y',    'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%3%year%'),
    ('bsc_waldshut_240_3y',    'Bachelor of Science',                                240, '%Waldshut%','%German%',  '%3%year%')
) AS t(degree_key, deg_name, credits, location_like, language_like, duration_like)
JOIN degree d
    ON d.name = t.deg_name
   AND d.credits IS NOT DISTINCT FROM t.credits
   AND d.location ILIKE t.location_like
   AND d.language_of_study ILIKE t.language_like
   AND d.duration ILIKE t.duration_like
ORDER BY t.degree_key, d.id;


-- ─── 1. Update course.degree_id ──────────────────────────────

UPDATE course c
SET degree_id = dk.degree_id
FROM (VALUES
    ('Master of science (M.Sc. ITTM) International Technology Transfer Management', 'msc_berlin_en_2y', 0),
    ('Master of Business Administration (MBA): General Technology Management Automotive and Mobility Management', 'mba_berlin', 0),
    ('Master of Business Administration (MBA): General Technology Management Data Science', 'mba_berlin', 0),
    ('Master of Business Administration (MBA): General Technology Management Environment and Energy Management', 'mba_berlin', 0),
    ('MA International Management', 'ma_berlin_eglish_2y', 0),
    ('MA Sustainability and Climate Management', 'msc_berlin_eglish_3y', 0),
    ('Msc Digital Transformation Management', 'msc_duren_90_18m', 0),
    ('Msc AI and Data Science Management', 'msc_duren_120_2y_typo', 0),
    ('Msc Finance and Fintech', 'msc_duren_120_2y', 0),
    ('Master of Arts (M.A.) Global SMEs', 'ma_berlin_en_2y', 0),
    ('B.Eng. Management & Technology Mechanical Engineering', 'beng_koln', 0),
    ('B.Eng. Management & Technology Energy and Environment Engineering', 'beng_koln', 0),
    ('B.A. Digital Business Management', 'ba_duren', 0),
    ('B.A. Marketing Management', 'ba_koln', 0),
    ('Pre-Studies Program (PSP) – English T-course for technical studies, W-course for business studies', 'studienkolleg_en', 0),
    ('Pre-Studies Program (PSP) – German Taught T-course for technical studies, W-course for business studies', 'studienkolleg_de', 0),
    ('BA International Business Administration', 'ba_berlin_en', 0),
    ('BA Sports Management', 'ba_berlin_eglish', 0),
    ('BA Artificial intelligence', 'ba_duren_eglish', 0),
    ('Uniperp + Bsc Physiotherapy', 'bsc_waldshut_210_45', 0),
    ('Uniperp + Bsc Occupational Therapy', 'bsc_waldshut_210_45', 0),
    ('Uniperp + BSc Care and Management', 'bsc_waldshut_210_45', 0),
    ('Uniperp + BSc Care and Management', 'bsc_waldshut_210_3y', 1),
    ('Uniperp + Bsc Physician Asssitant', 'bsc_waldshut_240_3y', 0)
) AS m(course_name, degree_key, name_offset)
JOIN tmp_degree_key dk ON dk.degree_key = m.degree_key
WHERE c.id = (
    SELECT id
    FROM course
    WHERE name = m.course_name
    ORDER BY id
    LIMIT 1 OFFSET m.name_offset
);


-- ─── 2. Seed degree_requirement ──────────────────────────────

CREATE TEMP TABLE tmp_req_set ON COMMIT DROP AS
SELECT * FROM (VALUES
    ('master_std',       ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('mba',              ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE','WORK_EXP_LETTER']::TEXT[]),
    ('bachelor_std',     ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('studienkolleg_en', ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('studienkolleg_de', ARRAY['CV','BD_AD_DEGREE','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('uniperp_std',      ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('uniperp_nursing',  ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE','BD_AD_DEGREE','WORK_EXP_LETTER']::TEXT[])
) AS t(set_name, doc_codes);

CREATE TEMP TABLE tmp_degree_req_map ON COMMIT DROP AS
SELECT * FROM (VALUES
    ('msc_berlin_en_2y',      'master_std'),
    ('mba_berlin',            'mba'),
    ('ma_berlin_eglish_2y',   'master_std'),
    ('ma_berlin_en_2y',       'master_std'),
    ('msc_berlin_eglish_3y',  'master_std'),
    ('msc_duren_90_18m',      'master_std'),
    ('msc_duren_120_2y_typo', 'master_std'),
    ('msc_duren_120_2y',      'master_std'),
    ('beng_koln',             'bachelor_std'),
    ('ba_duren',              'bachelor_std'),
    ('ba_koln',               'bachelor_std'),
    ('studienkolleg_en',      'studienkolleg_en'),
    ('studienkolleg_de',      'studienkolleg_de'),
    ('ba_berlin_en',          'bachelor_std'),
    ('ba_berlin_eglish',      'bachelor_std'),
    ('ba_duren_eglish',       'bachelor_std'),
    ('bsc_waldshut_210_45',   'uniperp_std'),
    ('bsc_waldshut_210_3y',   'uniperp_nursing'),
    ('bsc_waldshut_240_3y',   'uniperp_nursing')
) AS t(degree_key, req_set);

INSERT INTO degree_requirement (degree_id, document_type_id)
SELECT DISTINCT dk.degree_id, dt.id
FROM tmp_degree_req_map drm
JOIN tmp_degree_key dk ON dk.degree_key = drm.degree_key
JOIN tmp_req_set rs ON rs.set_name = drm.req_set
CROSS JOIN LATERAL unnest(rs.doc_codes) AS doc_code(code)
JOIN document_type dt ON dt.code = doc_code.code
ON CONFLICT (degree_id, document_type_id) DO NOTHING;

-- <<< END 026_course_degree_requirements_seed.sql

-- >>> BEGIN 027_add_degree_study_mode_intake.sql

-- Add study_mode (full_time / part_time) and intake_date to degree

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_mode_enum') THEN
        CREATE TYPE study_mode_enum AS ENUM ('full_time', 'part_time');
    END IF;
END $$;

ALTER TABLE degree
    ADD COLUMN IF NOT EXISTS study_mode  study_mode_enum,
    ADD COLUMN IF NOT EXISTS intake_date DATE;

CREATE INDEX IF NOT EXISTS idx_degree_study_mode  ON degree(study_mode);
CREATE INDEX IF NOT EXISTS idx_degree_intake_date ON degree(intake_date);

-- <<< END 027_add_degree_study_mode_intake.sql

-- >>> BEGIN 028_add_course_deadline_date.sql

-- Add application deadline date to course

ALTER TABLE course
    ADD COLUMN IF NOT EXISTS deadline_date DATE;

CREATE INDEX IF NOT EXISTS idx_course_deadline_date ON course(deadline_date);

-- <<< END 028_add_course_deadline_date.sql

-- >>> BEGIN 029_add_degree_level_id.sql

-- Link degree to academic level (Bachelor, Foundation, Master, MBA)

ALTER TABLE degree
    ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_degree_level_id ON degree(level_id);

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'MBA'
  AND d.name ILIKE '%Master of Business Administration%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND d.level_id IS NULL
  AND d.name ILIKE '%Master%'
  AND d.name NOT ILIKE '%Business Administration%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Foundation'
  AND d.name ILIKE '%Studienkolleg%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Bachelor'
  AND d.level_id IS NULL
  AND (
      d.name ILIKE '%Bachelor%'
      OR d.name ILIKE '%B.Eng%'
      OR d.name ILIKE '%B.A%'
  );

-- <<< END 029_add_degree_level_id.sql

-- >>> BEGIN 030_add_education_gpa_grade_type.sql

-- Add GPA and grade type (percentage | gpa) to education

ALTER TABLE education
    ADD COLUMN IF NOT EXISTS gpa NUMERIC(4, 2),
    ADD COLUMN IF NOT EXISTS grade_type TEXT;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'education_grade_type_check'
    ) THEN
        ALTER TABLE education
            ADD CONSTRAINT education_grade_type_check
            CHECK (grade_type IS NULL OR grade_type IN ('percentage', 'gpa'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_education_grade_type ON education(grade_type);

-- <<< END 030_add_education_gpa_grade_type.sql

-- >>> BEGIN 031_application_course_id.sql

-- Replace application.program_id with application.course_id

ALTER TABLE application
    DROP CONSTRAINT IF EXISTS application_program_id_fkey;

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course(id) ON DELETE CASCADE;

-- Legacy rows cannot be mapped from program to course automatically.
DELETE FROM application
WHERE course_id IS NULL;

ALTER TABLE application
    DROP COLUMN IF EXISTS program_id;

ALTER TABLE application
    ALTER COLUMN course_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_course_id ON application(course_id);

-- Allow authenticated users to create applications for permitted profiles
DROP POLICY IF EXISTS "app_insert_own" ON application;
CREATE POLICY "app_insert_own" ON application
    FOR INSERT
    WITH CHECK (
        submitted_by_profile_id = auth.uid()
        OR profile_id = auth.uid()
    );

-- <<< END 031_application_course_id.sql

-- >>> BEGIN 032_public_offer_policies.sql

-- ============================================================
-- Add RLS policies for public offer endpoints
-- ============================================================

-- Offer letter: allow public read and update
DROP POLICY IF EXISTS "offer_service" ON offer_letter;
DROP POLICY IF EXISTS "offer_public_read" ON offer_letter;
DROP POLICY IF EXISTS "offer_public_update" ON offer_letter;
CREATE POLICY "offer_public_read" ON offer_letter FOR SELECT USING (true);
CREATE POLICY "offer_public_update" ON offer_letter FOR UPDATE USING (true);
CREATE POLICY "offer_service" ON offer_letter FOR ALL USING (auth.role() = 'service_role');

-- Application: allow public read
DROP POLICY IF EXISTS "app_service" ON application;
DROP POLICY IF EXISTS "application_public_read" ON application;
CREATE POLICY "application_public_read" ON application FOR SELECT USING (true);
CREATE POLICY "app_service" ON application FOR ALL USING (auth.role() = 'service_role');

-- Profile: allow public read and update for signature
DROP POLICY IF EXISTS "profile_select_own" ON profile;
DROP POLICY IF EXISTS "profile_update_own" ON profile;
DROP POLICY IF EXISTS "profile_public_read" ON profile;
DROP POLICY IF EXISTS "profile_public_update" ON profile;
DROP POLICY IF EXISTS "profile_service" ON profile;
CREATE POLICY "profile_public_read" ON profile FOR SELECT USING (true);
CREATE POLICY "profile_public_update" ON profile FOR UPDATE USING (true);
CREATE POLICY "profile_service" ON profile FOR ALL USING (auth.role() = 'service_role');

-- Student: allow public read
DROP POLICY IF EXISTS "student_service" ON student;
DROP POLICY IF EXISTS "student_public_read" ON student;
CREATE POLICY "student_public_read" ON student FOR SELECT USING (true);
CREATE POLICY "student_service" ON student FOR ALL USING (auth.role() = 'service_role');

-- University: allow public read
DROP POLICY IF EXISTS "university_own" ON university;
DROP POLICY IF EXISTS "university_service" ON university;
DROP POLICY IF EXISTS "university_public_read" ON university;
CREATE POLICY "university_public_read" ON university FOR SELECT USING (true);
CREATE POLICY "university_service" ON university FOR ALL USING (auth.role() = 'service_role');

-- Course: allow public read
DROP POLICY IF EXISTS "course_read" ON course;
DROP POLICY IF EXISTS "course_public_read" ON course;
DROP POLICY IF EXISTS "course_service" ON course;
CREATE POLICY "course_public_read" ON course FOR SELECT USING (true);
CREATE POLICY "course_service" ON course FOR ALL USING (auth.role() = 'service_role');

-- Degree: allow public read
DROP POLICY IF EXISTS "degree_read" ON degree;
DROP POLICY IF EXISTS "degree_public_read" ON degree;
DROP POLICY IF EXISTS "degree_service" ON degree;
CREATE POLICY "degree_public_read" ON degree FOR SELECT USING (true);
CREATE POLICY "degree_service" ON degree FOR ALL USING (auth.role() = 'service_role');

-- Application review: allow public read if needed
DROP POLICY IF EXISTS "app_rev_service" ON application_review;
DROP POLICY IF EXISTS "application_review_public_read" ON application_review;
CREATE POLICY "application_review_public_read" ON application_review FOR SELECT USING (true);
CREATE POLICY "app_rev_service" ON application_review FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Storage bucket policies
-- ============================================================

-- Allow public uploads and reads for signatures in student-admission bucket
-- Note: Storage policies are managed differently, go to Supabase Dashboard → Storage → student-admission → Policies
-- And add these policies if not already present:

-- Policy 1: Allow public reads
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'student-admission' );

-- Policy 2: Allow public inserts/updates for signatures path
-- CREATE POLICY "Allow public uploads to signatures folder" ON storage.objects
--   FOR INSERT
--   WITH CHECK ( bucket_id = 'student-admission' AND (storage.foldername(name))[1] = 'signatures' );

-- <<< END 032_public_offer_policies.sql

-- >>> BEGIN 033_add_title_to_profile.sql

-- Add title column to profile table (Mr/Mrs)
ALTER TABLE profile
ADD COLUMN IF NOT EXISTS title TEXT;

-- <<< END 033_add_title_to_profile.sql

-- >>> BEGIN 034_update_handle_new_user_title.sql

-- Update handle_new_user to include title
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profile (id, name, first_name, last_name, title, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'title',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- <<< END 034_update_handle_new_user_title.sql

-- >>> BEGIN 035_document_updated_at_resume.sql

-- 035_document_updated_at_resume.sql
-- 1. Ensure updated_at trigger exists on document table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_document_updated_at'
    ) THEN
        CREATE TRIGGER trg_document_updated_at
            BEFORE UPDATE ON document
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- 2. Seed Resume document type (if not exists)
INSERT INTO document_type (name, code, type, description, is_active, may_expire, university_id)
SELECT 'Resume', 'RESUME', 'Professional', 'Your latest resume summarizing education and experience', true, false, '00000000-0000-0000-0000-000000000002'::UUID
WHERE NOT EXISTS (SELECT 1 FROM document_type WHERE code = 'RESUME');

-- <<< END 035_document_updated_at_resume.sql

-- >>> BEGIN 036_document_note.sql

-- 036_document_note.sql
-- Add nullable note column to document table
ALTER TABLE document ADD COLUMN IF NOT EXISTS note TEXT NULL;

-- <<< END 036_document_note.sql

-- >>> BEGIN 037_agent_contact_person_first_last_name.sql

-- Split agent.contact_person_name into first_name and last_name

ALTER TABLE agent
ADD COLUMN IF NOT EXISTS contact_person_first_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_last_name TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'agent'
          AND column_name = 'contact_person_name'
    ) THEN
        UPDATE agent
        SET
            contact_person_first_name = COALESCE(
                NULLIF(contact_person_first_name, ''),
                split_part(contact_person_name, ' ', 1)
            ),
            contact_person_last_name = COALESCE(
                NULLIF(contact_person_last_name, ''),
                CASE
                    WHEN position(' ' in contact_person_name) > 0
                    THEN substring(contact_person_name from position(' ' in contact_person_name) + 1)
                    ELSE ''
                END
            )
        WHERE contact_person_name IS NOT NULL;

        ALTER TABLE agent DROP COLUMN contact_person_name;
    END IF;
END $$;

-- <<< END 037_agent_contact_person_first_last_name.sql

-- >>> BEGIN 038_add_first_last_name_to_profile.sql

-- Add first_name and last_name columns to profile table (renamed from duplicate 029)
ALTER TABLE profile
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Populate first_name and last_name from existing name column when empty
UPDATE profile
SET
    first_name = split_part(name, ' ', 1),
    last_name = CASE WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1) ELSE '' END
WHERE first_name IS NULL OR first_name = '';

-- <<< END 038_add_first_last_name_to_profile.sql

-- >>> BEGIN 039_drop_profile_name_use_first_last.sql

-- Backfill first_name / last_name from legacy name column, then drop name

ALTER TABLE profile
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE profile
SET
    first_name = COALESCE(
        NULLIF(first_name, ''),
        split_part(name, ' ', 1)
    ),
    last_name = COALESCE(
        NULLIF(last_name, ''),
        CASE
            WHEN position(' ' in name) > 0
            THEN substring(name from position(' ' in name) + 1)
            ELSE ''
        END
    )
WHERE name IS NOT NULL;

ALTER TABLE profile DROP COLUMN IF EXISTS name;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profile (id, first_name, last_name, title, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'title',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- <<< END 039_drop_profile_name_use_first_last.sql

-- >>> BEGIN 040_education_type_level_id.sql

-- Link education_type (academic background) to levels for course eligibility filtering

ALTER TABLE education_type
    ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_education_type_level_id ON education_type(level_id);

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Bachelor'
  AND et.name = 'Bachelor''s Degree'
  AND et.level_id IS NULL;

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND et.name IN ('Master''s Degree', 'MPhil')
  AND et.level_id IS NULL;

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND et.name = 'PhD'
  AND et.level_id IS NULL;

-- <<< END 040_education_type_level_id.sql

-- >>> BEGIN 041_degree_intake_season_enum.sql

-- Convert degree.intake_date from DATE to summer / winter enum

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intake_season_enum') THEN
        CREATE TYPE intake_season_enum AS ENUM ('summer', 'winter');
    END IF;
END $$;

DROP INDEX IF EXISTS idx_degree_intake_date;

ALTER TABLE degree
    ALTER COLUMN intake_date DROP DEFAULT;

ALTER TABLE degree
    ALTER COLUMN intake_date TYPE TEXT
    USING intake_date::TEXT;

ALTER TABLE degree
    ALTER COLUMN intake_date TYPE intake_season_enum
    USING (
        CASE
            WHEN intake_date IS NULL THEN NULL
            WHEN intake_date IN ('summer', 'winter') THEN intake_date::intake_season_enum
            WHEN intake_date ~ '^\d{4}-\d{2}-\d{2}' THEN
                CASE
                    WHEN EXTRACT(MONTH FROM intake_date::DATE) BETWEEN 4 AND 9
                        THEN 'summer'::intake_season_enum
                    ELSE 'winter'::intake_season_enum
                END
            ELSE NULL
        END
    );

CREATE INDEX IF NOT EXISTS idx_degree_intake_date ON degree(intake_date);

-- <<< END 041_degree_intake_season_enum.sql

-- >>> BEGIN 042_student_aps_requirement.sql

-- APS certificate required for students from Pakistan, Vietnam, India, and China.
ALTER TABLE student
    ADD COLUMN IF NOT EXISTS aps_requirement BOOLEAN NOT NULL DEFAULT false;

UPDATE student
SET aps_requirement = true
WHERE country IS NOT NULL
  AND lower(trim(country)) IN ('pakistan', 'vietnam', 'india', 'china');

-- <<< END 042_student_aps_requirement.sql

-- >>> BEGIN 043_document_template.sql

-- ─── document_template ───────────────────────────────────────
CREATE TABLE document_template (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   TEXT NOT NULL,
    body_html               TEXT NOT NULL DEFAULT '',
    variables               JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by_profile_id   UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_template_created_by_idx ON document_template(created_by_profile_id);
CREATE INDEX document_template_is_deleted_idx ON document_template(is_deleted);

ALTER TABLE document_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_template_select_auth"
    ON document_template FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "document_template_insert_auth"
    ON document_template FOR INSERT
    WITH CHECK (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_update_auth"
    ON document_template FOR UPDATE
    USING (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_delete_auth"
    ON document_template FOR DELETE
    USING (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_service"
    ON document_template FOR ALL
    USING (auth.role() = 'service_role');

-- <<< END 043_document_template.sql

-- >>> BEGIN 044_offer_letter_template.sql

-- Link offer letters to document templates and store rendered HTML
ALTER TABLE offer_letter
    ADD COLUMN IF NOT EXISTS document_template_id UUID REFERENCES document_template(id),
    ADD COLUMN IF NOT EXISTS body_html TEXT;

CREATE INDEX IF NOT EXISTS offer_letter_document_template_id_idx
    ON offer_letter(document_template_id);

-- <<< END 044_offer_letter_template.sql

-- >>> BEGIN 045_offer_insert_policy.sql

-- Allow authenticated university/agent profiles to create offer letters
-- for applications they are allowed to manage (no service role required in API).

DROP POLICY IF EXISTS "offer_insert_university_agent" ON offer_letter;

CREATE POLICY "offer_insert_university_agent"
    ON offer_letter
    FOR INSERT
    TO authenticated
    WITH CHECK (
        issued_by_profile_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM application a
            INNER JOIN profile p ON p.id = auth.uid()
            WHERE a.id = application_id
              AND (
                  (p.role = 'UNIVERSITY' AND a.university_id = auth.uid())
                  OR (p.role = 'AGENT' AND a.submitted_by_profile_id = auth.uid())
                  OR p.role = 'ADMIN'
              )
        )
    );

-- <<< END 045_offer_insert_policy.sql

-- >>> BEGIN 046_offer_insert_agent_students.sql

-- Allow agents to create offers for applications submitted by their linked students
DROP POLICY IF EXISTS "offer_insert_university_agent" ON offer_letter;

CREATE POLICY "offer_insert_university_agent"
    ON offer_letter
    FOR INSERT
    TO authenticated
    WITH CHECK (
        issued_by_profile_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM application a
            INNER JOIN profile p ON p.id = auth.uid()
            WHERE a.id = application_id
              AND (
                  (p.role = 'UNIVERSITY' AND a.university_id = auth.uid())
                  OR (p.role = 'AGENT' AND a.submitted_by_profile_id = auth.uid())
                  OR (
                      p.role = 'AGENT'
                      AND EXISTS (
                          SELECT 1
                          FROM student s
                          INNER JOIN agent ag ON ag.id = s.created_by_agent_id
                          WHERE s.profile_id = a.profile_id
                            AND ag.profile_id = auth.uid()
                      )
                  )
                  OR p.role = 'ADMIN'
              )
        )
    );

-- <<< END 046_offer_insert_agent_students.sql

-- >>> BEGIN 047_offer_insert_staff_all_applications.sql

-- Allow staff roles to create offers for any application (All Application View workflow)
DROP POLICY IF EXISTS "offer_insert_university_agent" ON offer_letter;

CREATE POLICY "offer_insert_university_agent"
    ON offer_letter
    FOR INSERT
    TO authenticated
    WITH CHECK (
        issued_by_profile_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM application a
            INNER JOIN profile p ON p.id = auth.uid()
            WHERE a.id = application_id
              AND p.role IN ('UNIVERSITY', 'AGENT', 'ADMIN')
        )
    );

-- <<< END 047_offer_insert_staff_all_applications.sql

-- >>> BEGIN 048_fix_seed_auth_users.sql

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

-- <<< END 048_fix_seed_auth_users.sql

-- >>> BEGIN 049_university_read_agent_policies.sql

-- Allow university users to read agents and related KYC data for the agent dashboard.

DROP POLICY IF EXISTS "agent_university_read" ON agent;
CREATE POLICY "agent_university_read"
    ON agent
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_university_read" ON document;
CREATE POLICY "document_university_read"
    ON document
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_review_university_read" ON document_review;
CREATE POLICY "document_review_university_read"
    ON document_review
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

DROP POLICY IF EXISTS "document_files_university_read" ON document_files;
CREATE POLICY "document_files_university_read"
    ON document_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE profile.id = auth.uid()
              AND profile.role = 'UNIVERSITY'
        )
    );

-- <<< END 049_university_read_agent_policies.sql

-- >>> BEGIN 050_university_program_fields.sql

-- Link course rows to rich program content and support commission on degree
ALTER TABLE degree ADD COLUMN IF NOT EXISTS agent_commission NUMERIC;
ALTER TABLE degree ADD COLUMN IF NOT EXISTS intake_starts_on DATE;

ALTER TABLE course ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES program(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_program_id ON course(program_id);

-- <<< END 050_university_program_fields.sql

-- >>> BEGIN 051_university_program_write_policies.sql

-- Allow university/admin to manage programs without service role key

DROP POLICY IF EXISTS "program_write" ON program;
DROP POLICY IF EXISTS "program_university_write" ON program;

CREATE POLICY "program_university_write" ON program
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'UNIVERSITY'
              AND program.profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'UNIVERSITY'
              AND profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "degree_insert" ON degree;
DROP POLICY IF EXISTS "degree_update" ON degree;
DROP POLICY IF EXISTS "degree_delete" ON degree;
DROP POLICY IF EXISTS "degree_staff_insert" ON degree;
DROP POLICY IF EXISTS "degree_staff_update" ON degree;
DROP POLICY IF EXISTS "degree_staff_delete" ON degree;

CREATE POLICY "degree_staff_insert" ON degree
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "degree_staff_update" ON degree
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "degree_staff_delete" ON degree
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "course_insert" ON course;
DROP POLICY IF EXISTS "course_update" ON course;
DROP POLICY IF EXISTS "course_delete" ON course;
DROP POLICY IF EXISTS "course_staff_insert" ON course;
DROP POLICY IF EXISTS "course_staff_update" ON course;
DROP POLICY IF EXISTS "course_staff_delete" ON course;

CREATE POLICY "course_staff_insert" ON course
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "course_staff_update" ON course
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "course_staff_delete" ON course
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

DROP POLICY IF EXISTS "pdr_service" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_read" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_write" ON program_document_requirements;

CREATE POLICY "pdr_staff_read" ON program_document_requirements
    FOR SELECT
    USING (true);

CREATE POLICY "pdr_staff_write" ON program_document_requirements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profile
            WHERE id = auth.uid()
              AND role IN ('UNIVERSITY', 'ADMIN')
        )
    );

CREATE POLICY "pdr_service" ON program_document_requirements
    FOR ALL
    USING (auth.role() = 'service_role');

-- <<< END 051_university_program_write_policies.sql

-- >>> BEGIN 0520_degree_requirement_type.sql

-- ============================================================
-- 0520_degree_requirement_type.sql
-- Add REQUIRED / OPTIONAL to degree_requirement (course path via degree)
-- ============================================================

DO $$ BEGIN
    CREATE TYPE document_requirement_type_enum AS ENUM ('REQUIRED', 'OPTIONAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE degree_requirement
    ADD COLUMN IF NOT EXISTS requirement_type document_requirement_type_enum NOT NULL DEFAULT 'REQUIRED';

-- Default everything to OPTIONAL, then mark the first two document codes per
-- requirement set as REQUIRED (matches prior UI: first 2 docs required).
UPDATE degree_requirement
SET requirement_type = 'OPTIONAL';

WITH req_sets AS (
    SELECT * FROM (VALUES
        ('master_std',       ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('mba',              ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE','WORK_EXP_LETTER']::TEXT[]),
        ('bachelor_std',     ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('studienkolleg_en', ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('studienkolleg_de', ARRAY['CV','BD_AD_DEGREE','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('uniperp_std',      ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('uniperp_nursing',  ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE','BD_AD_DEGREE','WORK_EXP_LETTER']::TEXT[])
    ) AS t(set_name, doc_codes)
),
required_codes AS (
    SELECT set_name, doc_codes[1] AS code FROM req_sets
    UNION
    SELECT set_name, doc_codes[2] AS code FROM req_sets
),
degree_req_map AS (
    SELECT * FROM (VALUES
        ('msc_berlin_en_2y',      'master_std'),
        ('mba_berlin',            'mba'),
        ('ma_berlin_eglish_2y',   'master_std'),
        ('ma_berlin_en_2y',       'master_std'),
        ('msc_berlin_eglish_3y',  'master_std'),
        ('msc_duren_90_18m',      'master_std'),
        ('msc_duren_120_2y_typo', 'master_std'),
        ('msc_duren_120_2y',      'master_std'),
        ('beng_koln',             'bachelor_std'),
        ('ba_duren',              'bachelor_std'),
        ('ba_koln',               'bachelor_std'),
        ('studienkolleg_en',      'studienkolleg_en'),
        ('studienkolleg_de',      'studienkolleg_de'),
        ('ba_berlin_en',          'bachelor_std'),
        ('ba_berlin_eglish',      'bachelor_std'),
        ('ba_duren_eglish',       'bachelor_std'),
        ('bsc_waldshut_210_45',   'uniperp_std'),
        ('bsc_waldshut_210_3y',   'uniperp_nursing'),
        ('bsc_waldshut_240_3y',   'uniperp_nursing')
    ) AS t(degree_key, req_set)
),
degree_keys AS (
    SELECT DISTINCT ON (t.degree_key)
        t.degree_key,
        d.id AS degree_id
    FROM (VALUES
        ('msc_berlin_en_2y',       'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%English%', '%2%Year%'),
        ('mba_berlin',             'Master of Business Administration (MBA)',            90,  '%Berlin%',  '%English%', '%18%Month%'),
        ('ma_berlin_eglish_2y',    'Master of Arts (MA)',                                120, '%Berlin%',  '%Eglish%',  '%2%year%'),
        ('ma_berlin_en_2y',        'Master of Arts (MA)',                                120, '%Berlin%',  '%English%', '%2%Year%'),
        ('msc_berlin_eglish_3y',   'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%Eglish%',  '%3%year%'),
        ('msc_duren_90_18m',       'Master of Science (M. Sc.)',                         90,  '%Duren%',   '%Eglish%',  '%18%Minth%'),
        ('msc_duren_120_2y_typo',  'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%yaer%'),
        ('msc_duren_120_2y',       'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%year%'),
        ('beng_koln',               'Bachelor of Engg',                                   180, '%Köln%',    '%English%', '%3%year%'),
        ('ba_duren',                'Bachelor of Arts (B.A.)',                            180, '%Düren%',   '%English%', '%3%year%'),
        ('ba_koln',                 'Bachelor of Arts (B.A.)',                            180, '%Koln%',    '%English%', '%3%year%'),
        ('studienkolleg_en',        'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%English%', '%12%month%'),
        ('studienkolleg_de',        'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%German%',  '%12%month%'),
        ('ba_berlin_en',            'Bachelor of Arts (B.A.)',                            180, '%berlin%',  '%English%', '%3%year%'),
        ('ba_berlin_eglish',        'Bachelor of Arts (B.A.)',                            180, '%Berlin%',  '%Eglish%',  '%3%year%'),
        ('ba_duren_eglish',         'Bachelor of Arts (B.A.)',                            180, '%Duren%',   '%Eglish%',  '%3%year%'),
        ('bsc_waldshut_210_45',     'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%4.5%'),
        ('bsc_waldshut_210_3y',     'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%3%year%'),
        ('bsc_waldshut_240_3y',     'Bachelor of Science',                                240, '%Waldshut%','%German%',  '%3%year%')
    ) AS t(degree_key, deg_name, credits, location_like, language_like, duration_like)
    JOIN degree d
        ON d.name = t.deg_name
       AND d.credits IS NOT DISTINCT FROM t.credits
       AND d.location ILIKE t.location_like
       AND d.language_of_study ILIKE t.language_like
       AND d.duration ILIKE t.duration_like
    ORDER BY t.degree_key, d.id
),
required_pairs AS (
    SELECT DISTINCT dk.degree_id, dt.id AS document_type_id
    FROM degree_req_map drm
    JOIN degree_keys dk ON dk.degree_key = drm.degree_key
    JOIN required_codes rc ON rc.set_name = drm.req_set
    JOIN document_type dt ON dt.code = rc.code
)
UPDATE degree_requirement dr
SET requirement_type = 'REQUIRED'
FROM required_pairs rp
WHERE dr.degree_id = rp.degree_id
  AND dr.document_type_id = rp.document_type_id;

-- <<< END 0520_degree_requirement_type.sql

-- >>> BEGIN 0522_document_template_soft_delete_rls.sql

-- Fix document_template RLS so soft delete (UPDATE is_deleted = true) works
-- for creators and staff roles (ADMIN, UNIVERSITY, AGENT).

DROP POLICY IF EXISTS "document_template_update_auth" ON document_template;
DROP POLICY IF EXISTS "document_template_delete_auth" ON document_template;

CREATE POLICY "document_template_update_auth"
    ON document_template
    FOR UPDATE
    TO authenticated
    USING (
        is_deleted = false
        AND (
            auth.uid() = created_by_profile_id
            OR EXISTS (
                SELECT 1
                FROM profile p
                WHERE p.id = auth.uid()
                  AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
            )
        )
    )
    WITH CHECK (
        auth.uid() = created_by_profile_id
        OR EXISTS (
            SELECT 1
            FROM profile p
            WHERE p.id = auth.uid()
              AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
        )
    );

CREATE POLICY "document_template_delete_auth"
    ON document_template
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by_profile_id
        OR EXISTS (
            SELECT 1
            FROM profile p
            WHERE p.id = auth.uid()
              AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
        )
    );

-- <<< END 0522_document_template_soft_delete_rls.sql

-- >>> BEGIN 053_document_template_update_with_check_true.sql

-- Soft delete via SECURITY DEFINER RPC so authenticated users can delete
-- without fighting UPDATE ... WITH CHECK RLS on is_deleted = true.

CREATE OR REPLACE FUNCTION soft_delete_document_template(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role role_enum;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.role
    INTO v_role
    FROM profile p
    WHERE p.id = auth.uid();

    IF NOT EXISTS (
        SELECT 1
        FROM document_template dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
          AND (
              dt.created_by_profile_id = auth.uid()
              OR v_role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
          )
    ) THEN
        RAISE EXCEPTION 'Document template not found or not deletable';
    END IF;

    UPDATE document_template
    SET is_deleted = true,
        updated_at = NOW()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_document_template(UUID) TO authenticated;

-- Also relax UPDATE WITH CHECK so direct API updates can soft-delete if needed.
DROP POLICY IF EXISTS "document_template_update_auth" ON document_template;

CREATE POLICY "document_template_update_auth"
    ON document_template
    FOR UPDATE
    TO authenticated
    USING (
        is_deleted = false
        AND (
            auth.uid() = created_by_profile_id
            OR EXISTS (
                SELECT 1
                FROM profile p
                WHERE p.id = auth.uid()
                  AND p.role IN ('ADMIN', 'UNIVERSITY', 'AGENT')
            )
        )
    )
    WITH CHECK (true);

-- <<< END 053_document_template_update_with_check_true.sql

-- >>> BEGIN 054_offer_checklist_config.sql

-- Checklist configuration per document template and snapshot per offer letter.

ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE offer_letter
    ADD COLUMN IF NOT EXISTS checklist_items JSONB,
    ADD COLUMN IF NOT EXISTS checklist_proofs JSONB;

-- Offer: international 4-item checklist (German + English sections in template).
UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
WHERE id = 'd310476a-c64a-4361-a422-bf144908ae40';

-- Offer: full 6-item checklist.
UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
WHERE id = '51963d75-a02b-44af-9f7b-45179a555462';

-- Offer: studienkolleg-style 5-item checklist.
UPDATE offer_letter
SET checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
WHERE id = '3611b909-124c-485a-93d1-bde033469e1c';

-- Keep document templates aligned with their linked offers.
UPDATE document_template dt
SET checklist_items = ol.checklist_items
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id IN (
      'd310476a-c64a-4361-a422-bf144908ae40',
      '51963d75-a02b-44af-9f7b-45179a555462',
      '3611b909-124c-485a-93d1-bde033469e1c'
  );

-- <<< END 054_offer_checklist_config.sql

-- >>> BEGIN 055_document_template_checklist_profile.sql

-- Checklist profile per document template (4 / 5 / 6 item layouts).

ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS checklist_profile TEXT;

-- Offer-linked templates (international 4-item).
UPDATE document_template dt
SET
    checklist_profile = 'international_four',
    checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = 'd310476a-c64a-4361-a422-bf144908ae40';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
WHERE id = 'd310476a-c64a-4361-a422-bf144908ae40';

-- Full 6-item checklist.
UPDATE document_template dt
SET
    checklist_profile = 'full_six',
    checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = '51963d75-a02b-44af-9f7b-45179a555462';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
WHERE id = '51963d75-a02b-44af-9f7b-45179a555462';

-- Studienkolleg 5-item checklist.
UPDATE document_template dt
SET
    checklist_profile = 'studienkolleg_five',
    checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = '3611b909-124c-485a-93d1-bde033469e1c';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
WHERE id = '3611b909-124c-485a-93d1-bde033469e1c';

-- <<< END 055_document_template_checklist_profile.sql

-- >>> BEGIN 056_agent_document_review_update.sql

-- Allow agents to review (update) documents for students they created.

DROP POLICY IF EXISTS "document_review_agent_update" ON document_review;

CREATE POLICY "document_review_agent_update"
    ON document_review
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_review.document_id
              AND a.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_review.document_id
              AND a.profile_id = auth.uid()
        )
    );

-- <<< END 056_agent_document_review_update.sql

-- >>> BEGIN 057_update_university_seed_email.sql

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

-- <<< END 057_update_university_seed_email.sql

-- >>> BEGIN 058_update_admin_seed_email.sql

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

-- <<< END 058_update_admin_seed_email.sql

-- >>> BEGIN 059_fix_university_role.sql

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

-- <<< END 059_fix_university_role.sql

-- >>> BEGIN 060_fix_profile_rls_recursion.sql

-- Fix infinite RLS recursion on profile reads.
-- Cycle was: profile -> profile_select_agent -> agent -> agent_university_read -> profile

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profile
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO service_role;

-- Recreate university-read policies without nested profile RLS

DROP POLICY IF EXISTS "agent_university_read" ON agent;
CREATE POLICY "agent_university_read"
    ON agent
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_university_read" ON document;
CREATE POLICY "document_university_read"
    ON document
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_review_university_read" ON document_review;
CREATE POLICY "document_review_university_read"
    ON document_review
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_files_university_read" ON document_files;
CREATE POLICY "document_files_university_read"
    ON document_files
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

-- Ensure own profile is always readable
DROP POLICY IF EXISTS "profile_select_own" ON profile;
CREATE POLICY "profile_select_own"
    ON profile
    FOR SELECT
    USING (auth.uid() = id);

-- <<< END 060_fix_profile_rls_recursion.sql

-- >>> BEGIN 061_ensure_agent_row_on_signup.sql

-- Auto-create role-specific rows on signup (profile alone is not enough for Agent APIs)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_role role_enum;
BEGIN
  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT');

  INSERT INTO profile (id, first_name, last_name, title, email, phone, role)
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
    INSERT INTO agent (id, profile_id)
    VALUES (NEW.id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF new_role = 'STUDENT' THEN
    INSERT INTO student (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF new_role = 'UNIVERSITY' THEN
    INSERT INTO university (id, profile_id)
    VALUES (NEW.id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill missing agent rows for existing AGENT profiles
INSERT INTO agent (id, profile_id)
SELECT p.id, p.id
FROM profile p
WHERE p.role = 'AGENT'
  AND NOT EXISTS (
    SELECT 1 FROM agent a WHERE a.profile_id = p.id
  )
ON CONFLICT (profile_id) DO NOTHING;

-- <<< END 061_ensure_agent_row_on_signup.sql

-- >>> BEGIN 062_agent_read_student_documents.sql

-- Allow agents to read documents (and related rows) for students they created,
-- including documents uploaded by the student themselves.

DROP POLICY IF EXISTS "document_select_agent" ON document;
CREATE POLICY "document_select_agent"
    ON document
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM student s
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE s.profile_id = document.profile_id
              AND a.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_files_select_agent" ON document_files;
CREATE POLICY "document_files_select_agent"
    ON document_files
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_files.document_id
              AND a.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_review_select_agent" ON document_review;
CREATE POLICY "document_review_select_agent"
    ON document_review
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            INNER JOIN student s ON s.profile_id = d.profile_id
            INNER JOIN agent a ON a.id = s.created_by_agent_id
            WHERE d.id = document_review.document_id
              AND a.profile_id = auth.uid()
        )
    );

-- Ensure uploader/owner can read reviews when policy was never applied
DROP POLICY IF EXISTS "doc_review_select_by_uploader" ON document_review;
CREATE POLICY "doc_review_select_by_uploader"
    ON document_review
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM document d
            WHERE d.id = document_review.document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

-- <<< END 062_agent_read_student_documents.sql

-- >>> BEGIN 063_comprehensive_staff_rls.sql

-- Comprehensive read policies for AGENT and UNIVERSITY staff dashboards.
-- Uses current_profile_role() from migration 060 to avoid profile RLS recursion.

-- ─── profile ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profile_select_agent_staff" ON profile;
CREATE POLICY "profile_select_agent_staff"
    ON profile
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "profile_select_university_staff" ON profile;
CREATE POLICY "profile_select_university_staff"
    ON profile
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- ─── student ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "student_select_agent_staff" ON student;
CREATE POLICY "student_select_agent_staff"
    ON student
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "student_select_university_staff" ON student;
CREATE POLICY "student_select_university_staff"
    ON student
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- ─── education / work experience ─────────────────────────────
DROP POLICY IF EXISTS "education_select_agent_staff" ON education;
CREATE POLICY "education_select_agent_staff"
    ON education
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "education_select_university_staff" ON education;
CREATE POLICY "education_select_university_staff"
    ON education
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "work_experience_select_agent_staff" ON work_experience;
CREATE POLICY "work_experience_select_agent_staff"
    ON work_experience
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "work_experience_select_university_staff" ON work_experience;
CREATE POLICY "work_experience_select_university_staff"
    ON work_experience
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- ─── application ─────────────────────────────────────────────
DROP POLICY IF EXISTS "application_select_agent_staff" ON application;
CREATE POLICY "application_select_agent_staff"
    ON application
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "application_select_university_staff" ON application;
CREATE POLICY "application_select_university_staff"
    ON application
    FOR SELECT
    TO authenticated
    USING (
        public.current_profile_role() = 'UNIVERSITY'
        AND university_id = auth.uid()
    );

-- ─── application_review ──────────────────────────────────────
DROP POLICY IF EXISTS "application_review_select_agent_staff" ON application_review;
CREATE POLICY "application_review_select_agent_staff"
    ON application_review
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "application_review_select_university_staff" ON application_review;
CREATE POLICY "application_review_select_university_staff"
    ON application_review
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- ─── offer_letter ────────────────────────────────────────────
DROP POLICY IF EXISTS "offer_select_agent_staff" ON offer_letter;
CREATE POLICY "offer_select_agent_staff"
    ON offer_letter
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "offer_select_university_staff" ON offer_letter;
CREATE POLICY "offer_select_university_staff"
    ON offer_letter
    FOR SELECT
    TO authenticated
    USING (
        public.current_profile_role() = 'UNIVERSITY'
        AND EXISTS (
            SELECT 1
            FROM application a
            WHERE a.id = offer_letter.application_id
              AND a.university_id = auth.uid()
        )
    );

-- ─── document stack (replace narrow join policies from 062) ───
DROP POLICY IF EXISTS "document_select_agent" ON document;
CREATE POLICY "document_select_agent_staff"
    ON document
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "document_select_university_staff" ON document;
CREATE POLICY "document_select_university_staff"
    ON document
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_files_select_agent" ON document_files;
CREATE POLICY "document_files_select_agent_staff"
    ON document_files
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "document_files_select_university_staff" ON document_files;
CREATE POLICY "document_files_select_university_staff"
    ON document_files
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_review_select_agent" ON document_review;
CREATE POLICY "document_review_select_agent_staff"
    ON document_review
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "document_review_select_university_staff" ON document_review;
CREATE POLICY "document_review_select_university_staff"
    ON document_review
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- ─── agent (university partner list for university users) ─────
DROP POLICY IF EXISTS "agent_select_agent_staff" ON agent;
CREATE POLICY "agent_select_agent_staff"
    ON agent
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

-- ─── university table reads for joins ────────────────────────
DROP POLICY IF EXISTS "university_select_agent_staff" ON university;
CREATE POLICY "university_select_agent_staff"
    ON university
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

-- ─── payment (agent/university dashboards) ───────────────────
DROP POLICY IF EXISTS "payment_select_agent_staff" ON payment;
CREATE POLICY "payment_select_agent_staff"
    ON payment
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'AGENT');

DROP POLICY IF EXISTS "payment_select_university_staff" ON payment;
CREATE POLICY "payment_select_university_staff"
    ON payment
    FOR SELECT
    TO authenticated
    USING (public.current_profile_role() = 'UNIVERSITY');

-- <<< END 063_comprehensive_staff_rls.sql

-- >>> BEGIN 064_course_timestamps.sql

-- Add audit timestamps to courses and keep updated_at current.
ALTER TABLE course
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_course_updated_at ON course;
CREATE TRIGGER trg_course_updated_at
    BEFORE UPDATE ON course
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- <<< END 064_course_timestamps.sql

-- >>> BEGIN 065_course_soft_delete.sql

-- Soft-delete courses so historical references remain intact.
ALTER TABLE course
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_course_is_deleted
    ON course (is_deleted);

-- <<< END 065_course_soft_delete.sql

-- >>> BEGIN 066_seed_required_staff_users.sql

-- Seed required staff users for development/staging environments.
-- Uses enum values available at this migration point (ADMIN/UNIVERSITY are renamed in 068).
-- Full dev account set is finalized in 073_seed_development_auth_users.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

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
                'ADMIN'::role_enum,
                'System',
                'Developer',
                '+4930000001'
            ),
            (
                '00000000-0000-0000-0000-000000000002'::UUID,
                'admin@gmail.com',
                'Shar@123',
                'UNIVERSITY'::role_enum,
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
                'Partner',
                '+4930000003'
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
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'https://www.fhm.de',
    'Germany',
    'Bielefeld',
    'Ravensberger Str. 10G, 33602 Bielefeld',
    'Fachhochschule des Mittelstands (FHM)',
    NOW()
)
ON CONFLICT (profile_id) DO NOTHING;

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
    'Partner',
    'German',
    'Germany',
    'Bielefeld',
    'Ravensberger Str. 10G, 33602 Bielefeld',
    5,
    'https://www.fhm.de',
    NOW()
)
ON CONFLICT (profile_id) DO NOTHING;

-- <<< END 066_seed_required_staff_users.sql

-- >>> BEGIN 067_canonicalize_rls_and_roles.sql

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

-- <<< END 067_canonicalize_rls_and_roles.sql

-- >>> BEGIN 068_rename_staff_roles.sql

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

-- <<< END 068_rename_staff_roles.sql

-- >>> BEGIN 069_add_management_role.sql

-- Add MANAGEMENT role enum value.
-- Must be committed before MANAGEMENT can be referenced in functions/policies.

ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'MANAGEMENT';

-- <<< END 069_add_management_role.sql

-- >>> BEGIN 0701_onboarding_document_review_insert.sql

-- Allow document owners/uploaders to create initial review rows during onboarding
-- and document uploads (policy existed in legacy migrations but was never applied here).

DROP POLICY IF EXISTS "doc_review_insert_by_uploader" ON public.document_review;
CREATE POLICY "doc_review_insert_by_uploader"
    ON public.document_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.document AS d
            WHERE d.id = document_review.document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

-- Ensure agents can insert/update their own row during onboarding (WITH CHECK required for upsert).
DROP POLICY IF EXISTS "agent_manage_own" ON public.agent;
CREATE POLICY "agent_manage_own"
    ON public.agent
    FOR ALL
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- <<< END 0701_onboarding_document_review_insert.sql

-- >>> BEGIN 0702_management_role_access.sql

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

-- <<< END 0702_management_role_access.sql

-- >>> BEGIN 0703_add_doc_status_enum_values.sql

-- Align doc_status_enum with application expectations (PENDING, VERIFIED, ACTION_REQUIRED).
-- Default is set in the following migration (enum values must commit before use).

ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'ACTION_REQUIRED';

-- <<< END 0703_add_doc_status_enum_values.sql

-- >>> BEGIN 0704_document_review_status_default.sql

-- Set default after enum values are committed (see 0703).

ALTER TABLE public.document_review
    ALTER COLUMN status SET DEFAULT 'PENDING';

-- <<< END 0704_document_review_status_default.sql

-- >>> BEGIN 071_service_role_profile_grants.sql

-- Ensure server-side provisioning can manage profile/student rows via service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_files TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_review TO service_role;

-- <<< END 071_service_role_profile_grants.sql

-- >>> BEGIN 072_application_review_rls.sql

-- Application review workflow RLS:
-- - SUPER_ADMIN can review/update any application
-- - ADMIN / MANAGEMENT can review/update applications for their university scope
-- - Students/agents can resubmit rejected applications (audit row + status reset)

CREATE INDEX IF NOT EXISTS idx_application_review_application_created
    ON public.application_review (application_id, created_at DESC);

-- ─── application_review INSERT ───────────────────────────────

DROP POLICY IF EXISTS "application_review_insert_super_admin" ON public.application_review;
CREATE POLICY "application_review_insert_super_admin"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "application_review_insert_university_staff" ON public.application_review;
CREATE POLICY "application_review_insert_university_staff"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_university_role()
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND a.university_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "application_review_insert_resubmit_participant" ON public.application_review;
CREATE POLICY "application_review_insert_resubmit_participant"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        application_review.status = 'PENDING'
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND a.status IN ('REJECTED', 'NEEDS_REVISION')
              AND (
                  a.profile_id = auth.uid()
                  OR a.submitted_by_profile_id = auth.uid()
              )
        )
    );

-- ─── application UPDATE ──────────────────────────────────────

DROP POLICY IF EXISTS "application_update_super_admin" ON public.application;
CREATE POLICY "application_update_super_admin"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "application_update_university_staff" ON public.application;
CREATE POLICY "application_update_university_staff"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        public.is_university_role()
        AND university_id = auth.uid()
    )
    WITH CHECK (
        public.is_university_role()
        AND university_id = auth.uid()
    );

DROP POLICY IF EXISTS "application_update_resubmit_participant" ON public.application;
CREATE POLICY "application_update_resubmit_participant"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        status IN ('REJECTED', 'NEEDS_REVISION')
        AND (
            profile_id = auth.uid()
            OR submitted_by_profile_id = auth.uid()
        )
    )
    WITH CHECK (
        status = 'PENDING'
        AND (
            profile_id = auth.uid()
            OR submitted_by_profile_id = auth.uid()
        )
    );

-- <<< END 072_application_review_rls.sql

-- >>> BEGIN 073_seed_development_auth_users.sql

-- Ensure development auth users exist on databases that already ran earlier seed migrations.
-- Idempotent: creates missing seed accounts; does not delete existing unrelated data.

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

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
                'Partner',
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
ON CONFLICT (profile_id) DO NOTHING;

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
    'Partner',
    'German',
    'Germany',
    'Bielefeld',
    'Ravensberger Str. 10G, 33602 Bielefeld',
    5,
    'https://www.fhm.de',
    NOW()
)
ON CONFLICT (profile_id) DO NOTHING;

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
ON CONFLICT (profile_id) DO NOTHING;

UPDATE student
SET
    created_by_agent_id = '00000000-0000-0000-0000-000000000003',
    updated_at = NOW()
WHERE profile_id = '00000000-0000-0000-0000-000000000006'
  AND created_by_agent_id IS NULL;

-- <<< END 073_seed_development_auth_users.sql

-- >>> BEGIN 074_service_role_offer_grants.sql

-- Ensure server-side offer signing can update offer rows via service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letter TO service_role;

-- <<< END 074_service_role_offer_grants.sql

-- >>> BEGIN 075_deduplicate_levels.sql

-- Deduplicate levels rows (same name + university_id).
-- Keeps the oldest row (created_at, then id) and rewires all FK references.

BEGIN;

CREATE TEMP TABLE tmp_level_duplicates ON COMMIT DROP AS
WITH ranked AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY lower(trim(name)), COALESCE(university_id, '00000000-0000-0000-0000-000000000000'::uuid)
            ORDER BY created_at ASC, id ASC
        ) AS keeper_id
    FROM levels
)
SELECT id AS duplicate_id, keeper_id
FROM ranked
WHERE id <> keeper_id;

-- degree.level_id
UPDATE degree AS d
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE d.level_id = map.duplicate_id;

-- education_type.level_id
UPDATE education_type AS et
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE et.level_id = map.duplicate_id;

-- document_type_level: drop rows that would collide after merge
DELETE FROM document_type_level AS dtl_dup
USING tmp_level_duplicates AS map, document_type_level AS dtl_keep
WHERE dtl_dup.level_id = map.duplicate_id
  AND dtl_keep.level_id = map.keeper_id
  AND dtl_dup.document_type_id = dtl_keep.document_type_id;

UPDATE document_type_level AS dtl
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE dtl.level_id = map.duplicate_id;

DELETE FROM levels AS l
USING tmp_level_duplicates AS map
WHERE l.id = map.duplicate_id;

-- Prevent future duplicates for the same university scope (NULL university_id included).
CREATE UNIQUE INDEX IF NOT EXISTS idx_levels_name_university_unique
    ON levels (
        lower(trim(name)),
        COALESCE(university_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

COMMIT;

-- <<< END 075_deduplicate_levels.sql

-- >>> BEGIN 076_document_template_storage_policies.sql

-- Allow document template image uploads in student-admission storage.
-- Path pattern: {profile_id}/document-templates/{hash}.{ext}

DROP POLICY IF EXISTS "document_template_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "document_template_images_update" ON storage.objects;
DROP POLICY IF EXISTS "document_template_images_select" ON storage.objects;

CREATE POLICY "document_template_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
);

CREATE POLICY "document_template_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
)
WITH CHECK (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
);

CREATE POLICY "document_template_images_select"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[2] = 'document-templates'
);

-- <<< END 076_document_template_storage_policies.sql

-- >>> BEGIN 077_document_template_shared_assets_storage.sql

-- Shared template asset library in student-admission/document-template-assets/

DROP POLICY IF EXISTS "document_template_shared_assets_select" ON storage.objects;

CREATE POLICY "document_template_shared_assets_select"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = 'document-template-assets'
);

-- <<< END 077_document_template_shared_assets_storage.sql

-- >>> BEGIN 078_management_application_scope.sql

-- MANAGEMENT staff share the same application scope as the university ADMIN profile.
-- Applications store university_id as the ADMIN profile id, not the MANAGEMENT user id.

CREATE OR REPLACE FUNCTION public.management_university_scope_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT p.id
    FROM public.profile AS p
    WHERE p.role = 'ADMIN'
    UNION
    SELECT DISTINCT l.university_id
    FROM public.levels AS l
    WHERE l.university_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.management_university_scope_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.management_university_scope_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.management_university_scope_ids() TO service_role;

CREATE OR REPLACE FUNCTION public.can_access_university_application(target_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT CASE public.current_profile_role()
        WHEN 'ADMIN' THEN target_university_id = auth.uid()
        WHEN 'MANAGEMENT' THEN target_university_id IN (
            SELECT public.management_university_scope_ids()
        )
        ELSE FALSE
    END;
$$;

REVOKE ALL ON FUNCTION public.can_access_university_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_university_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_university_application(uuid) TO service_role;

DROP POLICY IF EXISTS "application_select_university_staff" ON public.application;
CREATE POLICY "application_select_university_staff"
    ON public.application
    FOR SELECT
    TO authenticated
    USING (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    );

DROP POLICY IF EXISTS "application_update_university_staff" ON public.application;
CREATE POLICY "application_update_university_staff"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    )
    WITH CHECK (
        public.is_university_role()
        AND public.can_access_university_application(university_id)
    );

DROP POLICY IF EXISTS "application_review_insert_university_staff" ON public.application_review;
CREATE POLICY "application_review_insert_university_staff"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_university_role()
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND public.can_access_university_application(a.university_id)
        )
    );

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
              AND public.can_access_university_application(a.university_id)
        )
    );

-- <<< END 078_management_application_scope.sql

-- >>> BEGIN 079_document_template_program_id.sql

-- Link each offer document template to exactly one program (1:1).
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES program(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS document_template_program_id_unique_idx
    ON document_template(program_id)
    WHERE program_id IS NOT NULL AND is_deleted = false;

CREATE INDEX IF NOT EXISTS document_template_program_id_idx
    ON document_template(program_id);

-- <<< END 079_document_template_program_id.sql

-- >>> BEGIN 0791_fix_soft_delete_document_template_roles.sql

-- soft_delete_document_template still referenced legacy UNIVERSITY enum (renamed in 068).

CREATE OR REPLACE FUNCTION public.soft_delete_document_template(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_role public.role_enum;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT p.role
    INTO v_role
    FROM public.profile AS p
    WHERE p.id = auth.uid();

    IF NOT EXISTS (
        SELECT 1
        FROM public.document_template AS dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
          AND (
              dt.created_by_profile_id = auth.uid()
              OR v_role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
          )
    ) THEN
        RAISE EXCEPTION 'Document template not found or not deletable';
    END IF;

    UPDATE public.document_template
    SET is_deleted = true,
        updated_at = NOW()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO service_role;

-- <<< END 0791_fix_soft_delete_document_template_roles.sql

-- >>> BEGIN 080_document_template_locale.sql

-- Template letter language (German or English) for locale-aware merge fields.
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('de', 'en'));

COMMENT ON COLUMN document_template.locale IS
    'Letter language: de = German salutations/dates/checklist, en = English.';

-- <<< END 080_document_template_locale.sql

-- >>> BEGIN 0801_address_street_fields.sql

-- Split single address into street lines + post code

ALTER TABLE student ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS post_code text;

ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS post_code text;

ALTER TABLE university ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS post_code text;

UPDATE student
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';

UPDATE student
SET post_code = zip_code
WHERE post_code IS NULL AND zip_code IS NOT NULL AND btrim(zip_code) <> '';

UPDATE agent
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';

UPDATE university
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';

-- <<< END 0801_address_street_fields.sql

-- >>> BEGIN 081_document_template_dates.sql

-- Configurable letter dates per template (program period, enrollment, visa deadline, etc.)
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS template_dates jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN document_template.template_dates IS
    'Letter-specific dates: program_period_start/end, classes_start_date, enrollment window, visa_participation_deadline.';

-- <<< END 081_document_template_dates.sql

-- >>> BEGIN 082_document_template_watermark.sql

ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS watermark jsonb NOT NULL DEFAULT '{"enabled":true,"image_url":null,"opacity":0.12,"size_px":500}'::jsonb;

COMMENT ON COLUMN document_template.watermark IS
    'Page watermark: enabled, image_url, opacity (0-1), size_px.';

-- <<< END 082_document_template_watermark.sql

-- >>> BEGIN 083_drop_program_tables.sql

-- ============================================================
-- 083_drop_program_tables.sql
-- Move program content onto course, migrate document requirements
-- to degree_requirement, relink document_template to course,
-- then drop program + program_document_requirements tables.
-- ============================================================

-- ─── 1. Add program content columns to course ─────────────────
ALTER TABLE course
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS program_length TEXT,
    ADD COLUMN IF NOT EXISTS program_detail TEXT,
    ADD COLUMN IF NOT EXISTS admission_requirements TEXT,
    ADD COLUMN IF NOT EXISTS perspectives TEXT,
    ADD COLUMN IF NOT EXISTS prospects_after_graduation TEXT,
    ADD COLUMN IF NOT EXISTS competency_model TEXT,
    ADD COLUMN IF NOT EXISTS professional_skills TEXT,
    ADD COLUMN IF NOT EXISTS management_skills TEXT,
    ADD COLUMN IF NOT EXISTS status program_status_enum NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profile(id) ON DELETE SET NULL;

-- ─── 2. Copy program row data onto linked courses ─────────────
UPDATE course c
SET
    category = p.category,
    location = p.location,
    program_length = p.program_length,
    program_detail = p.program_detail,
    admission_requirements = p.admission_requirements,
    perspectives = p.perspectives,
    prospects_after_graduation = p.prospects_after_graduation,
    competency_model = p.competency_model,
    professional_skills = p.professional_skills,
    management_skills = p.management_skills,
    status = p.status,
    profile_id = p.profile_id
FROM program p
WHERE c.program_id = p.id;

-- ─── 3. Migrate program_document_requirements → degree_requirement
INSERT INTO degree_requirement (degree_id, document_type_id, requirement_type)
SELECT DISTINCT
    c.degree_id,
    pdr.document_type_id,
    'REQUIRED'::document_requirement_type_enum
FROM program_document_requirements pdr
JOIN course c ON c.program_id = pdr.program_id
WHERE c.degree_id IS NOT NULL
ON CONFLICT (degree_id, document_type_id) DO NOTHING;

-- ─── 4. Relink document_template from program_id → course_id ──
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course(id) ON DELETE SET NULL;

UPDATE document_template dt
SET course_id = c.id
FROM course c
WHERE c.program_id = dt.program_id
  AND dt.program_id IS NOT NULL;

DROP INDEX IF EXISTS document_template_program_id_unique_idx;
DROP INDEX IF EXISTS document_template_program_id_idx;

ALTER TABLE document_template
    DROP CONSTRAINT IF EXISTS document_template_program_id_fkey;

ALTER TABLE document_template
    DROP COLUMN IF EXISTS program_id;

CREATE UNIQUE INDEX IF NOT EXISTS document_template_course_id_unique_idx
    ON document_template(course_id)
    WHERE course_id IS NOT NULL AND is_deleted = false;

CREATE INDEX IF NOT EXISTS document_template_course_id_idx
    ON document_template(course_id);

-- ─── 5. Drop dependent objects ────────────────────────────────
DROP POLICY IF EXISTS "pdr_read" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_service" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_read" ON program_document_requirements;
DROP POLICY IF EXISTS "pdr_staff_write" ON program_document_requirements;

DROP TABLE IF EXISTS program_document_requirements;

DROP POLICY IF EXISTS "cpj_read" ON campus_program_junction;
DROP POLICY IF EXISTS "cpj_service" ON campus_program_junction;

DROP TABLE IF EXISTS campus_program_junction;

ALTER TABLE course
    DROP CONSTRAINT IF EXISTS course_program_id_fkey;

DROP INDEX IF EXISTS idx_course_program_id;

ALTER TABLE course
    DROP COLUMN IF EXISTS program_id;

DROP POLICY IF EXISTS "program_read" ON program;
DROP POLICY IF EXISTS "program_write" ON program;
DROP POLICY IF EXISTS "program_service" ON program;
DROP POLICY IF EXISTS "program_university_write" ON program;

DROP TABLE IF EXISTS program;

-- <<< END 083_drop_program_tables.sql

-- >>> BEGIN 002_seed_platform_data.sql

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

-- <<< END 002_seed_platform_data.sql

-- >>> BEGIN 004_document_type_university_id.sql

-- Backfill university_id on platform document types (admin university profile from seed 002)
UPDATE public.document_type
SET university_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE university_id IS NULL;

-- <<< END 004_document_type_university_id.sql

-- >>> BEGIN 005_document_template_course.sql

-- Many-to-many: one offer template can link to multiple courses/programs.
-- Each course may still belong to only one active template.

CREATE TABLE IF NOT EXISTS public.document_template_course (
    document_template_id UUID NOT NULL REFERENCES public.document_template(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.course(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (document_template_id, course_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_template_course_course_id_unique_idx
    ON public.document_template_course(course_id);

CREATE INDEX IF NOT EXISTS document_template_course_template_id_idx
    ON public.document_template_course(document_template_id);

COMMENT ON TABLE public.document_template_course IS
    'Links offer document templates to one or more courses. Each course may appear once.';

-- Backfill from legacy single course_id column
INSERT INTO public.document_template_course (document_template_id, course_id)
SELECT dt.id, dt.course_id
FROM public.document_template AS dt
WHERE dt.course_id IS NOT NULL
  AND dt.is_deleted = false
ON CONFLICT DO NOTHING;

-- Uniqueness now lives on the junction table
DROP INDEX IF EXISTS public.document_template_course_id_unique_idx;

ALTER TABLE public.document_template_course ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_template_course_select_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_select_auth"
    ON public.document_template_course
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "document_template_course_insert_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_insert_auth"
    ON public.document_template_course
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "document_template_course_update_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_update_auth"
    ON public.document_template_course
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "document_template_course_delete_auth" ON public.document_template_course;
CREATE POLICY "document_template_course_delete_auth"
    ON public.document_template_course
    FOR DELETE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "document_template_course_service" ON public.document_template_course;
CREATE POLICY "document_template_course_service"
    ON public.document_template_course
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Soft-delete should free course assignments
CREATE OR REPLACE FUNCTION public.soft_delete_document_template(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role public.role_enum;
BEGIN
    SELECT p.role INTO caller_role
    FROM public.profile AS p
    WHERE p.id = auth.uid();

    IF caller_role IS NULL OR caller_role NOT IN (
        'SUPER_ADMIN'::public.role_enum,
        'ADMIN'::public.role_enum,
        'MANAGEMENT'::public.role_enum,
        'AGENT'::public.role_enum
    ) THEN
        RAISE EXCEPTION 'Forbidden';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.document_template AS dt
        WHERE dt.id = template_id
          AND dt.is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Document template not found';
    END IF;

    DELETE FROM public.document_template_course
    WHERE document_template_id = template_id;

    UPDATE public.document_template
    SET
        is_deleted = true,
        course_id = NULL,
        updated_at = now()
    WHERE id = template_id
      AND is_deleted = false;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_document_template(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_document_template(UUID) TO service_role;

-- <<< END 005_document_template_course.sql

-- >>> BEGIN 006_degree_requirement_soft_delete.sql

-- Soft-delete support for degree_requirement (no hard deletes from app).

ALTER TABLE public.degree_requirement
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.degree_requirement.is_deleted IS
    'Soft-delete flag. Active document requirements must have is_deleted = false.';

-- Replace hard unique with active-only unique so soft-deleted rows can be restored/recreated.
ALTER TABLE public.degree_requirement
    DROP CONSTRAINT IF EXISTS uq_degree_document_type;

CREATE UNIQUE INDEX IF NOT EXISTS degree_requirement_active_unique_idx
    ON public.degree_requirement (degree_id, document_type_id)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS degree_requirement_is_deleted_idx
    ON public.degree_requirement (is_deleted);

-- Staff write policies (ADMIN / MANAGEMENT / SUPER_ADMIN / AGENT for consistency with staff tables)
DROP POLICY IF EXISTS "degree_requirement_insert_staff" ON public.degree_requirement;
CREATE POLICY "degree_requirement_insert_staff"
    ON public.degree_requirement
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    );

DROP POLICY IF EXISTS "degree_requirement_update_staff" ON public.degree_requirement;
CREATE POLICY "degree_requirement_update_staff"
    ON public.degree_requirement
    FOR UPDATE
    TO authenticated
    USING (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    )
    WITH CHECK (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    );

-- <<< END 006_degree_requirement_soft_delete.sql

