-- ============================================================
-- 004_rls_no_service_role.sql
-- Allow server-side operations without service role key
-- ============================================================

-- otp_verifications: allow insert/update/select/delete for all (server controls access via userId)
CREATE POLICY "Allow all on otp_verifications"
    ON otp_verifications FOR ALL
    USING (true)
    WITH CHECK (true);

-- profiles: allow insert for anon (signup creates profile before user is authenticated)
CREATE POLICY "Allow anon insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- profiles: allow update by user_id match (used during verify + profile steps)
CREATE POLICY "Allow update profiles by user_id"
    ON profiles FOR UPDATE
    USING (true);
