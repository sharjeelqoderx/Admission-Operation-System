-- Deduplicate levels rows (same name + university_id).
-- Keeps the oldest row (created_at, then id) and rewires all FK references.

BEGIN;

CREATE TEMP TABLE tmp_level_duplicates ON COMMIT DROP AS
WITH ranked AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY lower(trim(name)), COALESCE(university_id, '00000000-0000-0000-0000-000000000000'::uuid)
            ORDER BY created_at ASC, id ASC
        ) AS keeper_id
    FROM levels
)
SELECT id AS duplicate_id, keeper_id
FROM ranked
WHERE id <> keeper_id;

-- degree.level_id
UPDATE degree AS d
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE d.level_id = map.duplicate_id;

-- education_type.level_id
UPDATE education_type AS et
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE et.level_id = map.duplicate_id;

-- document_type_level: drop rows that would collide after merge
DELETE FROM document_type_level AS dtl_dup
USING tmp_level_duplicates AS map, document_type_level AS dtl_keep
WHERE dtl_dup.level_id = map.duplicate_id
  AND dtl_keep.level_id = map.keeper_id
  AND dtl_dup.document_type_id = dtl_keep.document_type_id;

UPDATE document_type_level AS dtl
SET level_id = map.keeper_id
FROM tmp_level_duplicates AS map
WHERE dtl.level_id = map.duplicate_id;

DELETE FROM levels AS l
USING tmp_level_duplicates AS map
WHERE l.id = map.duplicate_id;

-- Prevent future duplicates for the same university scope (NULL university_id included).
CREATE UNIQUE INDEX IF NOT EXISTS idx_levels_name_university_unique
    ON levels (
        lower(trim(name)),
        COALESCE(university_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

COMMIT;
