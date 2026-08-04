import type { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CourseProgram, CourseProgramContent } from "@/types/schemas/program"

const COURSE_DEGREE_SELECT = `
    id,
    name,
    credits,
    location,
    language_of_study,
    duration,
    fees,
    study_mode,
    intake_date,
    intake_starts_on,
    agent_commission,
    level_id,
    requirements:degree_requirement (
        id,
        requirement_type,
        created_at,
        updated_at,
        document_type:document_type_id (
            id,
            name,
            code,
            type,
            description,
            is_active,
            may_expire
        )
    )
`

const COURSE_PROGRAM_SELECT = `
    id,
    category,
    location,
    program_length,
    program_detail,
    admission_requirements,
    perspectives,
    prospects_after_graduation,
    competency_model,
    professional_skills,
    management_skills,
    status
`

export const COURSE_SELECT = `
    id,
    name,
    created_at,
    updated_at,
    is_deleted,
    degree_id,
    deadline_date,
    program_id,
    degree:degree_id (
        ${COURSE_DEGREE_SELECT}
    )
`

export const COURSE_DETAIL_SELECT = `
    id,
    name,
    created_at,
    updated_at,
    is_deleted,
    degree_id,
    deadline_date,
    program_id,
    degree:degree_id (
        ${COURSE_DEGREE_SELECT}
    ),
    program:program_id (
        ${COURSE_PROGRAM_SELECT}
    )
`

export type CourseRow = {
    id: string
    name: string
    created_at: string
    updated_at: string
    is_deleted: boolean
    degree_id: string | null
    deadline_date: string | null
    program_id: string | null
    degree: {
        level_id: string | null
        [key: string]: unknown
    } | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function attachLevelsToCourses(
    supabase: SupabaseServerClient,
    courses: CourseRow[]
) {
    const levelIds = [
        ...new Set(
            courses
                .map((course) => course.degree?.level_id)
                .filter((id): id is string => Boolean(id))
        ),
    ]

    if (levelIds.length === 0) {
        return courses.map((course) => ({
            ...course,
            degree: course.degree ? { ...course.degree, level: null } : null,
        }))
    }

    const { data: levels, error } = await supabase
        .from("levels")
        .select("id, name")
        .in("id", levelIds)

    if (error) {
        throw error
    }

    const levelById = new Map((levels ?? []).map((level) => [level.id, level]))

    return courses.map((course) => ({
        ...course,
        degree: course.degree
            ? {
                  ...course.degree,
                  level: course.degree.level_id
                      ? levelById.get(course.degree.level_id) ?? null
                      : null,
              }
            : null,
    }))
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
    if (value == null) return null
    return Array.isArray(value) ? value[0] ?? null : value
}

async function attachProgramDocumentRequirements(
    supabase: SupabaseServerClient,
    programId: string | null | undefined
) {
    if (!programId) {
        return []
    }

    const { data: requirements, error } = await supabase
        .from("program_document_requirements")
        .select("id, document_type_id, document_type:document_type_id ( name )")
        .eq("program_id", programId)

    if (error) {
        throw error
    }

    return (requirements ?? []).map((row) => {
        const documentType = unwrapRelation(row.document_type)

        return {
            id: row.id,
            document_type_id: row.document_type_id,
            name: documentType?.name ?? null,
        }
    })
}

export async function fetchCourseProgramById(
    supabase: SupabaseServerClient,
    courseId: string
): Promise<CourseProgram | null> {
    const { data, error } = await supabase
        .from("course")
        .select(COURSE_DETAIL_SELECT)
        .eq("id", courseId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (!data) {
        return null
    }

    const rawCourse = data as unknown as CourseRow & {
        program?: Record<string, unknown> | Record<string, unknown>[] | null
    }

    const [courseWithLevel] = await attachLevelsToCourses(supabase, [rawCourse])
    const program = unwrapRelation(rawCourse.program)
    const documentRequirements = await attachProgramDocumentRequirements(
        supabase,
        rawCourse.program_id
    )

    return {
        ...courseWithLevel,
        program: program as CourseProgramContent | null,
        document_requirements: documentRequirements,
    } as CourseProgram
}
