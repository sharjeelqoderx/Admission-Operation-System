-- Allow document owners/uploaders to create initial review rows during onboarding
-- and document uploads (policy existed in legacy migrations but was never applied here).

DROP POLICY IF EXISTS "doc_review_insert_by_uploader" ON public.document_review;
CREATE POLICY "doc_review_insert_by_uploader"
    ON public.document_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.document AS d
            WHERE d.id = document_review.document_id
              AND (d.profile_id = auth.uid() OR d.uploaded_by_profile_id = auth.uid())
        )
    );

-- Ensure agents can insert/update their own row during onboarding (WITH CHECK required for upsert).
DROP POLICY IF EXISTS "agent_manage_own" ON public.agent;
CREATE POLICY "agent_manage_own"
    ON public.agent
    FOR ALL
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
