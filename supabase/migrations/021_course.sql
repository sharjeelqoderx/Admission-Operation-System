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
