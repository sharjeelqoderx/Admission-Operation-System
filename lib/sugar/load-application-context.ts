import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import type { SugarApplicationContext } from "@/lib/sugar/map-logic-interaction-payload"

export async function loadSugarApplicationContext(
    supabase: SupabaseClient<Database>,
    applicationId: string
): Promise<SugarApplicationContext | null> {
    const { data: application, error: applicationError } = await supabase
        .from("application")
        .select(
            `
            id,
            application_no,
            custom_intake_date,
            profile_id,
            sugar_logic_interaction_id,
            course:course_id (
                name,
                category,
                location,
                program_detail,
                degree:degree_id (
                    name,
                    intake_date,
                    intake_starts_on,
                    study_mode,
                    location,
                    level:level_id (
                        name
                    )
                )
            )
        `
        )
        .eq("id", applicationId)
        .maybeSingle()

    if (applicationError || !application || !application.course) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("title, first_name, last_name, email, phone, date_of_birth")
        .eq("id", application.profile_id)
        .maybeSingle()

    if (profileError || !profile) {
        return null
    }

    const { data: student } = await supabase
        .from("student")
        .select("street_1, street_2, street_3, post_code, zip_code, city, state, country")
        .eq("profile_id", application.profile_id)
        .maybeSingle()

    const { data: applicationDocuments } = await supabase
        .from("application_document")
        .select(
            `
            document:document_id (
                document_type:document_type_id (
                    code,
                    name
                ),
                document_files (
                    file_url,
                    created_at
                )
            )
        `
        )
        .eq("application_id", applicationId)

    const documentFileUrls: string[] = []

    for (const row of applicationDocuments ?? []) {
        const document = Array.isArray(row.document) ? row.document[0] : row.document
        const filesRaw = document?.document_files
        const files = Array.isArray(filesRaw) ? filesRaw : filesRaw ? [filesRaw] : []
        const sorted = [...files].sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
            return aTime - bTime
        })
        for (const file of sorted) {
            if (file.file_url?.trim()) {
                documentFileUrls.push(file.file_url.trim())
            }
        }
    }

    const course = Array.isArray(application.course)
        ? application.course[0]
        : application.course
    const degreeRaw = course?.degree
    const degree = Array.isArray(degreeRaw) ? degreeRaw[0] : degreeRaw
    const levelRaw = degree?.level
    const level = Array.isArray(levelRaw) ? levelRaw[0] : levelRaw

    return {
        application: {
            id: application.id,
            application_no: application.application_no,
            custom_intake_date: application.custom_intake_date,
        },
        profile,
        student: student ?? null,
        course: {
            name: course.name,
            category: course.category,
            location: course.location,
            program_detail: course.program_detail,
        },
        degree: degree
            ? {
                  name: degree.name,
                  intake_date: degree.intake_date,
                  intake_starts_on: degree.intake_starts_on,
                  study_mode: degree.study_mode,
                  location: degree.location,
                  level_name: level?.name ?? null,
              }
            : null,
        documentFileUrls,
    }
}
