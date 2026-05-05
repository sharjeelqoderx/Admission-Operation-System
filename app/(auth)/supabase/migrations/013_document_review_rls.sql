-- Allow the person who uploaded the document to insert its review
CREATE POLICY "doc_review_insert_by_uploader"
    ON public.document_review
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.document d
            WHERE d.id = document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

-- Allow document owner/uploader to read reviews of their documents
CREATE POLICY "doc_review_select_by_uploader"
    ON public.document_review
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.document d
            WHERE d.id = document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );
