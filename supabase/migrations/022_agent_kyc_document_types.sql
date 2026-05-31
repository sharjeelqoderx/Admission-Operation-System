-- Agent onboarding KYC document types (replaces removed CNIC type)
INSERT INTO document_type (name, code, type, description, is_active, may_expire, university_id)
SELECT name, code, type, description, is_active, may_expire, '00000000-0000-0000-0000-000000000002'::UUID
FROM (VALUES
    ('Agent Registration Certificate', 'AGENT_REGISTRATION', 'Identity', 'Agent agency registration certificate', true, false),
    ('Agent ID Card Front',          'AGENT_ID_FRONT',     'Identity', 'Agent ID card front side',          true, false),
    ('Agent ID Card Back',           'AGENT_ID_BACK',      'Identity', 'Agent ID card back side',           true, false)
) AS t(name, code, type, description, is_active, may_expire)
ON CONFLICT (code) DO UPDATE SET
    name        = EXCLUDED.name,
    type        = EXCLUDED.type,
    description = EXCLUDED.description,
    is_active   = EXCLUDED.is_active,
    may_expire  = EXCLUDED.may_expire;
