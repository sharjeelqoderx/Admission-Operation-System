-- State / province (separate from city)
ALTER TABLE student ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS state text;
