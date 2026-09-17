-- Dashboard list RPC functions: move joins, filtering, pagination, and aggregates to PostgreSQL.

-- ─── Shared helpers ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.resolve_pipeline_status(
    p_app_status text,
    p_offer_status text,
    p_has_offer boolean
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT CASE
        WHEN p_app_status = 'REJECTED' THEN 'Rejected'
        WHEN p_app_status = 'APPROVED' THEN 'Completed'
        WHEN p_offer_status = 'ACCEPTED' THEN 'Signed'
        WHEN p_has_offer OR p_offer_status = 'PENDING' THEN 'Contract Sent'
        ELSE 'Created'
    END;
$$;

CREATE OR REPLACE FUNCTION public.pipeline_status_slug(p_pipeline_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT lower(regexp_replace(trim(coalesce(p_pipeline_status, '')), '\s+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.format_dashboard_date(p_value timestamptz)
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN p_value IS NULL THEN NULL
        ELSE to_char(p_value AT TIME ZONE 'UTC', 'Mon DD, YYYY')
    END;
$$;

CREATE OR REPLACE FUNCTION public.format_intake_label(
    p_intake_starts_on date,
    p_intake_date text,
    p_custom_intake date DEFAULT NULL
)
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT CASE
        WHEN p_custom_intake IS NOT NULL THEN
            to_char(p_custom_intake, 'FMMonth YYYY')
        WHEN p_intake_starts_on IS NOT NULL THEN
            to_char(p_intake_starts_on, 'FMMonth YYYY')
        WHEN p_intake_date IS NOT NULL AND lower(trim(p_intake_date)) IN ('summer', 'winter') THEN
            upper(trim(p_intake_date)) || ' Intake'
        WHEN p_intake_date IS NOT NULL THEN
            upper(trim(p_intake_date)) || ' Intake'
        ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.matches_university_scope(
    p_university_id uuid,
    p_scope_ids uuid[]
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT p_scope_ids IS NULL OR p_university_id = ANY(p_scope_ids);
$$;

CREATE OR REPLACE FUNCTION public.application_matches_tab(
    p_tab text,
    p_pipeline_status text,
    p_app_status text,
    p_updated_at timestamptz,
    p_offer_accepted_at timestamptz,
    p_offer_created_at timestamptz,
    p_is_deferred boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT CASE lower(trim(coalesce(p_tab, 'all')))
        WHEN 'defer-intake' THEN coalesce(p_is_deferred, false)
        WHEN 'pending-review' THEN p_app_status = 'PENDING' AND p_pipeline_status = 'Created'
        WHEN 'awaiting-signature' THEN p_pipeline_status = 'Contract Sent'
        WHEN 'recently-completed' THEN
            p_pipeline_status IN ('Completed', 'Signed')
            AND coalesce(p_offer_accepted_at, p_offer_created_at, p_updated_at)
                >= (now() - interval '90 days')
        WHEN 'rejected' THEN p_app_status = 'REJECTED'
        ELSE true
    END;
$$;

-- ─── University student list ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_university_students_list(
    p_university_ids uuid[] DEFAULT NULL,
    p_search text DEFAULT '',
    p_status text DEFAULT 'all',
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_status text := lower(trim(coalesce(p_status, 'all')));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total integer;
    v_total_pages integer;
    v_stats jsonb;
    v_data jsonb;
BEGIN
    WITH all_students AS (
        SELECT
            s.profile_id,
            s.student_code,
            s.created_at,
            trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))) AS name
        FROM student s
        INNER JOIN profile p ON p.id = s.profile_id
        WHERE p.role = 'STUDENT'
    ),
    ranked_apps AS (
        SELECT
            a.id AS application_id,
            a.profile_id,
            a.status AS app_status,
            a.created_at AS app_created_at,
            a.submitted_by_profile_id,
            a.university_id,
            a.course_id,
            ROW_NUMBER() OVER (
                PARTITION BY a.profile_id
                ORDER BY
                    CASE
                        WHEN p_university_ids IS NOT NULL
                            AND cardinality(p_university_ids) = 1
                            AND a.university_id = p_university_ids[1]
                        THEN 0
                        WHEN p_university_ids IS NOT NULL
                            AND a.university_id = ANY(p_university_ids)
                        THEN 0
                        ELSE 1
                    END,
                    a.created_at DESC
            ) AS rn
        FROM application a
    ),
    primary_apps AS (
        SELECT * FROM ranked_apps WHERE rn = 1
    ),
    with_offers AS (
        SELECT
            pa.*,
            ol.status AS offer_status,
            ol.id IS NOT NULL AS has_offer
        FROM primary_apps pa
        LEFT JOIN LATERAL (
            SELECT o.status, o.id
            FROM offer_letter o
            WHERE o.application_id = pa.application_id
            ORDER BY o.created_at DESC
            LIMIT 1
        ) ol ON true
    ),
    enriched AS (
        SELECT
            st.profile_id,
            st.student_code,
            st.name,
            st.created_at AS student_created_at,
            wo.application_id,
            wo.app_status,
            wo.app_created_at,
            wo.submitted_by_profile_id,
            wo.offer_status,
            wo.has_offer,
            coalesce(d.name, c.name) AS program_name,
            CASE
                WHEN d.intake_date IS NOT NULL THEN upper(d.intake_date::text) || ' Intake'
                ELSE NULL
            END AS intake_label,
            public.resolve_pipeline_status(
                wo.app_status::text,
                wo.offer_status::text,
                wo.has_offer
            ) AS pipeline_status,
            CASE
                WHEN wo.submitted_by_profile_id IS NOT NULL
                    AND wo.submitted_by_profile_id <> st.profile_id
                THEN 'University Partner'
                ELSE 'Direct'
            END AS applied_through,
            public.format_dashboard_date(wo.app_created_at) AS submission_date
        FROM all_students st
        LEFT JOIN with_offers wo ON wo.profile_id = st.profile_id
        LEFT JOIN course c ON c.id = wo.course_id
        LEFT JOIN degree d ON d.id = c.degree_id
    ),
    application_stats AS (
        SELECT
            count(DISTINCT a.profile_id) AS applied_count,
            count(DISTINCT CASE
                WHEN a.status = 'APPROVED'
                    OR EXISTS (
                        SELECT 1
                        FROM offer_letter ol
                        WHERE ol.application_id = a.id
                          AND ol.status = 'ACCEPTED'
                    )
                THEN a.profile_id
            END) AS enrolled_count
        FROM application a
    ),
    filtered AS (
        SELECT *
        FROM enriched e
        WHERE (
            v_search = ''
            OR lower(concat_ws(
                ' ',
                e.name,
                coalesce(e.student_code, ''),
                coalesce(e.program_name, ''),
                coalesce(e.intake_label, '')
            )) LIKE '%' || v_search || '%'
        )
        AND (
            v_status = 'all'
            OR public.pipeline_status_slug(e.pipeline_status) = v_status
        )
    )
    SELECT
        jsonb_build_object(
            'total_students', (SELECT count(*) FROM all_students),
            'applied', (SELECT applied_count FROM application_stats),
            'enrolled', (SELECT enrolled_count FROM application_stats)
        ),
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(to_jsonb(f))
                FROM (
                    SELECT
                        profile_id,
                        name,
                        student_code,
                        program_name,
                        intake_label,
                        applied_through,
                        pipeline_status,
                        submission_date
                    FROM filtered
                    ORDER BY student_created_at DESC
                    OFFSET v_offset
                    LIMIT v_limit
                ) f
            ),
            '[]'::jsonb
        )
    INTO v_stats, v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'stats', v_stats,
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', v_total,
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        )
    );
