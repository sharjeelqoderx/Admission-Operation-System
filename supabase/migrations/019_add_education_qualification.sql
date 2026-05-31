-- Agent/student forms store free-text qualification per education row (migration 016 dropped this column).
ALTER TABLE education ADD COLUMN IF NOT EXISTS qualification TEXT;
