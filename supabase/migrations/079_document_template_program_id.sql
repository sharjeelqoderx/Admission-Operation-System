-- Link each offer document template to exactly one program (1:1).
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES program(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS document_template_program_id_unique_idx
    ON document_template(program_id)
    WHERE program_id IS NOT NULL AND is_deleted = false;

CREATE INDEX IF NOT EXISTS document_template_program_id_idx
    ON document_template(program_id);
