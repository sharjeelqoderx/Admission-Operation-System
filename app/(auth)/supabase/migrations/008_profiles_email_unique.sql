-- ============================================================
-- 008_profiles_email_unique.sql
-- Add unique constraint on email column (existing data preserved)
-- ============================================================

ALTER TABLE profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);
