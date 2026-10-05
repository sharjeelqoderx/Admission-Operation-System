-- Ensure students can insert/update their own student row during onboarding.
-- Upsert requires both USING and WITH CHECK (same pattern as agent_manage_own).

DROP POLICY IF EXISTS "student_manage_own" ON public.student;
CREATE POLICY "student_manage_own"
    ON public.student
    FOR ALL
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "student_own" ON public.student;
CREATE POLICY "student_own"
    ON public.student
    FOR ALL
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());
