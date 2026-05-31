-- ============================================================
-- 026_course_degree_requirements_seed.sql
-- 1. Link course → exact degree row (name + credits + location + language + duration)
-- 2. Seed degree_requirement (degree_id + document_type_id)
-- ============================================================

-- ─── Resolve degree rows by business key ─────────────────────

CREATE TEMP TABLE tmp_degree_key ON COMMIT DROP AS
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
ORDER BY t.degree_key, d.id;


-- ─── 1. Update course.degree_id ──────────────────────────────

UPDATE course c
SET degree_id = dk.degree_id
FROM (VALUES
    ('Master of science (M.Sc. ITTM) International Technology Transfer Management', 'msc_berlin_en_2y', 0),
    ('Master of Business Administration (MBA): General Technology Management Automotive and Mobility Management', 'mba_berlin', 0),
    ('Master of Business Administration (MBA): General Technology Management Data Science', 'mba_berlin', 0),
    ('Master of Business Administration (MBA): General Technology Management Environment and Energy Management', 'mba_berlin', 0),
    ('MA International Management', 'ma_berlin_eglish_2y', 0),
    ('MA Sustainability and Climate Management', 'msc_berlin_eglish_3y', 0),
    ('Msc Digital Transformation Management', 'msc_duren_90_18m', 0),
    ('Msc AI and Data Science Management', 'msc_duren_120_2y_typo', 0),
    ('Msc Finance and Fintech', 'msc_duren_120_2y', 0),
    ('Master of Arts (M.A.) Global SMEs', 'ma_berlin_en_2y', 0),
    ('B.Eng. Management & Technology Mechanical Engineering', 'beng_koln', 0),
    ('B.Eng. Management & Technology Energy and Environment Engineering', 'beng_koln', 0),
    ('B.A. Digital Business Management', 'ba_duren', 0),
    ('B.A. Marketing Management', 'ba_koln', 0),
    ('Pre-Studies Program (PSP) – English T-course for technical studies, W-course for business studies', 'studienkolleg_en', 0),
    ('Pre-Studies Program (PSP) – German Taught T-course for technical studies, W-course for business studies', 'studienkolleg_de', 0),
    ('BA International Business Administration', 'ba_berlin_en', 0),
    ('BA Sports Management', 'ba_berlin_eglish', 0),
    ('BA Artificial intelligence', 'ba_duren_eglish', 0),
    ('Uniperp + Bsc Physiotherapy', 'bsc_waldshut_210_45', 0),
    ('Uniperp + Bsc Occupational Therapy', 'bsc_waldshut_210_45', 0),
    ('Uniperp + BSc Care and Management', 'bsc_waldshut_210_45', 0),
    ('Uniperp + BSc Care and Management', 'bsc_waldshut_210_3y', 1),
    ('Uniperp + Bsc Physician Asssitant', 'bsc_waldshut_240_3y', 0)
) AS m(course_name, degree_key, name_offset)
JOIN tmp_degree_key dk ON dk.degree_key = m.degree_key
WHERE c.id = (
    SELECT id
    FROM course
    WHERE name = m.course_name
    ORDER BY id
    LIMIT 1 OFFSET m.name_offset
);


-- ─── 2. Seed degree_requirement ──────────────────────────────

CREATE TEMP TABLE tmp_req_set ON COMMIT DROP AS
SELECT * FROM (VALUES
    ('master_std',       ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('mba',              ARRAY['CV','BD_AD_DEGREE','BD_AD_TRANSCRIPT','PASSPORT','LANGUAGE_SCORE','WORK_EXP_LETTER']::TEXT[]),
    ('bachelor_std',     ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('studienkolleg_en', ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('studienkolleg_de', ARRAY['CV','BD_AD_DEGREE','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('uniperp_std',      ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE']::TEXT[]),
    ('uniperp_nursing',  ARRAY['CV','SSC_MARKSHEET','HSC_UGD_MARKSHEET','PASSPORT','LANGUAGE_SCORE','BD_AD_DEGREE','WORK_EXP_LETTER']::TEXT[])
) AS t(set_name, doc_codes);

CREATE TEMP TABLE tmp_degree_req_map ON COMMIT DROP AS
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
) AS t(degree_key, req_set);

INSERT INTO degree_requirement (degree_id, document_type_id)
SELECT DISTINCT dk.degree_id, dt.id
FROM tmp_degree_req_map drm
JOIN tmp_degree_key dk ON dk.degree_key = drm.degree_key
JOIN tmp_req_set rs ON rs.set_name = drm.req_set
CROSS JOIN LATERAL unnest(rs.doc_codes) AS doc_code(code)
JOIN document_type dt ON dt.code = doc_code.code
ON CONFLICT (degree_id, document_type_id) DO NOTHING;
