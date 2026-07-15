-- Fix infinite RLS recursion on profile reads.
-- Cycle was: profile -> profile_select_agent -> agent -> agent_university_read -> profile

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profile
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO service_role;

-- Recreate university-read policies without nested profile RLS

DROP POLICY IF EXISTS "agent_university_read" ON agent;
CREATE POLICY "agent_university_read"
    ON agent
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_university_read" ON document;
CREATE POLICY "document_university_read"
    ON document
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_review_university_read" ON document_review;
CREATE POLICY "document_review_university_read"
    ON document_review
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

DROP POLICY IF EXISTS "document_files_university_read" ON document_files;
CREATE POLICY "document_files_university_read"
    ON document_files
    FOR SELECT
    USING (public.current_profile_role() = 'UNIVERSITY');

-- Ensure own profile is always readable
DROP POLICY IF EXISTS "profile_select_own" ON profile;
CREATE POLICY "profile_select_own"
    ON profile
    FOR SELECT
    USING (auth.uid() = id);
