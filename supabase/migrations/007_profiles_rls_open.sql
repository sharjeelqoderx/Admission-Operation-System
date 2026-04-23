-- ============================================================
-- 007_profiles_rls_open.sql
-- ============================================================

-- Drop ALL existing policies on profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Recreate clean policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = user_id);
