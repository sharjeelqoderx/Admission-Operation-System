-- ============================================================
-- 009_erd_schema.sql  –  Full ERD-based schema
-- Drops old tables, creates new ones per ERD, seeds admin + university
-- ============================================================

-- ─── Drop old tables (order matters for FK deps) ─────────────
DROP TABLE IF EXISTS experience          CASCADE;
DROP TABLE IF EXISTS academic_background CASCADE;
DROP TABLE IF EXISTS profiles            CASCADE;

-- ─── Drop old enums ──────────────────────────────────────────
DROP TYPE IF EXISTS gender_enum CASCADE;
DROP TYPE IF EXISTS role_enum   CASCADE;

-- ─── New ENUMs ───────────────────────────────────────────────
CREATE TYPE gender_enum          AS ENUM ('MALE', 'FEMALE');
CREATE TYPE role_enum            AS ENUM ('STUDENT', 'AGENT', 'UNIVERSITY', 'ADMIN');
CREATE TYPE campus_type_enum     AS ENUM ('MAIN', 'BRANCH', 'ONLINE');
CREATE TYPE program_status_enum  AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE doc_status_enum      AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVISION');
CREATE TYPE app_status_enum      AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVISION', 'PENDING');
CREATE TYPE offer_status_enum    AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE payment_status_enum  AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
CREATE TYPE conv_status_enum     AS ENUM ('OPEN', 'CLOSED');