END;
$$;

-- ─── University application list ──────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_university_applications_list(
    p_university_ids uuid[] DEFAULT NULL,
    p_search text DEFAULT '',
    p_tab text DEFAULT 'all',
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_tab text := lower(trim(coalesce(p_tab, 'all')));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total integer;
    v_total_pages integer;
    v_tab_counts jsonb;
    v_data jsonb;
BEGIN
    WITH scoped_apps AS (
        SELECT
            a.id,
            a.application_no,
            a.status AS app_status,
            a.created_at,
            a.updated_at,
            a.profile_id,
            a.course_id,
            a.submitted_by_profile_id,
            a.university_id,
            a.is_deferred,
            a.custom_intake_date
        FROM application a
        WHERE public.matches_university_scope(a.university_id, p_university_ids)
    ),
    with_offers AS (
        SELECT
            sa.*,
            ol.status AS offer_status,
            ol.accepted_at AS offer_accepted_at,
            ol.created_at AS offer_created_at,
            ol.id IS NOT NULL AS has_offer
        FROM scoped_apps sa
        LEFT JOIN LATERAL (
            SELECT o.status, o.accepted_at, o.created_at, o.id
            FROM offer_letter o
            WHERE o.application_id = sa.id
            ORDER BY o.created_at DESC
            LIMIT 1
        ) ol ON true
    ),
    enriched AS (
        SELECT
            wo.*,
            trim(concat(coalesce(sp.first_name, ''), ' ', coalesce(sp.last_name, ''))) AS student_name,
            st.student_code,
            sp.avatar_url,
            c.name AS course_name,
            public.format_intake_label(
                d.intake_starts_on,
                d.intake_date::text,
                wo.custom_intake_date
            ) AS intake_label,
            public.resolve_pipeline_status(
                wo.app_status::text,
                wo.offer_status::text,
                wo.has_offer
            ) AS pipeline_status,
            CASE
                WHEN wo.submitted_by_profile_id IS NULL
                    OR wo.submitted_by_profile_id = wo.profile_id
                THEN 'Direct Application'
                ELSE coalesce(
                    trim(concat(
                        coalesce(ag.contact_person_first_name, ''),
                        ' ',
                        coalesce(ag.contact_person_last_name, '')
                    )),
                    'University Partner'
                )
            END AS agent_name,
            public.format_dashboard_date(wo.created_at) AS submission_date
        FROM with_offers wo
        INNER JOIN profile sp ON sp.id = wo.profile_id
        LEFT JOIN student st ON st.profile_id = wo.profile_id
        LEFT JOIN course c ON c.id = wo.course_id
        LEFT JOIN degree d ON d.id = c.degree_id
        LEFT JOIN agent ag ON ag.profile_id = wo.submitted_by_profile_id
    ),
    tabbed AS (
        SELECT
            e.*,
            public.application_matches_tab(
                v_tab,
                e.pipeline_status,
                e.app_status::text,
                e.updated_at,
                e.offer_accepted_at,
                e.offer_created_at,
                e.is_deferred
            ) AS matches_current_tab
        FROM enriched e
    ),
    filtered AS (
        SELECT *
        FROM tabbed t
        WHERE (
            v_search = ''
            OR lower(concat_ws(
                ' ',
                t.student_name,
                coalesce(t.student_code, ''),
                t.profile_id::text
            )) LIKE '%' || v_search || '%'
        )
        AND (
            v_tab = 'all'
            OR t.matches_current_tab
        )
    )
    SELECT
        jsonb_build_object(
            'all', (SELECT count(*) FROM enriched),
            'pending_review', (
                SELECT count(*)
                FROM enriched e
                WHERE public.application_matches_tab(
                    'pending-review',
                    e.pipeline_status,
                    e.app_status::text,
                    e.updated_at,
                    e.offer_accepted_at,
                    e.offer_created_at,
                    e.is_deferred
                )
            ),
            'awaiting_signature', (
                SELECT count(*)
                FROM enriched e
                WHERE public.application_matches_tab(
                    'awaiting-signature',
                    e.pipeline_status,
                    e.app_status::text,
                    e.updated_at,
                    e.offer_accepted_at,
                    e.offer_created_at,
                    e.is_deferred
                )
            ),
            'recently_completed', (
                SELECT count(*)
                FROM enriched e
                WHERE public.application_matches_tab(
                    'recently-completed',
                    e.pipeline_status,
                    e.app_status::text,
                    e.updated_at,
                    e.offer_accepted_at,
                    e.offer_created_at,
                    e.is_deferred
                )
            ),
            'rejected', (SELECT count(*) FROM enriched WHERE app_status = 'REJECTED'),
            'defer_intake', (SELECT count(*) FROM enriched WHERE is_deferred = true)
        ),
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(to_jsonb(row_data))
                FROM (
                    SELECT jsonb_build_object(
                        'id', f.id,
                        'student_name', f.student_name,
                        'student_code', f.student_code,
                        'avatar_url', f.avatar_url,
                        'course_name', f.course_name,
                        'intake_label', f.intake_label,
                        'agent_name', f.agent_name,
                        'pipeline_status', f.pipeline_status,
                        'submission_date', f.submission_date,
                        'is_deferred', f.is_deferred,
                        'custom_intake_date', f.custom_intake_date,
                        'app_status', f.app_status,
                        'has_offer', f.has_offer
                    ) AS row_data
                    FROM filtered f
                    ORDER BY f.created_at DESC
                    OFFSET v_offset
                    LIMIT v_limit
                ) page_rows
            ),
            '[]'::jsonb
        )
    INTO v_tab_counts, v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'tab_counts', v_tab_counts,
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', coalesce(v_total, 0),
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        )
    );
