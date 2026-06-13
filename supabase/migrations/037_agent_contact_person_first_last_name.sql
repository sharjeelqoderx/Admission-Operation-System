-- Split agent.contact_person_name into first_name and last_name

ALTER TABLE agent
ADD COLUMN IF NOT EXISTS contact_person_first_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_last_name TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'agent'
          AND column_name = 'contact_person_name'
    ) THEN
        UPDATE agent
        SET
            contact_person_first_name = COALESCE(
                NULLIF(contact_person_first_name, ''),
                split_part(contact_person_name, ' ', 1)
            ),
            contact_person_last_name = COALESCE(
                NULLIF(contact_person_last_name, ''),
                CASE
                    WHEN position(' ' in contact_person_name) > 0
                    THEN substring(contact_person_name from position(' ' in contact_person_name) + 1)
                    ELSE ''
                END
            )
        WHERE contact_person_name IS NOT NULL;

        ALTER TABLE agent DROP COLUMN contact_person_name;
    END IF;
END $$;
