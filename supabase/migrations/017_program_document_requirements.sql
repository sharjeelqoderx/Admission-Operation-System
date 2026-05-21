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
