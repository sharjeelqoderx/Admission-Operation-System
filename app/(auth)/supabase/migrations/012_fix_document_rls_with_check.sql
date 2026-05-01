-- document: INSERT requires WITH CHECK (otherwise "new row violates RLS")
DROP POLICY IF EXISTS "doc_own" ON public.document;
CREATE POLICY "doc_own"
    ON public.document
    FOR ALL
    USING (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid() OR uploaded_by_profile_id = auth.uid());

