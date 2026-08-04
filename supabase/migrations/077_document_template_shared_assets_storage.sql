-- Shared template asset library in student-admission/document-template-assets/

DROP POLICY IF EXISTS "document_template_shared_assets_select" ON storage.objects;

CREATE POLICY "document_template_shared_assets_select"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = 'document-template-assets'
);
