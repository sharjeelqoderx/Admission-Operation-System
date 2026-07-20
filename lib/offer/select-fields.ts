/** Nested profile embeds must use profile!<fk> — application has multiple FKs to profile. */
const APPLICATION_LIST_RELATIONS = `
        id,
        application_no,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile!profile_id (
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
        university:profile!university_id (
            id,
            first_name,
            last_name
        )
`

const APPLICATION_DETAIL_RELATIONS = `
        id,
        application_no,
        status,
        created_at,
        profile_id,
        submitted_by_profile_id,
        university_id,
        student:profile!profile_id (
            id,
            first_name,
            last_name,
            title,
            avatar_url,
            email,
            phone,
            gender,
            date_of_birth
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
        university:profile!university_id (
            id,
            first_name,
            last_name
        ),
        agent:profile!submitted_by_profile_id (
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
`

export const OFFER_LIST_SELECT_WITH_TEMPLATE = `
    id,
    status,
    created_at,
    body_html,
    document_template_id,
    application!inner (
${APPLICATION_LIST_RELATIONS}
    )
`

export const OFFER_LIST_SELECT_LEGACY = `
    id,
    status,
    created_at,
    application!inner (
${APPLICATION_LIST_RELATIONS}
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
    checklist_items,
    checklist_proofs,
    application!inner (
${APPLICATION_DETAIL_RELATIONS}
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
${APPLICATION_DETAIL_RELATIONS}
    )
`

export function isMissingOfferTemplateColumnError(message?: string | null): boolean {
    if (!message) return false
    return (
        message.includes("body_html") ||
        message.includes("document_template_id") ||
        message.includes("checklist_items") ||
        message.includes("checklist_proofs") ||
        message.includes("signature") ||
        /column .* does not exist/i.test(message)
    )
}
