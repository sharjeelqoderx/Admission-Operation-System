import "server-only"

import { createSupabaseServerClient, tryCreateSupabaseServiceClient } from "@/lib/supabase/server"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { formatIntakeDate, formatProgramDate } from "@/lib/utils/program"
import type {
    UniversityProgramDetail,
    UniversityProgramListItem,
    UniversityProgramListResponse,
    UniversityProgramUpsert,
} from "@/types/schemas/university-program"
import { isUniversityRole, isUniversityStaffRole } from "@/lib/auth/university-role"
import { rpcUniversityProgramsList } from "@/lib/rpc/dashboard"
import { Role } from "@/types/enums/role"

function formatDeadlineLabel(value?: string | null) {
    if (!value) return "Rolling"

    const deadline = new Date(value)
    if (Number.isNaN(deadline.getTime())) return value

    const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} Days`

    return formatProgramDate(value)
}

function buildIntakeLabel(degree?: {
    intake_starts_on?: string | null
    intake_date?: string | null
}) {
    if (degree?.intake_starts_on) {
        const date = new Date(degree.intake_starts_on)
        if (!Number.isNaN(date.getTime())) {
            return `${date.toLocaleDateString("en-US", { month: "long" })} Intake ${date.getFullYear()}`
        }
    }

    const formatted = formatIntakeDate(degree?.intake_date ?? null)
    return formatted === "N/A" ? null : `${formatted} Intake`
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
    if (value == null) return null
    return Array.isArray(value) ? value[0] ?? null : value
}

function mapListItem(
    course: CourseRow & {
        degree: (CourseRow["degree"] & {
            level?: { id: string; name: string } | null
            agent_commission?: number | null
            intake_starts_on?: string | null
        }) | null
        category?: string | null
    }
): UniversityProgramListItem {
    const degree = course.degree

    return {
        id: course.id,
        name: course.name,
        category: course.category ?? (typeof degree?.name === "string" ? degree.name : null),
        level_name: degree?.level?.name ?? null,
        intake_label: buildIntakeLabel(degree ?? undefined),
        deadline_label: formatDeadlineLabel(course.deadline_date),
        location: typeof degree?.location === "string" ? degree.location : null,
        duration: typeof degree?.duration === "string" ? degree.duration : null,
        tuition_fees: typeof degree?.fees === "string" ? degree.fees : null,
        agent_commission:
            typeof degree?.agent_commission === "number" ? degree.agent_commission : null,
        created_at: course.created_at,
        updated_at: course.updated_at,
    }
}

export async function fetchUniversityProgramList(params: {
    q?: string
    level_id?: string
    page?: number
    limit?: number
    universityIds?: string[] | null
}): Promise<UniversityProgramListResponse> {
    const supabase = await createSupabaseServerClient()
    const page = params.page ?? 1
    const limit = params.limit ?? 10

    const rpcResult = await rpcUniversityProgramsList(supabase, {
        universityIds: params.universityIds ?? null,
        q: params.q,
        level_id: params.level_id,
        page,
        limit,
    })

    const items: UniversityProgramListItem[] = rpcResult.data.map((course) => ({
        id: course.id,
        name: course.name,
        category: course.category,
        level_name: course.level_name,
        intake_label: course.intake_label,
        deadline_label: course.deadline_label,
        location: course.location,
        duration: course.duration,
        tuition_fees: course.tuition_fees,
        agent_commission: course.agent_commission,
        created_at: course.created_at,
        updated_at: course.updated_at,
    }))

    return {
        data: items,
        pagination: rpcResult.pagination,
    }
}

export async function fetchUniversityProgramDetail(
    courseId: string
): Promise<UniversityProgramDetail | null> {
    const supabase = await createSupabaseServerClient()

    const { data: course, error } = await supabase
        .from("course")
        .select(
            `
            id,
            name,
            deadline_date,
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
            status,
            degree:degree_id (
                id,
                name,
                location,
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
                    is_deleted,
                    requirement_type,
                    document_type:document_type_id ( name )
                )
            )
        `
        )
        .eq("id", courseId)
        .eq("is_deleted", false)
        .maybeSingle()

    if (error || !course) {
        return null
    }

    const degree = Array.isArray(course.degree) ? course.degree[0] : course.degree
    const documentRequirements = (degree?.requirements ?? [])
        .filter(
            (row: {
                id: string
                document_type_id: string
                is_deleted?: boolean | null
                requirement_type?: "REQUIRED" | "OPTIONAL" | null
                document_type: { name: string | null } | { name: string | null }[] | null
            }) => !row.is_deleted
        )
        .map(
        (row: {
            id: string
            document_type_id: string
            is_deleted?: boolean | null
            requirement_type?: "REQUIRED" | "OPTIONAL" | null
            document_type: { name: string | null } | { name: string | null }[] | null
        }) => {
            const documentType = unwrapRelation(row.document_type)

            return {
                id: row.id,
                document_type_id: row.document_type_id,
                name: documentType?.name ?? null,
                requirement_type: row.requirement_type ?? "REQUIRED",
            }
        }
    )

    return {
        id: course.id,
        status: course.status ?? "ACTIVE",
        name: course.name,
        category: course.category ?? null,
        tuition_fees: degree?.fees ?? null,
        agent_commission: degree?.agent_commission ?? null,
        location: course.location ?? degree?.location ?? null,
        program_length: course.program_length ?? degree?.duration ?? null,
        study_type: (degree?.study_mode as "full_time" | "part_time" | null) ?? null,
        intake_date: degree?.intake_starts_on ?? null,
        application_deadline: course.deadline_date,
        level_id: degree?.level_id ?? null,
        program_detail: course.program_detail ?? null,
        admission_requirements: course.admission_requirements ?? null,
        perspectives: course.perspectives ?? null,
        prospects_after_graduation: course.prospects_after_graduation ?? null,
        competency_model: course.competency_model ?? null,
        professional_skills: course.professional_skills ?? null,
        management_skills: course.management_skills ?? null,
        document_type_ids: documentRequirements.map((item) => item.document_type_id),
        document_requirements: documentRequirements,
    }
}

type ProgramWriteClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function getProgramWriteClient(): Promise<ProgramWriteClient> {
    const serviceClient = tryCreateSupabaseServiceClient()
    if (serviceClient) {
        return serviceClient as ProgramWriteClient
    }

    return createSupabaseServerClient()
}

async function syncDegreeDocumentRequirements(
    writeClient: ProgramWriteClient,
    degreeId: string | null | undefined,
    documentRequirements?: Array<{ document_type_id: string; requirement_type: "REQUIRED" | "OPTIONAL" }>
) {
    if (!documentRequirements || !degreeId) return

    const uniqueReqs = documentRequirements.filter(
        (req, index, self) =>
            req.document_type_id &&
            index === self.findIndex((r) => r.document_type_id === req.document_type_id)
    )
    const now = new Date().toISOString()

    const { data: existingRows, error: existingError } = await writeClient
        .from("degree_requirement")
        .select("id, document_type_id, is_deleted")
        .eq("degree_id", degreeId)

    if (existingError) {
        throw new Error(existingError.message)
    }

    const existingByTypeId = new Map(
        (existingRows ?? []).map((row) => [row.document_type_id, row])
    )
    const selectedTypeIds = new Set(uniqueReqs.map((req) => req.document_type_id))

    const toSoftDelete = (existingRows ?? []).filter(
        (row) => !selectedTypeIds.has(row.document_type_id) && !row.is_deleted
    )

    if (toSoftDelete.length > 0) {
        const { error: softDeleteError } = await writeClient
            .from("degree_requirement")
            .update({ is_deleted: true, updated_at: now })
            .in(
                "id",
                toSoftDelete.map((row) => row.id)
            )

        if (softDeleteError) {
            throw new Error(softDeleteError.message)
        }
    }

    for (const req of uniqueReqs) {
        const existing = existingByTypeId.get(req.document_type_id)

        if (existing) {
            const { error: updateError } = await writeClient
                .from("degree_requirement")
                .update({
                    is_deleted: false,
                    requirement_type: req.requirement_type,
                    updated_at: now,
                })
                .eq("id", existing.id)

            if (updateError) {
                throw new Error(updateError.message)
            }
            continue
        }

        const { error: insertError } = await writeClient.from("degree_requirement").insert({
            degree_id: degreeId,
            document_type_id: req.document_type_id,
            requirement_type: req.requirement_type,
            is_deleted: false,
        })

        if (insertError) {
            throw new Error(insertError.message)
        }
    }
}

function buildCourseContentPayload(payload: UniversityProgramUpsert) {
    return {
        name: payload.name,
        category: payload.category ?? null,
        location: payload.location ?? null,
        program_length: payload.program_length ?? null,
        program_detail: payload.program_detail ?? null,
        admission_requirements: payload.admission_requirements ?? null,
        perspectives: payload.perspectives ?? null,
        prospects_after_graduation: payload.prospects_after_graduation ?? null,
        competency_model: payload.competency_model ?? null,
        professional_skills: payload.professional_skills ?? null,
        management_skills: payload.management_skills ?? null,
        deadline_date: payload.application_deadline ?? null,
        status: "ACTIVE" as const,
    }
}

export async function createUniversityProgram(params: {
    ownerProfileId: string
    payload: UniversityProgramUpsert
}) {
    const writeClient = await getProgramWriteClient()
    const { payload, ownerProfileId } = params

    const { data: degree, error: degreeError } = await writeClient
        .from("degree")
        .insert({
            name: payload.category?.trim() || payload.name,
            location: payload.location ?? null,
            duration: payload.program_length ?? null,
            fees: payload.tuition_fees ?? null,
            study_mode: payload.study_type ?? null,
            intake_starts_on: payload.intake_date ?? null,
            agent_commission: payload.agent_commission ?? null,
            level_id: payload.level_id ?? null,
        })
        .select("id")
        .single()

    if (degreeError || !degree) {
        throw new Error(degreeError?.message ?? "Failed to create degree")
    }

    const { data: course, error: courseError } = await writeClient
        .from("course")
        .insert({
            ...buildCourseContentPayload(payload),
            degree_id: degree.id,
            profile_id: ownerProfileId,
        })
        .select("id")
        .single()

    if (courseError || !course) {
        throw new Error(courseError?.message ?? "Failed to create course")
    }

    await syncDegreeDocumentRequirements(writeClient, degree.id, payload.document_requirements)

    return { courseId: course.id }
}

export async function updateUniversityProgram(params: {
    courseId: string
    ownerProfileId: string
    payload: UniversityProgramUpsert
}) {
    const writeClient = await getProgramWriteClient()
    const existing = await fetchUniversityProgramDetail(params.courseId)

    if (!existing) {
        throw new Error("Program not found")
    }

    const { data: course } = await writeClient
        .from("course")
        .select("degree_id")
        .eq("id", params.courseId)
        .single()

    if (course?.degree_id) {
        const { error: degreeError } = await writeClient
            .from("degree")
            .update({
                name: params.payload.category?.trim() || params.payload.name,
                location: params.payload.location ?? null,
                duration: params.payload.program_length ?? null,
                fees: params.payload.tuition_fees ?? null,
                study_mode: params.payload.study_type ?? null,
                intake_starts_on: params.payload.intake_date ?? null,
                agent_commission: params.payload.agent_commission ?? null,
                level_id: params.payload.level_id ?? null,
            })
            .eq("id", course.degree_id)

        if (degreeError) {
            throw new Error(degreeError.message)
        }
    }

    const { error: courseError } = await writeClient
        .from("course")
        .update({
            ...buildCourseContentPayload(params.payload),
            profile_id: params.ownerProfileId,
        })
        .eq("id", params.courseId)

    if (courseError) {
        throw new Error(courseError.message)
    }

    await syncDegreeDocumentRequirements(
        writeClient,
        course?.degree_id,
        params.payload.document_requirements
    )

    return { courseId: params.courseId }
}

export async function softDeleteUniversityProgram(courseId: string) {
    const writeClient = await getProgramWriteClient()
    const { data, error } = await writeClient
        .from("course")
        .update({
            is_deleted: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
        .eq("is_deleted", false)
        .select("id")
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error("Program not found")
    }

    return { courseId: data.id }
}

async function resolveOwnerProfileId(userId: string, role: string, payload: UniversityProgramUpsert) {
    if (isUniversityRole(role)) {
        return userId
    }

    if (payload.university_profile_id) {
        return payload.university_profile_id
    }

    const supabase = await createSupabaseServerClient()
    const { data: universityProfile } = await supabase
        .from("profile")
        .select("id")
        .in("role", [Role.ADMIN, Role.MANAGEMENT])
        .limit(1)
        .maybeSingle()

    if (!universityProfile?.id) {
        throw new Error("No university profile found for program ownership")
    }

    return universityProfile.id
}

export async function fetchUniversityProgramsForPage(params?: {
    q?: string
    level_id?: string
    page?: number
    limit?: number
}) {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (!isUniversityStaffRole(profile?.role)) {
        return null
    }

    return fetchUniversityProgramList(params ?? {})
}

export async function fetchUniversityProgramDetailForPage(courseId: string) {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (!isUniversityStaffRole(profile?.role)) {
        return null
    }

    return fetchUniversityProgramDetail(courseId)
}

export async function saveUniversityProgramForPage(params: {
    courseId?: string
    payload: UniversityProgramUpsert
}) {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Unauthorized")
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (!isUniversityStaffRole(profile?.role)) {
        throw new Error("Forbidden")
    }

    const ownerProfileId = await resolveOwnerProfileId(user.id, profile?.role ?? "", params.payload)

    if (params.courseId) {
        return updateUniversityProgram({
            courseId: params.courseId,
            ownerProfileId,
            payload: params.payload,
        })
    }

    return createUniversityProgram({
        ownerProfileId,
        payload: params.payload,
    })
}
