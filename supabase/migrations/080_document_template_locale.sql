-- Template letter language (German or English) for locale-aware merge fields.
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('de', 'en'));

COMMENT ON COLUMN document_template.locale IS
    'Letter language: de = German salutations/dates/checklist, en = English.';
