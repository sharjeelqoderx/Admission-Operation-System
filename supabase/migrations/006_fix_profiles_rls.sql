-- ============================================================
-- 006_fix_profiles_rls.sql
-- Allow anon/authenticated to insert and upsert profiles
-- ============================================================

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Allow anon insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow update profiles by user_id" ON profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;

-- Allow anyone to insert (signup creates profile before session exists)
CREATE POLICY "Allow insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow authenticated update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow authenticated users to select their own profile
CREATE POLICY "Allow authenticated select own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);
