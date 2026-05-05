-- Drop old doc_status_enum and recreate with new values
-- First update existing rows to a safe value
UPDATE public.document_review SET status = 'PENDING' WHERE status IN ('APPROVED', 'NEEDS_REVISION');

-- Alter enum: add new values
ALTER TYPE doc_status_enum ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE doc_status_enum ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE doc_status_enum ADD VALUE IF NOT EXISTS 'ACTION_REQUIRED';
-- 'REJECTED' already exists, no need to add

-- Update default on document_review table
ALTER TABLE public.document_review ALTER COLUMN status SET DEFAULT 'PENDING';
