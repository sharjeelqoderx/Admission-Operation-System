-- Checklist configuration per document template and snapshot per offer letter.

ALTER TABLE document_template
    ADD COLUMN IF NOT EXISTS checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE offer_letter
    ADD COLUMN IF NOT EXISTS checklist_items JSONB,
    ADD COLUMN IF NOT EXISTS checklist_proofs JSONB;

-- Offer: international 4-item checklist (German + English sections in template).
UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","aps_examination","english_b2"]'::jsonb
WHERE id = 'd310476a-c64a-4361-a422-bf144908ae40';

-- Offer: full 6-item checklist.
UPDATE offer_letter
SET checklist_items = '["tuition_payment","bachelor_authentication","entrance_qualification","aps_examination","work_experience","english_b2"]'::jsonb
WHERE id = '51963d75-a02b-44af-9f7b-45179a555462';

-- Offer: studienkolleg-style 5-item checklist.
UPDATE offer_letter
SET checklist_items = '["tuition_payment","entrance_qualification","aps_examination","english_b2","secondary_school"]'::jsonb
WHERE id = '3611b909-124c-485a-93d1-bde033469e1c';

-- Keep document templates aligned with their linked offers.
UPDATE document_template dt
SET checklist_items = ol.checklist_items
FROM offer_letter ol
WHERE ol.document_template_id = dt.id
  AND ol.id IN (
      'd310476a-c64a-4361-a422-bf144908ae40',
      '51963d75-a02b-44af-9f7b-45179a555462',
      '3611b909-124c-485a-93d1-bde033469e1c'
  );
