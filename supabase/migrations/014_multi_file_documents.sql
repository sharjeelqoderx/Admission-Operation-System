-- Create document_files table
CREATE TABLE document_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('FRONT', 'BACK')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Apply RLS policies (matching document table access)
CREATE POLICY "doc_files_own"
    ON public.document_files
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM document d
            WHERE d.id = document_files.document_id
            AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM document d
            WHERE d.id = document_files.document_id
            AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

CREATE POLICY "doc_files_service"
    ON public.document_files
    FOR ALL
    USING (auth.role() = 'service_role');

-- Data Migration: Move existing document.url to document_files as 'FRONT'
INSERT INTO document_files (document_id, file_url, type, created_at)
SELECT id, url, 'FRONT', created_at
FROM document
WHERE url IS NOT NULL;

-- Remove old url column from document table
ALTER TABLE document DROP COLUMN url;
