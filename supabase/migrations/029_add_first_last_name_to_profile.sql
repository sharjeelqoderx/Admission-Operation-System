
-- Add first_name and last_name columns to profile table
ALTER TABLE profile
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Populate first_name and last_name from existing name column
-- (Split on first space; if no space, put everything in first_name)
UPDATE profile
SET
    first_name = split_part(name, ' ', 1),
    last_name = CASE WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1) ELSE '' END;

