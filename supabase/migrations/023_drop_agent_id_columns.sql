-- Remove redundant ID card URL columns from agent (KYC files live in document/document_files)
ALTER TABLE agent DROP COLUMN IF EXISTS id_front;
ALTER TABLE agent DROP COLUMN IF EXISTS id_back;
