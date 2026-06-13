-- Convert degree.intake_date from DATE to summer / winter enum

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intake_season_enum') THEN
        CREATE TYPE intake_season_enum AS ENUM ('summer', 'winter');
    END IF;
END $$;

DROP INDEX IF EXISTS idx_degree_intake_date;

ALTER TABLE degree
    ALTER COLUMN intake_date DROP DEFAULT;

ALTER TABLE degree
    ALTER COLUMN intake_date TYPE TEXT
    USING intake_date::TEXT;

ALTER TABLE degree
    ALTER COLUMN intake_date TYPE intake_season_enum
    USING (
        CASE
            WHEN intake_date IS NULL THEN NULL
            WHEN intake_date IN ('summer', 'winter') THEN intake_date::intake_season_enum
            WHEN intake_date ~ '^\d{4}-\d{2}-\d{2}' THEN
                CASE
                    WHEN EXTRACT(MONTH FROM intake_date::DATE) BETWEEN 4 AND 9
                        THEN 'summer'::intake_season_enum
                    ELSE 'winter'::intake_season_enum
                END
            ELSE NULL
        END
    );

CREATE INDEX IF NOT EXISTS idx_degree_intake_date ON degree(intake_date);
