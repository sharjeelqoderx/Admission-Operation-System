-- ============================================================
-- 015_auto_generate_student_code.sql
-- Description: Automatically generate a student code on insert.
-- Format: STU-XXXXXX (where X is a random alphanumeric character)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    -- Loop until we find a unique code
    LOOP
        new_code := 'STU-';
        FOR i IN 1..6 LOOP
            new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;

        SELECT EXISTS(SELECT 1 FROM student WHERE student_code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;

    NEW.student_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_student_code ON student;

CREATE TRIGGER trigger_generate_student_code
BEFORE INSERT OR UPDATE ON student
FOR EACH ROW
WHEN (NEW.student_code IS NULL)
EXECUTE FUNCTION generate_student_code();
