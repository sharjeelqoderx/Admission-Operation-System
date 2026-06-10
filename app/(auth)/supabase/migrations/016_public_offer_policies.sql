-- ============================================================
-- Add RLS policies for public offer endpoints
-- ============================================================

-- Offer letter: allow public read and update
DROP POLICY IF EXISTS "offer_service" ON offer_letter;
CREATE POLICY "offer_public_read" ON offer_letter FOR SELECT USING (true);
CREATE POLICY "offer_public_update" ON offer_letter FOR UPDATE USING (true);
CREATE POLICY "offer_service" ON offer_letter FOR ALL USING (auth.role() = 'service_role');

-- Application: allow public read
DROP POLICY IF EXISTS "app_service" ON application;
CREATE POLICY "application_public_read" ON application FOR SELECT USING (true);
CREATE POLICY "app_service" ON application FOR ALL USING (auth.role() = 'service_role');

-- Profile: allow public read and update for signature
DROP POLICY IF EXISTS "profile_select_own" ON profile;
DROP POLICY IF EXISTS "profile_update_own" ON profile;
CREATE POLICY "profile_public_read" ON profile FOR SELECT USING (true);
CREATE POLICY "profile_public_update" ON profile FOR UPDATE USING (true);
CREATE POLICY "profile_service" ON profile FOR ALL USING (auth.role() = 'service_role');

-- Student: allow public read
DROP POLICY IF EXISTS "student_service" ON student;
CREATE POLICY "student_public_read" ON student FOR SELECT USING (true);
CREATE POLICY "student_service" ON student FOR ALL USING (auth.role() = 'service_role');

-- University: allow public read
DROP POLICY IF EXISTS "university_own" ON university;
DROP POLICY IF EXISTS "university_service" ON university;
CREATE POLICY "university_public_read" ON university FOR SELECT USING (true);
CREATE POLICY "university_service" ON university FOR ALL USING (auth.role() = 'service_role');

-- Course: allow public read
DROP POLICY IF EXISTS "course_read" ON course;
CREATE POLICY "course_public_read" ON course FOR SELECT USING (true);
CREATE POLICY "course_service" ON course FOR ALL USING (auth.role() = 'service_role');

-- Degree: allow public read
DROP POLICY IF EXISTS "degree_read" ON degree;
CREATE POLICY "degree_public_read" ON degree FOR SELECT USING (true);
CREATE POLICY "degree_service" ON degree FOR ALL USING (auth.role() = 'service_role');

-- Application review: allow public read if needed
DROP POLICY IF EXISTS "app_rev_service" ON application_review;
CREATE POLICY "application_review_public_read" ON application_review FOR SELECT USING (true);
CREATE POLICY "app_rev_service" ON application_review FOR ALL USING (auth.role() = 'service_role');
