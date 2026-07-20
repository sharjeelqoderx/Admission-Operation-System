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
