-- Link offer letters to document templates and store rendered HTML
ALTER TABLE offer_letter
    ADD COLUMN IF NOT EXISTS document_template_id UUID REFERENCES document_template(id),
    ADD COLUMN IF NOT EXISTS body_html TEXT;

CREATE INDEX IF NOT EXISTS offer_letter_document_template_id_idx
    ON offer_letter(document_template_id);
