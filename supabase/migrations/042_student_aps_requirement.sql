-- APS certificate required for students from Pakistan, Vietnam, India, and China.
ALTER TABLE student
    ADD COLUMN IF NOT EXISTS aps_requirement BOOLEAN NOT NULL DEFAULT false;

UPDATE student
SET aps_requirement = true
WHERE country IS NOT NULL
  AND lower(trim(country)) IN ('pakistan', 'vietnam', 'india', 'china');
