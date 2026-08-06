ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS watermark jsonb NOT NULL DEFAULT '{"enabled":true,"image_url":null,"opacity":0.12,"size_px":500}'::jsonb;

COMMENT ON COLUMN document_template.watermark IS
    'Page watermark: enabled, image_url, opacity (0-1), size_px.';