-- ─── profile ─────────────────────────────────────────────────
CREATE TABLE profile (
    id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name           TEXT,
    email          TEXT UNIQUE,
    phone          TEXT,
    date_of_birth  DATE,
    gender         gender_enum,
    avatar_url     TEXT,
    role           role_enum NOT NULL DEFAULT 'STUDENT',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── student ─────────────────────────────────────────────────
CREATE TABLE student (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id           UUID NOT NULL UNIQUE REFERENCES profile(id) ON DELETE CASCADE,
    student_code         TEXT,
    nationality          TEXT,
    country              TEXT,
    city                 TEXT,
    address              TEXT,
    zip_code             TEXT,
    guardian_email       TEXT,
    guardian_phone       TEXT,
    passport_file_url    TEXT,
    created_by_agent_id  UUID,  -- FK added after agent table
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title               TEXT,
    organization_name   TEXT,
    industry_sector     TEXT,
    country             TEXT,
    start_date          DATE,
    end_date            DATE,
    key_responsibilities TEXT,
    timeline_gap_years  NUMERIC,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- ─── Add FK on student.created_by_agent_id ───────────────────
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
    profile_id        UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,  -- university profile
    name              TEXT,
    established_year  INTEGER,
    short_description TEXT,
    total_area        TEXT,
    location          TEXT,
    campus_type       campus_type_enum,
    faculties         TEXT,
    departments       TEXT,
    cover_image       TEXT,
    department_image  TEXT,
    status            TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── program ─────────────────────────────────────────────────
CREATE TABLE program (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id                UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,  -- university profile
    name                      TEXT,
    category                  TEXT,
    location                  TEXT,
    program_length            TEXT,
    program_detail            TEXT,
    admission_requirements    TEXT,
    perspectives              TEXT,
    prospects_after_graduation TEXT,
    competency_model          TEXT,
    professional_skills       TEXT,
    management_skills         TEXT,
    status                    program_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id            UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,  -- student profile
    uploaded_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    url                   TEXT,
    name                  TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── document_review ─────────────────────────────────────────
CREATE TABLE document_review (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id           UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    reviewed_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    status                doc_status_enum NOT NULL DEFAULT 'NEEDS_REVISION',
    feedback              TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── application ─────────────────────────────────────────────
CREATE TABLE application (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id         UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    program_id            UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,  -- student
    submitted_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    application_no        TEXT UNIQUE,
    status                app_status_enum NOT NULL DEFAULT 'PENDING',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id        UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    reviewed_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    feedback              TEXT,
    status                app_status_enum NOT NULL DEFAULT 'PENDING',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── offer_letter ────────────────────────────────────────────
CREATE TABLE offer_letter (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    issued_by_profile_id UUID REFERENCES profile(id) ON DELETE SET NULL,
    file_url            TEXT,
    status              offer_status_enum NOT NULL DEFAULT 'PENDING',
    accepted_at         TIMESTAMPTZ,
    rejected_at         TIMESTAMPTZ,
    feedback            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  FOREACH t IN ARRAY ARRAY['profile','student','education','work_experience','agent','university',
    'campus','program','campus_program_junction','document','document_review','application',
    'application_document','application_review','offer_letter','payment','conversation','message']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- ─── Auto-create profile on auth.users insert ────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
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
ALTER TABLE profile              ENABLE ROW LEVEL SECURITY;
ALTER TABLE student              ENABLE ROW LEVEL SECURITY;
ALTER TABLE education            ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent                ENABLE ROW LEVEL SECURITY;
ALTER TABLE university           ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus               ENABLE ROW LEVEL SECURITY;
ALTER TABLE program              ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_program_junction ENABLE ROW LEVEL SECURITY;
ALTER TABLE document             ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_review      ENABLE ROW LEVEL SECURITY;
ALTER TABLE application          ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_review   ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letter         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment              ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation         ENABLE ROW LEVEL SECURITY;
ALTER TABLE message              ENABLE ROW LEVEL SECURITY;

-- profile: own row + service role
CREATE POLICY "profile_select_own" ON profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_insert_own" ON profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update_own" ON profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_service"    ON profile FOR ALL   USING (auth.role() = 'service_role');

-- student: own + service
CREATE POLICY "student_own"    ON student FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "student_service" ON student FOR ALL USING (auth.role() = 'service_role');

-- education / work_experience: own + service
CREATE POLICY "education_own"    ON education FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "education_service" ON education FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "work_exp_own"     ON work_experience FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "work_exp_service"  ON work_experience FOR ALL USING (auth.role() = 'service_role');

-- agent: own + service
CREATE POLICY "agent_own"    ON agent FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "agent_service" ON agent FOR ALL USING (auth.role() = 'service_role');

-- university: own + service
CREATE POLICY "university_own"    ON university FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "university_service" ON university FOR ALL USING (auth.role() = 'service_role');

-- campus / program: university owner + public read + service
CREATE POLICY "campus_read"    ON campus FOR SELECT USING (true);
CREATE POLICY "campus_write"   ON campus FOR ALL   USING (profile_id = auth.uid());
CREATE POLICY "campus_service" ON campus FOR ALL   USING (auth.role() = 'service_role');
CREATE POLICY "program_read"    ON program FOR SELECT USING (true);
CREATE POLICY "program_write"   ON program FOR ALL   USING (profile_id = auth.uid());
CREATE POLICY "program_service" ON program FOR ALL   USING (auth.role() = 'service_role');

-- campus_program_junction: public read + service
CREATE POLICY "cpj_read"    ON campus_program_junction FOR SELECT USING (true);
CREATE POLICY "cpj_service" ON campus_program_junction FOR ALL   USING (auth.role() = 'service_role');

-- document: owner or uploader + service
CREATE POLICY "doc_own"     ON document FOR ALL USING (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid());
CREATE POLICY "doc_service" ON document FOR ALL USING (auth.role() = 'service_role');

-- document_review / application_review / offer_letter / payment / conversation / message: service role
CREATE POLICY "doc_review_service"  ON document_review      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "app_service"         ON application           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "app_doc_service"     ON application_document  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "app_rev_service"     ON application_review    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "offer_service"       ON offer_letter          FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "payment_service"     ON payment               FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "conv_service"        ON conversation          FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "msg_service"         ON message               FOR ALL USING (auth.role() = 'service_role');

-- application: participant can read own
CREATE POLICY "app_read_own" ON application FOR SELECT
  USING (profile_id = auth.uid() OR submitted_by_profile_id = auth.uid() OR university_id = auth.uid());

-- conversation: participant can read
CREATE POLICY "conv_read_own" ON conversation FOR SELECT
  USING (student_id = auth.uid() OR agent_id = auth.uid() OR university_id = auth.uid());

-- message: participant can read/insert
CREATE POLICY "msg_read_own"   ON message FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation c WHERE c.id = conversation_id
    AND (c.student_id = auth.uid() OR c.agent_id = auth.uid() OR c.university_id = auth.uid()))
);
CREATE POLICY "msg_insert_own" ON message FOR INSERT WITH CHECK (sender_profile_id = auth.uid());
