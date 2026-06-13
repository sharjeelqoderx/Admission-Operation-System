-- 036_document_note.sql
-- Add nullable note column to document table
ALTER TABLE document ADD COLUMN IF NOT EXISTS note TEXT NULL;
