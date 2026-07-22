-- Application review workflow RLS:
-- - SUPER_ADMIN can review/update any application
-- - ADMIN / MANAGEMENT can review/update applications for their university scope
-- - Students/agents can resubmit rejected applications (audit row + status reset)

CREATE INDEX IF NOT EXISTS idx_application_review_application_created
    ON public.application_review (application_id, created_at DESC);

-- ─── application_review INSERT ───────────────────────────────

DROP POLICY IF EXISTS "application_review_insert_super_admin" ON public.application_review;
CREATE POLICY "application_review_insert_super_admin"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "application_review_insert_university_staff" ON public.application_review;
CREATE POLICY "application_review_insert_university_staff"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_university_role()
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND a.university_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "application_review_insert_resubmit_participant" ON public.application_review;
CREATE POLICY "application_review_insert_resubmit_participant"
    ON public.application_review
    FOR INSERT
    TO authenticated
    WITH CHECK (
        application_review.status = 'PENDING'
        AND EXISTS (
            SELECT 1
            FROM public.application AS a
            WHERE a.id = application_review.application_id
              AND a.status IN ('REJECTED', 'NEEDS_REVISION')
              AND (
                  a.profile_id = auth.uid()
                  OR a.submitted_by_profile_id = auth.uid()
              )
        )
    );

-- ─── application UPDATE ──────────────────────────────────────

DROP POLICY IF EXISTS "application_update_super_admin" ON public.application;
CREATE POLICY "application_update_super_admin"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profile AS p
            WHERE p.id = auth.uid()
              AND p.role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "application_update_university_staff" ON public.application;
CREATE POLICY "application_update_university_staff"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        public.is_university_role()
        AND university_id = auth.uid()
    )
    WITH CHECK (
        public.is_university_role()
        AND university_id = auth.uid()
    );

DROP POLICY IF EXISTS "application_update_resubmit_participant" ON public.application;
CREATE POLICY "application_update_resubmit_participant"
    ON public.application
    FOR UPDATE
    TO authenticated
    USING (
        status IN ('REJECTED', 'NEEDS_REVISION')
        AND (
            profile_id = auth.uid()
            OR submitted_by_profile_id = auth.uid()
        )
    )
    WITH CHECK (
        status = 'PENDING'
        AND (
            profile_id = auth.uid()
            OR submitted_by_profile_id = auth.uid()
        )
    );
