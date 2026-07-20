import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const query = `
    CREATE OR REPLACE FUNCTION generate_student_code()
    RETURNS TRIGGER AS $$
    DECLARE
        new_code TEXT;
        code_exists BOOLEAN;
        chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        i INTEGER;
    BEGIN
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
  `;

  // Actually, Supabase REST API doesn't support executing arbitrary SQL queries via the JS client
  // unless we use RPC. But we don't have an RPC function to execute raw SQL.
  console.log("Since we cannot run raw SQL directly from JS client without an RPC, the migration file is the best way.");
}

run();
