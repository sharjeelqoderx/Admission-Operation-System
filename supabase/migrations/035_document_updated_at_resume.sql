-- 035_document_updated_at_resume.sql
-- 1. Ensure updated_at trigger exists on document table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_document_updated_at'
    ) THEN
        CREATE TRIGGER trg_document_updated_at
            BEFORE UPDATE ON document
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- 2. Seed Resume document type (if not exists)
INSERT INTO document_type (name, code, type, description, is_active, may_expire, university_id)
SELECT 'Resume', 'RESUME', 'Professional', 'Your latest resume summarizing education and experience', true, false, '00000000-0000-0000-0000-000000000002'::UUID
WHERE NOT EXISTS (SELECT 1 FROM document_type WHERE code = 'RESUME');
