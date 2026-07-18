import type { createSupabaseServerClient } from "@/lib/supabase/server"

export const COURSE_SELECT = `
    id,
    name,
    created_at,
    updated_at,
    degree_id,
    deadline_date,
    degree:degree_id (
        id,
        name,
        credits,
        location,
        language_of_study,
        duration,
        fees,
        study_mode,
        intake_date,
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
    )
`

export type CourseRow = {
    id: string
    name: string
    created_at: string
    updated_at: string
    degree_id: string | null
    deadline_date: string | null
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

export async function fetchCourseProgramById(
    supabase: SupabaseServerClient,
    courseId: string
) {
    const { data, error } = await supabase
        .from("course")
        .select(COURSE_SELECT)
        .eq("id", courseId)
        .maybeSingle()

    if (error) {
        throw error
    }

    if (!data) {
        return null
    }

    const [course] = await attachLevelsToCourses(supabase, [data as unknown as CourseRow])
    return course
}
