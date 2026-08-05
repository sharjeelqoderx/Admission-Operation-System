-- Split single address into street lines + post code

ALTER TABLE student ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE student ADD COLUMN IF NOT EXISTS post_code text;

ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE agent ADD COLUMN IF NOT EXISTS post_code text;

ALTER TABLE university ADD COLUMN IF NOT EXISTS street_1 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS street_2 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS street_3 text;
ALTER TABLE university ADD COLUMN IF NOT EXISTS post_code text;

UPDATE student
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';

UPDATE student
SET post_code = zip_code
WHERE post_code IS NULL AND zip_code IS NOT NULL AND btrim(zip_code) <> '';

UPDATE agent
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';

UPDATE university
SET street_1 = address
WHERE street_1 IS NULL AND address IS NOT NULL AND btrim(address) <> '';
