-- University dashboard overview: single RPC replaces load-all + 12 follow-up queries.

CREATE OR REPLACE FUNCTION public.fetch_university_overview(
    p_university_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    WITH scoped_apps AS (
        SELECT
            a.id,
            a.profile_id,
            a.status,
            a.created_at,
            a.course_id
        FROM application a
        WHERE public.matches_university_scope(a.university_id, p_university_ids)
    ),
    apps_with_offers AS (
        SELECT
            sa.*,
            ol.id AS offer_id,
            ol.status AS offer_status,
            ol.created_at AS offer_created_at,
            public.resolve_pipeline_status(
                sa.status::text,
                ol.status::text,
                ol.id IS NOT NULL
            ) AS pipeline_status
        FROM scoped_apps sa
        LEFT JOIN LATERAL (
            SELECT o.id, o.status, o.created_at
            FROM offer_letter o
            WHERE o.application_id = sa.id
            ORDER BY o.created_at DESC
            LIMIT 1
        ) ol ON true
    ),
    scoped_profile_ids AS (
        SELECT DISTINCT profile_id FROM scoped_apps
    ),
    stats AS (
        SELECT jsonb_build_object(
            'total_students', (SELECT count(*) FROM scoped_profile_ids),
            'total_university_partners', (
                SELECT count(*)
                FROM agent ag
                INNER JOIN profile p ON p.id = ag.profile_id
                WHERE p.role = 'AGENT'
            ),
            'active_applications', (
                SELECT count(*)
                FROM apps_with_offers aw
                WHERE aw.status NOT IN ('REJECTED', 'APPROVED')
                  AND aw.pipeline_status NOT IN ('Completed', 'Signed')
            ),
            'total_applications', (SELECT count(*) FROM scoped_apps),
            'templates', (
                SELECT count(*)
                FROM document_template
                WHERE is_deleted = false
            ),
            'programs', (
                SELECT count(*)
                FROM course c
                WHERE c.is_deleted = false
                  AND (
                      p_university_ids IS NULL
                      OR c.profile_id = ANY(p_university_ids)
                  )
            ),
            'total_documents', (
                SELECT count(*)
                FROM document d
                WHERE d.profile_id IN (SELECT profile_id FROM scoped_profile_ids)
            ),
            'total_offers', (
                SELECT count(*)
                FROM offer_letter ol
                WHERE ol.application_id IN (SELECT id FROM scoped_apps)
            )
        ) AS payload
    ),
    application_status_counts AS (
        SELECT coalesce(jsonb_object_agg(status::text, cnt), '{}'::jsonb) AS payload
        FROM (
            SELECT status::text, count(*) AS cnt
            FROM scoped_apps
            GROUP BY status
        ) s
    ),
    pipeline_status_counts AS (
        SELECT coalesce(jsonb_object_agg(pipeline_status, cnt), '{}'::jsonb) AS payload
        FROM (
            SELECT pipeline_status, count(*) AS cnt
            FROM apps_with_offers
            GROUP BY pipeline_status
        ) s
    ),
    offer_status_counts AS (
        SELECT coalesce(jsonb_object_agg(status::text, cnt), '{}'::jsonb) AS payload
        FROM (
            SELECT ol.status::text, count(*) AS cnt
            FROM offer_letter ol
            WHERE ol.application_id IN (SELECT id FROM scoped_apps)
            GROUP BY ol.status
        ) s
    ),
    program_status_counts AS (
        SELECT coalesce(jsonb_object_agg(status::text, cnt), '{}'::jsonb) AS payload
        FROM (
            SELECT c.status::text, count(*) AS cnt
            FROM course c
            WHERE c.is_deleted = false
              AND (
                  p_university_ids IS NULL
                  OR c.profile_id = ANY(p_university_ids)
              )
            GROUP BY c.status
        ) s
    ),
    document_latest_status AS (
        SELECT
            d.id,
            coalesce(
                (
                    SELECT dr.status::text
                    FROM document_review dr
                    WHERE dr.document_id = d.id
                    ORDER BY dr.created_at DESC
                    LIMIT 1
                ),
                'PENDING'
            ) AS latest_status
        FROM document d
        WHERE d.profile_id IN (SELECT profile_id FROM scoped_profile_ids)
    ),
    document_status_counts AS (
        SELECT coalesce(jsonb_object_agg(latest_status, cnt), '{}'::jsonb) AS payload
        FROM (
            SELECT latest_status, count(*) AS cnt
            FROM document_latest_status
            GROUP BY latest_status
        ) s
    ),
    monthly_buckets AS (
        SELECT
            to_char(month_start, 'YYYY-MM') AS bucket_key,
            to_char(month_start, 'Mon YY') AS month_label,
            month_start
        FROM generate_series(
            date_trunc('month', now()) - interval '5 months',
            date_trunc('month', now()),
            interval '1 month'
        ) AS month_start
    ),
    monthly_app_counts AS (
        SELECT
            to_char(date_trunc('month', sa.created_at), 'YYYY-MM') AS bucket_key,
            count(*) AS cnt
        FROM scoped_apps sa
        WHERE sa.created_at >= date_trunc('month', now()) - interval '5 months'
        GROUP BY 1
    ),
    monthly_offer_counts AS (
        SELECT
            to_char(date_trunc('month', ol.created_at), 'YYYY-MM') AS bucket_key,
            count(*) AS cnt
        FROM offer_letter ol
        WHERE ol.application_id IN (SELECT id FROM scoped_apps)
          AND ol.created_at >= date_trunc('month', now()) - interval '5 months'
        GROUP BY 1
    ),
    monthly_trend AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'month', mb.month_label,
                    'applications', coalesce(mac.cnt, 0),
                    'offers', coalesce(moc.cnt, 0)
                )
                ORDER BY mb.month_start
            ),
            '[]'::jsonb
        ) AS payload
        FROM monthly_buckets mb
        LEFT JOIN monthly_app_counts mac ON mac.bucket_key = mb.bucket_key
        LEFT JOIN monthly_offer_counts moc ON moc.bucket_key = mb.bucket_key
    ),
    recent_applications AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'student_name', r.student_name,
                    'program_name', r.program_name,
                    'pipeline_status', r.pipeline_status,
                    'submission_date', public.format_dashboard_date(r.created_at)
                )
                ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT
                aw.id,
                aw.created_at,
                aw.pipeline_status,
                trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))) AS student_name,
                coalesce(d.name, c.name) AS program_name
            FROM apps_with_offers aw
            INNER JOIN profile p ON p.id = aw.profile_id
            LEFT JOIN course c ON c.id = aw.course_id
            LEFT JOIN degree d ON d.id = c.degree_id
            ORDER BY aw.created_at DESC
            LIMIT 5
        ) r
    ),
    recent_students AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'profile_id', r.profile_id,
                    'name', r.student_name,
                    'program_name', r.program_name,
                    'pipeline_status', r.pipeline_status,
                    'submission_date', public.format_dashboard_date(r.created_at)
                )
                ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT *
            FROM (
                SELECT DISTINCT ON (aw.profile_id)
                    aw.profile_id,
                    aw.created_at,
                    aw.pipeline_status,
                    trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))) AS student_name,
                    coalesce(d.name, c.name) AS program_name
                FROM apps_with_offers aw
                INNER JOIN profile p ON p.id = aw.profile_id
                LEFT JOIN course c ON c.id = aw.course_id
                LEFT JOIN degree d ON d.id = c.degree_id
                ORDER BY aw.profile_id, aw.created_at DESC
            ) distinct_students
            ORDER BY created_at DESC
            LIMIT 5
        ) r
    ),
    recent_programs AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'name', coalesce(r.name, 'Untitled Program'),
                    'category', r.category,
                    'status', r.status
                )
                ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT c.id, c.name, c.category, c.status, c.created_at
            FROM course c
            WHERE c.is_deleted = false
              AND (
                  p_university_ids IS NULL
                  OR c.profile_id = ANY(p_university_ids)
              )
            ORDER BY c.created_at DESC
            LIMIT 5
        ) r
    ),
    recent_templates AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'title', t.title,
                    'updated_at', public.format_dashboard_date(t.updated_at)
                )
                ORDER BY t.updated_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT id, title, updated_at
            FROM document_template
            WHERE is_deleted = false
            ORDER BY updated_at DESC
            LIMIT 5
        ) t
    ),
    recent_documents AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'student_name', r.student_name,
                    'document_type', r.document_type,
                    'status', r.status,
                    'created_at', public.format_dashboard_date(r.created_at)
                )
                ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT
                d.id,
                d.created_at,
                trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))) AS student_name,
                dt.name AS document_type,
                (
                    SELECT dr.status::text
                    FROM document_review dr
                    WHERE dr.document_id = d.id
                    ORDER BY dr.created_at DESC
                    LIMIT 1
                ) AS status
            FROM document d
            INNER JOIN profile p ON p.id = d.profile_id
            LEFT JOIN document_type dt ON dt.id = d.document_type_id
            WHERE d.profile_id IN (SELECT profile_id FROM scoped_profile_ids)
            ORDER BY d.created_at DESC
            LIMIT 5
        ) r
    ),
    recent_offers AS (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'student_name', r.student_name,
                    'program_name', r.program_name,
                    'status', r.status,
                    'created_at', public.format_dashboard_date(r.created_at)
                )
                ORDER BY r.created_at DESC
            ),
            '[]'::jsonb
        ) AS payload
        FROM (
            SELECT
                ol.id,
                ol.status,
                ol.created_at,
                trim(concat(coalesce(p.first_name, ''), ' ', coalesce(p.last_name, ''))) AS student_name,
                coalesce(d.name, c.name) AS program_name
            FROM offer_letter ol
            INNER JOIN scoped_apps sa ON sa.id = ol.application_id
            INNER JOIN profile p ON p.id = sa.profile_id
            LEFT JOIN course c ON c.id = sa.course_id
            LEFT JOIN degree d ON d.id = c.degree_id
            ORDER BY ol.created_at DESC
            LIMIT 5
        ) r
    )
    SELECT jsonb_build_object(
        'stats', (SELECT payload FROM stats),
        'application_status_counts', (SELECT payload FROM application_status_counts),
        'pipeline_status_counts', (SELECT payload FROM pipeline_status_counts),
        'offer_status_counts', (SELECT payload FROM offer_status_counts),
        'program_status_counts', (SELECT payload FROM program_status_counts),
        'document_status_counts', (SELECT payload FROM document_status_counts),
        'monthly_trend', (SELECT payload FROM monthly_trend),
        'recent', jsonb_build_object(
            'students', (SELECT payload FROM recent_students),
            'applications', (SELECT payload FROM recent_applications),
            'programs', (SELECT payload FROM recent_programs),
            'templates', (SELECT payload FROM recent_templates),
            'documents', (SELECT payload FROM recent_documents),
            'offers', (SELECT payload FROM recent_offers)
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_university_overview(uuid[]) TO authenticated, service_role;
