-- Template asset library: media bucket / assets folder (public read for embedded images)

DROP POLICY IF EXISTS "media_template_assets_select" ON storage.objects;

CREATE POLICY "media_template_assets_select"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'assets'
);
