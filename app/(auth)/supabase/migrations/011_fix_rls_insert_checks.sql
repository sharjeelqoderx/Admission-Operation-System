-- Fix RLS policies for INSERT/UPSERT (WITH CHECK required)

-- student
DROP POLICY IF EXISTS "student_own" ON public.student;
CREATE POLICY "student_own"
    ON public.student
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- education
DROP POLICY IF EXISTS "education_own" ON public.education;
CREATE POLICY "education_own"
    ON public.education
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- work_experience
DROP POLICY IF EXISTS "work_exp_own" ON public.work_experience;
CREATE POLICY "work_exp_own"
    ON public.work_experience
    FOR ALL
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

