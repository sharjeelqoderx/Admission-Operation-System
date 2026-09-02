-- Backfill university_id on platform document types (admin university profile from seed 002)
UPDATE public.document_type
SET university_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE university_id IS NULL;