END;
$$;

-- ─── University program list ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_university_programs_list(
    p_university_ids uuid[] DEFAULT NULL,
    p_search text DEFAULT '',
    p_level_id uuid DEFAULT NULL,
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total integer;
    v_total_pages integer;
    v_data jsonb;
BEGIN
    WITH base AS (
        SELECT
            c.id,
            c.name,
            c.category,
            c.created_at,
            c.updated_at,
            c.deadline_date,
            d.name AS degree_name,
            d.location,
            d.duration,
            d.fees,
            d.agent_commission,
            d.intake_date,
            d.intake_starts_on,
            d.level_id,
            l.name AS level_name
        FROM course c
        LEFT JOIN degree d ON d.id = c.degree_id
        LEFT JOIN levels l ON l.id = d.level_id
        WHERE c.is_deleted = false
          AND (
              p_university_ids IS NULL
              OR c.profile_id = ANY(p_university_ids)
          )
    ),
    enriched AS (
        SELECT
            b.*,
            coalesce(b.category, b.degree_name) AS resolved_category,
            CASE
                WHEN b.intake_starts_on IS NOT NULL THEN
                    to_char(b.intake_starts_on, 'FMMonth') || ' Intake ' || to_char(b.intake_starts_on, 'YYYY')
                WHEN b.intake_date IS NOT NULL AND lower(b.intake_date::text) IN ('summer', 'winter') THEN
                    upper(b.intake_date::text) || ' Intake'
                ELSE NULL
            END AS intake_label,
            CASE
                WHEN b.deadline_date IS NULL THEN 'Rolling'
                WHEN b.deadline_date::date > current_date THEN
                    ceil(extract(epoch FROM (b.deadline_date::timestamp - now())) / 86400)::text || ' Days'
                ELSE to_char(b.deadline_date::date, 'Mon DD, YYYY')
            END AS deadline_label
        FROM base b
        WHERE (p_level_id IS NULL OR b.level_id = p_level_id)
    ),
    filtered AS (
        SELECT *
        FROM enriched e
        WHERE (
            v_search = ''
            OR lower(concat_ws(
                ' ',
                e.name,
                coalesce(e.resolved_category, ''),
                coalesce(e.level_name, ''),
                coalesce(e.location, ''),
                coalesce(e.intake_label, '')
            )) LIKE '%' || v_search || '%'
        )
    )
    SELECT
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC)
                FROM (
                    SELECT
                        id,
                        name,
                        resolved_category AS category,
                        level_name,
                        intake_label,
                        deadline_label,
                        location,
                        duration,
                        fees AS tuition_fees,
                        agent_commission,
                        created_at,
                        updated_at
                    FROM filtered
                    ORDER BY created_at DESC
                    OFFSET v_offset
                    LIMIT v_limit
                ) f
            ),
            '[]'::jsonb
        )
    INTO v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', coalesce(v_total, 0),
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        )
    );
