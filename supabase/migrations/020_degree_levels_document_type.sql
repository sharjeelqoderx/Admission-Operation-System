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
