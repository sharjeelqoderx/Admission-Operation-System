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
