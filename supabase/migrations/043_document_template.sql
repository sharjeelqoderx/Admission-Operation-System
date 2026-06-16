-- ─── document_template ───────────────────────────────────────
CREATE TABLE document_template (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   TEXT NOT NULL,
    body_html               TEXT NOT NULL DEFAULT '',
    variables               JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by_profile_id   UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_template_created_by_idx ON document_template(created_by_profile_id);
CREATE INDEX document_template_is_deleted_idx ON document_template(is_deleted);

ALTER TABLE document_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_template_select_auth"
    ON document_template FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "document_template_insert_auth"
    ON document_template FOR INSERT
    WITH CHECK (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_update_auth"
    ON document_template FOR UPDATE
    USING (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_delete_auth"
    ON document_template FOR DELETE
    USING (auth.uid() = created_by_profile_id);

CREATE POLICY "document_template_service"
    ON document_template FOR ALL
    USING (auth.role() = 'service_role');
