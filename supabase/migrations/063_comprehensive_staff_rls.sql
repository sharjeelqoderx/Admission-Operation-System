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
