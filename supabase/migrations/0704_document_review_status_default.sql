-- Set default after enum values are committed (see 0703).

ALTER TABLE public.document_review
    ALTER COLUMN status SET DEFAULT 'PENDING';
