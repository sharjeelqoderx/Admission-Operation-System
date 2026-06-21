-- Link course rows to rich program content and support commission on degree
ALTER TABLE degree ADD COLUMN IF NOT EXISTS agent_commission NUMERIC;
ALTER TABLE degree ADD COLUMN IF NOT EXISTS intake_starts_on DATE;

ALTER TABLE course ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES program(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_program_id ON course(program_id);
