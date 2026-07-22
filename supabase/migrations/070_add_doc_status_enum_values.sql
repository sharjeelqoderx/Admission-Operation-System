-- Align doc_status_enum with application expectations (PENDING, VERIFIED, ACTION_REQUIRED).

ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'VERIFIED';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.doc_status_enum ADD VALUE IF NOT EXISTS 'ACTION_REQUIRED';

ALTER TABLE public.document_review
    ALTER COLUMN status SET DEFAULT 'PENDING';
