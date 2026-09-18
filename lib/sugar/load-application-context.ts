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
        .select("street_1, street_2, street_3, post_code, zip_code, city")
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
                )
            )
        `
        )
        .eq("application_id", applicationId)

    const documentCodes = (applicationDocuments ?? [])
        .map((row) => {
            const document = Array.isArray(row.document) ? row.document[0] : row.document
            const documentType = document?.document_type
            const typeRow = Array.isArray(documentType) ? documentType[0] : documentType
            return typeRow?.code ?? typeRow?.name ?? null
        })
        .filter((value): value is string => Boolean(value))

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
        documentCodes,
    }
}
