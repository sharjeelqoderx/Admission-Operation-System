-- Checklist profile per document template (4 / 5 / 6 item layouts).

ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS checklist_profile TEXT;

-- Offer-linked templates (international 4-item).
UPDATE document_template dt
SET
    checklist_profile = 'international_four',
    checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = 'd310476a-c64a-4361-a422-bf144908ae40';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
WHERE id = 'd310476a-c64a-4361-a422-bf144908ae40';

-- Full 6-item checklist.
UPDATE document_template dt
SET
    checklist_profile = 'full_six',
    checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = '51963d75-a02b-44af-9f7b-45179a555462';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
WHERE id = '51963d75-a02b-44af-9f7b-45179a555462';

-- Studienkolleg 5-item checklist.
UPDATE document_template dt
SET
    checklist_profile = 'studienkolleg_five',
    checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id = '3611b909-124c-485a-93d1-bde033469e1c';

UPDATE offer_letter
SET checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
WHERE id = '3611b909-124c-485a-93d1-bde033469e1c';
