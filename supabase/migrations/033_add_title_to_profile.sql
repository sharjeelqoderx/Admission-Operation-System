-- Add title column to profile table (Mr/Mrs)
ALTER TABLE profile
ADD COLUMN IF NOT EXISTS title TEXT;
