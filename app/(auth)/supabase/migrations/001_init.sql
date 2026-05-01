-- ============================================================
-- 001_init.sql
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ─── ENUMs ───────────────────────────────────────────────────
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE role_enum   AS ENUM ('Agent', 'Student', 'Admin', 'Organization');

-- ─── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name        TEXT,
    email            TEXT,
    phone            TEXT,
    date_of_birth    DATE,
    gender           gender_enum,
    country          TEXT,
    nationality      TEXT,
    guardian_email   TEXT,
    guardian_phone   TEXT,
    picture          TEXT,
    website          TEXT,
    role             role_enum NOT NULL DEFAULT 'Student',
    is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    academic_gap     INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ─── academic_background ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_background (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    qualification    TEXT NOT NULL,
    institute_name   TEXT NOT NULL,
    gpa              NUMERIC(3,2) CHECK (gpa >= 0 AND gpa <= 4),
    desired_program  TEXT,
    campus           TEXT,
    english_test     TEXT,
    about            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_academic_user_id ON academic_background(user_id);

-- ─── experience ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name             TEXT,
    organization     TEXT,
    industry         TEXT,
    country          TEXT,
    start_date       DATE,
    end_date         DATE,
    responsibility   TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experience_user_id ON experience(user_id);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience          ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- academic_background policies
CREATE POLICY "Users can view own academic"
    ON academic_background FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own academic"
    ON academic_background FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own academic"
    ON academic_background FOR UPDATE
    USING (auth.uid() = user_id);

-- experience policies
CREATE POLICY "Users can view own experience"
    ON experience FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experience"
    ON experience FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experience"
    ON experience FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by API routes)
CREATE POLICY "Service role full access profiles"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access academic"
    ON academic_background FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access experience"
    ON experience FOR ALL
    USING (auth.role() = 'service_role');