END;
$$;

-- ─── Agent / staff student list ───────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_agent_students_list(
    p_search text DEFAULT '',
    p_status text DEFAULT 'all',
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_status text := lower(trim(coalesce(p_status, 'all')));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total_doc_types integer;
    v_total integer;
    v_total_pages integer;
    v_data jsonb;
BEGIN
    SELECT count(*) INTO v_total_doc_types FROM document_type;

    WITH base AS (
        SELECT
            s.*,
            p.id AS profile_pk,
            p.first_name,
            p.last_name,
            p.email,
            p.phone,
            p.avatar_url,
            p.gender,
            p.date_of_birth,
            coalesce((to_jsonb(s) ->> 'status'), 'CREATED') AS student_status
        FROM student s
        INNER JOIN profile p ON p.id = s.profile_id
    ),
    filtered AS (
        SELECT *
        FROM base b
        WHERE (
            v_status = 'all'
            OR lower(b.student_status) = v_status
        )
        AND (
            v_search = ''
            OR lower(concat_ws(
                ' ',
                coalesce(b.student_code, ''),
                coalesce(b.country, ''),
                coalesce(b.first_name, ''),
                coalesce(b.last_name, ''),
                coalesce(b.email, '')
            )) LIKE '%' || v_search || '%'
        )
    ),
    page_rows AS (
        SELECT *
        FROM filtered
        ORDER BY created_at DESC
        OFFSET v_offset
        LIMIT v_limit
    ),
    with_docs AS (
        SELECT
            pr.*,
            (
                SELECT count(DISTINCT d.document_type_id)
                FROM document d
                WHERE d.profile_id = pr.profile_id
                  AND d.document_type_id IS NOT NULL
            ) AS documents_uploaded_count,
            (
                SELECT coalesce(
                    jsonb_agg(jsonb_build_object('qualification', e.qualification)),
                    '[]'::jsonb
                )
                FROM education e
                WHERE e.profile_id = pr.profile_id
            ) AS education_rows
        FROM page_rows pr
    )
    SELECT
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'student', to_jsonb(w) - 'education_rows',
                        'documents_uploaded_count', w.documents_uploaded_count,
                        'total_document_types', v_total_doc_types,
                        'education_rows', w.education_rows
                    )
                    ORDER BY w.created_at DESC
                )
                FROM with_docs w
            ),
            '[]'::jsonb
        )
    INTO v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', coalesce(v_total, 0),
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        ),
        'total_document_types', v_total_doc_types
    );
