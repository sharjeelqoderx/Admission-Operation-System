import type { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
    CourseProgram,
    CourseProgramContent,
    CourseDegree,
    CourseRequirement,
} from "@/types/schemas/program"
import type { Tables } from "@/types/supabase"

const COURSE_CONTENT_SELECT = `
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
` as const

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
        document_type_id,
        requirement_type,
        is_deleted,
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
` as const

export const COURSE_SELECT = `
    id,
    name,
    created_at,
    updated_at,
    is_deleted,
    degree_id,
    deadline_date,
    ${COURSE_CONTENT_SELECT},
    degree:degree_id (
        ${COURSE_DEGREE_SELECT}
    )
`

export const COURSE_DETAIL_SELECT = COURSE_SELECT

type CourseTableRow = Tables<"course">

type CourseDegreeRelation = Tables<"degree"> & {
    level?: Pick<Tables<"levels">, "id" | "name"> | null
    requirements?: CourseRequirement[] | null
}

export type CourseRow = CourseTableRow & {
    degree: CourseDegreeRelation | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function attachLevelsToCourses(
    supabase: SupabaseServerClient,
    courses: CourseRow[]
): Promise<CourseRow[]> {
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

function mapDegreeDocumentRequirements(
    degree: CourseRow["degree"]
): CourseProgram["document_requirements"] {
    const requirements = (degree?.requirements ?? []).filter(
        (row) => !(row as { is_deleted?: boolean }).is_deleted
    )

    return requirements.map((row) => {
        const documentType = unwrapRelation(row.document_type)

        return {
            id: row.id,
            document_type_id: row.document_type_id,
            name: documentType?.name ?? null,
        }
    })
}

function mapCourseContent(course: CourseTableRow): CourseProgramContent {
    return {
        id: course.id,
        category: course.category,
        location: course.location,
        program_length: course.program_length,
        program_detail: course.program_detail,
        admission_requirements: course.admission_requirements,
        perspectives: course.perspectives,
        prospects_after_graduation: course.prospects_after_graduation,
        competency_model: course.competency_model,
        professional_skills: course.professional_skills,
        management_skills: course.management_skills,
        status: course.status,
    }
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

    const rawCourse = data as unknown as CourseRow
    const [courseWithLevel] = await attachLevelsToCourses(supabase, [rawCourse])

    return {
        ...courseWithLevel,
        degree: (courseWithLevel.degree ?? null) as CourseDegree | null,
        program: mapCourseContent(courseWithLevel),
        document_requirements: mapDegreeDocumentRequirements(courseWithLevel.degree),
    }
}
