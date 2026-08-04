-- Allow document template image uploads in student-admission storage.
-- Path pattern: {profile_id}/document-templates/{hash}.{ext}

DROP POLICY IF EXISTS "document_template_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "document_template_images_update" ON storage.objects;
DROP POLICY IF EXISTS "document_template_images_select" ON storage.objects;

CREATE POLICY "document_template_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
);

CREATE POLICY "document_template_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
)
WITH CHECK (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'document-templates'
    AND public.current_profile_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'AGENT')
);

CREATE POLICY "document_template_images_select"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'student-admission'
    AND (storage.foldername(name))[2] = 'document-templates'
);