END;
$$;

-- ─── Offer list ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_offers_list(
    p_university_ids uuid[] DEFAULT NULL,
    p_student_profile_id uuid DEFAULT NULL,
    p_search text DEFAULT '',
    p_status text DEFAULT 'all',
    p_course_id uuid DEFAULT NULL,
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_status text := trim(coalesce(p_status, 'all'));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total integer;
    v_total_pages integer;
    v_data jsonb;
BEGIN
    WITH base AS (
        SELECT
            ol.id,
            ol.status,
            ol.created_at,
            a.id AS application_id,
            a.application_no,
            a.profile_id,
            a.submitted_by_profile_id,
            a.university_id,
            trim(concat(coalesce(sp.first_name, ''), ' ', coalesce(sp.last_name, ''))) AS student_name,
            sp.avatar_url AS student_avatar_url,
            sp.email AS student_email,
            trim(concat(coalesce(up.first_name, ''), ' ', coalesce(up.last_name, ''))) AS university_name,
            c.id AS course_id,
            c.name AS course_name,
            d.id AS degree_id,
            d.name AS degree_name
        FROM offer_letter ol
        INNER JOIN application a ON a.id = ol.application_id
        LEFT JOIN profile sp ON sp.id = a.profile_id
        LEFT JOIN profile up ON up.id = a.university_id
        LEFT JOIN course c ON c.id = a.course_id
        LEFT JOIN degree d ON d.id = c.degree_id
        WHERE (p_student_profile_id IS NULL OR a.profile_id = p_student_profile_id)
          AND public.matches_university_scope(a.university_id, p_university_ids)
    ),
    filtered AS (
        SELECT *
        FROM base b
        WHERE (lower(v_status) = 'all' OR upper(b.status::text) = upper(v_status))
          AND (p_course_id IS NULL OR b.course_id = p_course_id)
          AND (
              v_search = ''
              OR lower(concat_ws(
                  ' ',
                  b.student_name,
                  coalesce(b.student_email, ''),
                  coalesce(b.course_name, ''),
                  coalesce(b.degree_name, ''),
                  coalesce(b.application_no, '')
              )) LIKE '%' || v_search || '%'
          )
    )
    SELECT
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC)
                FROM (
                    SELECT
                        id,
                        status,
                        created_at,
                        jsonb_build_object(
                            'id', application_id,
                            'application_no', application_no,
                            'profile_id', profile_id,
                            'submitted_by_profile_id', submitted_by_profile_id,
                            'university_id', university_id,
                            'student', jsonb_build_object(
                                'id', profile_id,
                                'name', student_name,
                                'avatar_url', student_avatar_url,
                                'email', student_email
                            ),
                            'university', jsonb_build_object(
                                'id', university_id,
                                'name', university_name
                            ),
                            'course', jsonb_build_object(
                                'id', course_id,
                                'name', course_name,
                                'degree', CASE
                                    WHEN degree_id IS NULL THEN NULL
                                    ELSE jsonb_build_object('id', degree_id, 'name', degree_name)
                                END
                            )
                        ) AS application
                    FROM filtered
                    ORDER BY created_at DESC
                    OFFSET v_offset
                    LIMIT v_limit
                ) f
            ),
            '[]'::jsonb
        )
    INTO v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', coalesce(v_total, 0),
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        )
    );
