-- Link degree to academic level (Bachelor, Foundation, Master, MBA)

ALTER TABLE degree
    ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_degree_level_id ON degree(level_id);

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'MBA'
  AND d.name ILIKE '%Master of Business Administration%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND d.level_id IS NULL
  AND d.name ILIKE '%Master%'
  AND d.name NOT ILIKE '%Business Administration%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Foundation'
  AND d.name ILIKE '%Studienkolleg%';

UPDATE degree d
SET level_id = l.id
FROM levels l
WHERE l.name = 'Bachelor'
  AND d.level_id IS NULL
  AND (
      d.name ILIKE '%Bachelor%'
      OR d.name ILIKE '%B.Eng%'
      OR d.name ILIKE '%B.A%'
  );
