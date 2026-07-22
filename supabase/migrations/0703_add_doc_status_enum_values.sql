-- Align doc_status_enum with application expectations (PENDING, VERIFIED, ACTION_REQUIRED).
-- Default is set in the following migration (enum values must commit before use).

ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'ACTION_REQUIRED';
