-- Add first_name and last_name columns to profile table (renamed from duplicate 029)
ALTER TABLE profile
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Populate first_name and last_name from existing name column when empty
UPDATE profile
SET
    first_name = split_part(name, ' ', 1),
    last_name = CASE WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1) ELSE '' END
WHERE first_name IS NULL OR first_name = '';
