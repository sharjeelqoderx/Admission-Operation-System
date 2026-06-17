export const OFFER_LIST_SELECT_WITH_TEMPLATE = `
    id,
    status,
    created_at,
    body_html,
    document_template_id,
    application!inner (
        id,
        application_no,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile_id (
            id,
            first_name,
            last_name,
            avatar_url,
            email
        ),
        course:course_id (
            id,
            name,
            deadline_date,
            degree:degree_id (
                id,
                name,
                fees,
                intake_date,
                study_mode
            )
        ),
        university:university_id (
            id,
            first_name,
            last_name
        )
    )
`

export const OFFER_LIST_SELECT_LEGACY = `
    id,
    status,
    created_at,
    application!inner (
        id,
        application_no,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile_id (
            id,
            first_name,
            last_name,
            avatar_url,
            email
        ),
        course:course_id (
            id,
            name,
            deadline_date,
            degree:degree_id (
                id,
                name,
                fees,
                intake_date,
                study_mode
            )
        ),
        university:university_id (
            id,
            first_name,
            last_name
        )
    )
`

export const OFFER_DETAIL_SELECT_WITH_TEMPLATE = `
    id,
    status,
    created_at,
    accepted_at,
    file_url,
    feedback,
    issued_by_profile_id,
    body_html,
    document_template_id,
    application!inner (
        id,
        application_no,
        status,
        created_at,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile_id (
            id,
            first_name,
            last_name,
            avatar_url,
            email,
            phone,
            gender,
            date_of_birth,
            signature
        ),
        course:course_id (
            id,
            name,
            deadline_date,
            degree:degree_id (
                id,
                name,
                fees,
                intake_date,
                study_mode,
                duration,
                location,
                language_of_study
            )
        ),
        university:university_id (
            id,
            first_name,
            last_name
        ),
        agent:submitted_by_profile_id (
            id,
            first_name,
            last_name,
            email
        ),
        application_review (
            id,
            status,
            feedback,
            created_at,
            reviewed_by_profile_id
        )
    )
`

export const OFFER_DETAIL_SELECT_LEGACY = `
    id,
    status,
    created_at,
    accepted_at,
    file_url,
    feedback,
    issued_by_profile_id,
    application!inner (
        id,
        application_no,
        status,
        created_at,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile_id (
            id,
            first_name,
            last_name,
            avatar_url,
            email,
            phone,
            gender,
            date_of_birth,
            signature
        ),
        course:course_id (
            id,
            name,
            deadline_date,
            degree:degree_id (
                id,
                name,
                fees,
                intake_date,
                study_mode,
                duration,
                location,
                language_of_study
            )
        ),
        university:university_id (
            id,
            first_name,
            last_name
        ),
        agent:submitted_by_profile_id (
            id,
            first_name,
            last_name,
            email
        ),
        application_review (
            id,
            status,
            feedback,
            created_at,
            reviewed_by_profile_id
        )
    )
`

export function isMissingOfferTemplateColumnError(message?: string | null): boolean {
    if (!message) return false
    return (
        message.includes("body_html") ||
        message.includes("document_template_id")
    )
}
