-- ============================================================
-- 052_degree_requirement_type.sql
-- Add REQUIRED / OPTIONAL to degree_requirement (course path via degree)
-- ============================================================

DO $$ BEGIN
    CREATE TYPE document_requirement_type_enum AS ENUM ('REQUIRED', 'OPTIONAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE degree_requirement
    ADD COLUMN IF NOT EXISTS requirement_type document_requirement_type_enum NOT NULL DEFAULT 'REQUIRED';

-- Default everything to OPTIONAL, then mark the first two document codes per
-- requirement set as REQUIRED (matches prior UI: first 2 docs required).
UPDATE degree_requirement
SET requirement_type = 'OPTIONAL';

WITH req_sets AS (
    SELECT * FROM (VALUES
        ('master_std',       ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('mba',              ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE','WORK_EXP_LETTER']::TEXT[]),
        ('bachelor_std',     ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('studienkolleg_en', ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('studienkolleg_de', ARRAY['CV','BD_AD_DEGREE','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('uniperp_std',      ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
        ('uniperp_nursing',  ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE','BD_AD_DEGREE','WORK_EXP_LETTER']::TEXT[])
    ) AS t(set_name, doc_codes)
),
required_codes AS (
    SELECT set_name, doc_codes[1] AS code FROM req_sets
    UNION
    SELECT set_name, doc_codes[2] AS code FROM req_sets
),
degree_req_map AS (
    SELECT * FROM (VALUES
        ('msc_berlin_en_2y',      'master_std'),
        ('mba_berlin',            'mba'),
        ('ma_berlin_eglish_2y',   'master_std'),
        ('ma_berlin_en_2y',       'master_std'),
        ('msc_berlin_eglish_3y',  'master_std'),
        ('msc_duren_90_18m',      'master_std'),
        ('msc_duren_120_2y_typo', 'master_std'),
        ('msc_duren_120_2y',      'master_std'),
        ('beng_koln',             'bachelor_std'),
        ('ba_duren',              'bachelor_std'),
        ('ba_koln',               'bachelor_std'),
        ('studienkolleg_en',      'studienkolleg_en'),
        ('studienkolleg_de',      'studienkolleg_de'),
        ('ba_berlin_en',          'bachelor_std'),
        ('ba_berlin_eglish',      'bachelor_std'),
        ('ba_duren_eglish',       'bachelor_std'),
        ('bsc_waldshut_210_45',   'uniperp_std'),
        ('bsc_waldshut_210_3y',   'uniperp_nursing'),
        ('bsc_waldshut_240_3y',   'uniperp_nursing')
    ) AS t(degree_key, req_set)
),
degree_keys AS (
    SELECT DISTINCT ON (t.degree_key)
        t.degree_key,
        d.id AS degree_id
    FROM (VALUES
        ('msc_berlin_en_2y',       'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%English%', '%2%Year%'),
        ('mba_berlin',             'Master of Business Administration (MBA)',            90,  '%Berlin%',  '%English%', '%18%Month%'),
        ('ma_berlin_eglish_2y',    'Master of Arts (MA)',                                120, '%Berlin%',  '%Eglish%',  '%2%year%'),
        ('ma_berlin_en_2y',        'Master of Arts (MA)',                                120, '%Berlin%',  '%English%', '%2%Year%'),
        ('msc_berlin_eglish_3y',   'Master of Science (M. Sc.)',                         120, '%Berlin%',  '%Eglish%',  '%3%year%'),
        ('msc_duren_90_18m',       'Master of Science (M. Sc.)',                         90,  '%Duren%',   '%Eglish%',  '%18%Minth%'),
        ('msc_duren_120_2y_typo',  'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%yaer%'),
        ('msc_duren_120_2y',       'Master of Science (M. Sc.)',                         120, '%Duren%',   '%Eglish%',  '%2%year%'),
        ('beng_koln',              'Bachelor of Engg',                                   180, '%Köln%',    '%English%', '%3%year%'),
        ('ba_duren',               'Bachelor of Arts (B.A.)',                            180, '%Düren%',   '%English%', '%3%year%'),
        ('ba_koln',                'Bachelor of Arts (B.A.)',                            180, '%Koln%',    '%English%', '%3%year%'),
        ('studienkolleg_en',       'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%English%', '%12%month%'),
        ('studienkolleg_de',       'Studienkolleg',                                      NULL::INTEGER, '%Bielefeld%', '%German%',  '%12%month%'),
        ('ba_berlin_en',           'Bachelor of Arts (B.A.)',                            180, '%berlin%',  '%English%', '%3%year%'),
        ('ba_berlin_eglish',       'Bachelor of Arts (B.A.)',                            180, '%Berlin%',  '%Eglish%',  '%3%year%'),
        ('ba_duren_eglish',        'Bachelor of Arts (B.A.)',                            180, '%Duren%',   '%Eglish%',  '%3%year%'),
        ('bsc_waldshut_210_45',    'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%4.5%'),
        ('bsc_waldshut_210_3y',    'Bachelor of Science',                                210, '%Waldshut%','%German%',  '%3%year%'),
        ('bsc_waldshut_240_3y',    'Bachelor of Science',                                240, '%Waldshut%','%German%',  '%3%year%')
    ) AS t(degree_key, deg_name, credits, location_like, language_like, duration_like)
    JOIN degree d
        ON d.name = t.deg_name
       AND d.credits IS NOT DISTINCT FROM t.credits
       AND d.location ILIKE t.location_like
       AND d.language_of_study ILIKE t.language_like
       AND d.duration ILIKE t.duration_like
    ORDER BY t.degree_key, d.id
),
required_pairs AS (
    SELECT DISTINCT dk.degree_id, dt.id AS document_type_id
    FROM degree_req_map drm
    JOIN degree_keys dk ON dk.degree_key = drm.degree_key
    JOIN required_codes rc ON rc.set_name = drm.req_set
    JOIN document_type dt ON dt.code = rc.code
)
UPDATE degree_requirement dr
SET requirement_type = 'REQUIRED'
FROM required_pairs rp
WHERE dr.degree_id = rp.degree_id
  AND dr.document_type_id = rp.document_type_id;
