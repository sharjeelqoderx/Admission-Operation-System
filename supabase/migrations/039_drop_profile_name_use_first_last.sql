-- Backfill first_name / last_name from legacy name column, then drop name

ALTER TABLE profile
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE profile
SET
    first_name = COALESCE(
        NULLIF(first_name, ''),
        split_part(name, ' ', 1)
    ),
    last_name = COALESCE(
        NULLIF(last_name, ''),
        CASE
            WHEN position(' ' in name) > 0
            THEN substring(name from position(' ' in name) + 1)
            ELSE ''
        END
    )
WHERE name IS NOT NULL;

ALTER TABLE profile DROP COLUMN IF EXISTS name;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profile (id, first_name, last_name, title, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'title',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
