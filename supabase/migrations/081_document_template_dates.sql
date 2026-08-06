-- Configurable letter dates per template (program period, enrollment, visa deadline, etc.)
ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS template_dates jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN document_template.template_dates IS
    'Letter-specific dates: program_period_start/end, classes_start_date, enrollment window, visa_participation_deadline.';
