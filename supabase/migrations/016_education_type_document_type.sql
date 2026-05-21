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
