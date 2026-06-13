-- Link education_type (academic background) to levels for course eligibility filtering

ALTER TABLE education_type
    ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_education_type_level_id ON education_type(level_id);

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Bachelor'
  AND et.name = 'Bachelor''s Degree'
  AND et.level_id IS NULL;

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND et.name IN ('Master''s Degree', 'MPhil')
  AND et.level_id IS NULL;

UPDATE education_type et
SET level_id = l.id
FROM levels l
WHERE l.name = 'Master'
  AND et.name = 'PhD'
  AND et.level_id IS NULL;
