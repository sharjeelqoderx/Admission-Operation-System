-- Auto-create role-specific rows on signup (profile alone is not enough for Agent APIs)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_role role_enum;
BEGIN
  new_role := COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'STUDENT');

  INSERT INTO profile (id, first_name, last_name, title, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'title',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    new_role
  )
  ON CONFLICT (id) DO NOTHING;

  IF new_role = 'AGENT' THEN
    INSERT INTO agent (id, profile_id)
    VALUES (NEW.id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF new_role = 'STUDENT' THEN
    INSERT INTO student (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF new_role = 'UNIVERSITY' THEN
    INSERT INTO university (id, profile_id)
    VALUES (NEW.id, NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill missing agent rows for existing AGENT profiles
INSERT INTO agent (id, profile_id)
SELECT p.id, p.id
FROM profile p
WHERE p.role = 'AGENT'
  AND NOT EXISTS (
    SELECT 1 FROM agent a WHERE a.profile_id = p.id
  )
ON CONFLICT (profile_id) DO NOTHING;