END;
$$;

-- ─── Document staff student list ──────────────────────────────

CREATE OR REPLACE FUNCTION public.fetch_document_students_list(
    p_profile_ids uuid[] DEFAULT NULL,
    p_agent_id uuid DEFAULT NULL,
    p_search text DEFAULT '',
    p_status text DEFAULT 'all',
    p_page integer DEFAULT 1,
    p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_search text := lower(trim(coalesce(p_search, '')));
    v_status text := trim(coalesce(p_status, 'all'));
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_limit integer := greatest(coalesce(p_limit, 10), 1);
    v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_limit, 10), 1);
    v_total integer;
    v_total_pages integer;
    v_data jsonb;
BEGIN
    WITH scoped_students AS (
        SELECT
            s.profile_id,
            s.student_code,
            s.created_at,
            p.first_name,
            p.last_name,
            p.avatar_url
        FROM student s
        INNER JOIN profile p ON p.id = s.profile_id
        WHERE (
            (p_agent_id IS NOT NULL AND s.created_by_agent_id = p_agent_id)
            OR (p_agent_id IS NULL AND (p_profile_ids IS NULL OR s.profile_id = ANY(p_profile_ids)))
        )
    ),
    with_docs AS (
        SELECT
            ss.*,
            count(d.id) AS document_count,
            max(d.created_at) AS last_uploaded_at,
            (
                SELECT dr.status
                FROM document d2
                LEFT JOIN LATERAL (
                    SELECT r.status, r.created_at
                    FROM document_review r
                    WHERE r.document_id = d2.id
                    ORDER BY r.created_at DESC
                    LIMIT 1
                ) dr ON true
                WHERE d2.profile_id = ss.profile_id
                ORDER BY d2.created_at DESC
                LIMIT 1
            ) AS last_doc_status
        FROM scoped_students ss
        LEFT JOIN document d ON d.profile_id = ss.profile_id
        GROUP BY ss.profile_id, ss.student_code, ss.created_at, ss.first_name, ss.last_name, ss.avatar_url
    ),
    filtered AS (
        SELECT *
        FROM with_docs w
        WHERE (
            v_search = ''
            OR lower(concat_ws(
                ' ',
                coalesce(w.first_name, ''),
                coalesce(w.last_name, ''),
                coalesce(w.student_code, '')
            )) LIKE '%' || v_search || '%'
        )
        AND (
            lower(v_status) = 'all'
            OR coalesce(w.last_doc_status::text, '') = v_status
        )
    )
    SELECT
        (SELECT count(*) FROM filtered),
        coalesce(
            (
                SELECT jsonb_agg(to_jsonb(f) ORDER BY f.last_uploaded_at DESC NULLS LAST)
                FROM (
                    SELECT
                        profile_id AS student_id,
                        trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, ''))) AS student_name,
                        student_code,
                        avatar_url,
                        document_count,
                        last_uploaded_at,
                        last_doc_status
                    FROM filtered
                    ORDER BY last_uploaded_at DESC NULLS LAST, created_at DESC
                    OFFSET v_offset
                    LIMIT v_limit
                ) f
            ),
            '[]'::jsonb
        )
    INTO v_total, v_data;

    v_total_pages := CASE WHEN v_total = 0 THEN 0 ELSE greatest(ceil(v_total::numeric / v_limit), 1) END;

    RETURN jsonb_build_object(
        'data', v_data,
        'pagination', jsonb_build_object(
            'total', coalesce(v_total, 0),
            'page', v_page,
            'limit', v_limit,
            'totalPages', v_total_pages
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_pipeline_status(text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pipeline_status_slug(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.format_dashboard_date(timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.format_intake_label(date, text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.matches_university_scope(uuid, uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.application_matches_tab(text, text, text, timestamptz, timestamptz, timestamptz, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_university_students_list(uuid[], text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_university_applications_list(uuid[], text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_university_programs_list(uuid[], text, uuid, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_agent_students_list(text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_offers_list(uuid[], uuid, text, text, uuid, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_document_students_list(uuid[], uuid, text, text, integer, integer) TO authenticated, service_role;
