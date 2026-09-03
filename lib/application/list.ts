import type { SupabaseClient } from "@supabase/supabase-js"
import {
    buildAgentApplicationOrFilter,
    resolveAgentStudentProfileIds,
} from "@/lib/api/agent-applications"
import { getMandatoryDocumentTypeIds } from "@/lib/utils/course-documents"
import { formatFullName } from "@/lib/utils/profile"
import type {
    ApplicationListAgent,
    ApplicationListItem,
    ApplicationListProfile,
    ApplicationListQuery,
    ApplicationListResponse,
    ApplicationListStats,
    ApplicationProfileRole,
} from "@/types/schemas/application"
import type { Database, Tables } from "@/types/supabase"
import { isUniversityRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role"
import { loadRejectionHistoryByApplicationIds } from "@/lib/application/review-meta"
import { resolveUniversityApplicationScope } from "@/lib/auth/university-scope"

/** Lean select for list views — avoids full program content + level joins. */
const APPLICATION_LIST_COURSE_SELECT = `
    id,
    name,
    deadline_date,
    degree:degree_id (
        id,
        name,
        fees,
        intake_date,
        requirements:degree_requirement (
            requirement_type,
            is_deleted,
            document_type:document_type_id (
                id
            )
        )
    )
`

const APPLICATION_LIST_SELECT = `
    id,
    application_no,
    status,
    created_at,
    course_id,
    student:profile_id ( id, first_name, last_name, avatar_url, email ),
    agent:submitted_by_profile_id ( id, first_name, last_name )
`

type ApplicationListRow = Pick<
    Tables<"application">,
    "id" | "application_no" | "status" | "created_at" | "course_id"
> & {
    student: ApplicationListProfile | null
    agent: ApplicationListAgent | null
}

type ApplicationFilterContext = {
    userId: string
    role: string
    studentId?: string
    dateFrom?: string
    dateTo?: string
    filteredCourseIds?: string[] | null
    filteredProfileIds?: string[] | null
    agentStudentProfileIds?: string[] | null
    scope?: "all"
    universityScopeIds?: string[] | null
}

const EMPTY_APPLICATION_STATS: ApplicationListStats = {
    total: 0,
    pending: 0,
    accepted: 0,
}

async function attachStudentCodes(
    supabase: SupabaseClient<Database>,
    profileIds: string[]
) {
    if (profileIds.length === 0) {
        return new Map<string, string | null>()
    }

    const { data: students, error } = await supabase
        .from("student")
        .select("profile_id, student_code")
        .in("profile_id", profileIds)

    if (error) {
        throw error
    }

    return new Map(
        (students ?? []).map((student) => [student.profile_id, student.student_code])
    )
}

function getRequiredDocumentTypeIds(
    degree: {
        requirements?: Array<{
            requirement_type?: "REQUIRED" | "OPTIONAL" | null
            document_type?: { id: string } | null
        }> | null
    } | null
): string[] {
    if (!degree?.requirements?.length) return []

    return getMandatoryDocumentTypeIds(degree.requirements)
}

function computeDocumentVault(
    profileId: string | undefined,
    requiredTypeIds: string[],
    uploadedByProfile: Map<string, Set<string>>
) {
    const total = requiredTypeIds.length

    if (!profileId || total === 0) {
        return {
            documents_uploaded_count: 0,
            total_required_documents: total,
            document_vault_percentage: total === 0 ? 100 : 0,
        }
    }

    const uploadedSet = uploadedByProfile.get(profileId) ?? new Set<string>()
    const uploadedCount = requiredTypeIds.filter((id) => uploadedSet.has(id)).length

    return {
        documents_uploaded_count: uploadedCount,
        total_required_documents: total,
        document_vault_percentage: Math.round((uploadedCount / total) * 100),
    }
}

async function buildUploadedDocumentsByProfile(
    supabase: SupabaseClient<Database>,
    profileIds: string[]
) {
    const uploadedByProfile = new Map<string, Set<string>>()

    if (profileIds.length === 0) {
        return uploadedByProfile
    }

    const { data: documents, error } = await supabase
        .from("document")
        .select("profile_id, document_type_id")
        .in("profile_id", profileIds)
        .not("document_type_id", "is", null)

    if (error) {
        throw error
    }

    for (const doc of documents ?? []) {
        if (!doc.document_type_id) continue
        const existing = uploadedByProfile.get(doc.profile_id) ?? new Set<string>()
        existing.add(doc.document_type_id)
        uploadedByProfile.set(doc.profile_id, existing)
    }

    return uploadedByProfile
}

async function buildOffersByApplicationId(
    supabase: SupabaseClient<Database>,
    applicationIds: string[]
) {
    const offerByApplicationId = new Map<string, Pick<Tables<"offer_letter">, "status">>()

    if (applicationIds.length === 0) {
        return offerByApplicationId
    }

    const { data: offers, error } = await supabase
        .from("offer_letter")
        .select("application_id, status")
        .in("application_id", applicationIds)

    if (error) {
        throw error
    }

    for (const offer of offers ?? []) {
        offerByApplicationId.set(offer.application_id, { status: offer.status })
    }
    return offerByApplicationId
}

type ApplicationListCourseRow = {
    id: string
    name: string
    deadline_date: string | null
    degree:
        | (Pick<Tables<"degree">, "id" | "name" | "fees" | "intake_date"> & {
              requirements?: Array<{
                  requirement_type?: "REQUIRED" | "OPTIONAL" | null
                  document_type?: { id: string } | null
              }> | null
          })
        | null
}

async function attachCoursesToApplications(
    supabase: SupabaseClient<Database>,
    applications: ApplicationListRow[]
): Promise<ApplicationListItem[]> {
    const profileIds = [
        ...new Set(
            applications
                .map((application) => application.student?.id)
                .filter((id): id is string => Boolean(id))
        ),
    ]
    const applicationIds = applications.map((application) => application.id)
    const courseIds = [
        ...new Set(applications.map((application) => application.course_id).filter(Boolean)),
    ]

    const [studentCodeByProfile, offerByApplicationId, uploadedByProfile, coursesResult] =
        await Promise.all([
            attachStudentCodes(supabase, profileIds),
            buildOffersByApplicationId(supabase, applicationIds),
            buildUploadedDocumentsByProfile(supabase, profileIds),
            courseIds.length === 0
                ? Promise.resolve({ data: [] as ApplicationListCourseRow[], error: null })
                : supabase
                      .from("course")
                      .select(APPLICATION_LIST_COURSE_SELECT)
                      .in("id", courseIds),
        ])

    if (coursesResult.error) {
        throw coursesResult.error
    }

    const courseById = new Map(
        ((coursesResult.data ?? []) as ApplicationListCourseRow[]).map((course) => [
            course.id,
            course,
        ])
    )

    return applications.map((application) => {
        const course = courseById.get(application.course_id) ?? null
        const degree = course?.degree ?? null
        const requiredTypeIds = getRequiredDocumentTypeIds(degree)
        const vault = computeDocumentVault(
            application.student?.id,
            requiredTypeIds,
            uploadedByProfile
        )
        const offer = offerByApplicationId.get(application.id)

        return {
            id: application.id,
            application_no: application.application_no,
            status: application.status,
            created_at: application.created_at,
            offer_letter: offer ?? null,
            ...vault,
            student: application.student
                ? {
                      ...application.student,
                      student_code:
                          studentCodeByProfile.get(application.student.id) ?? null,
                  }
                : null,
            agent: application.agent,
            course: course
                ? {
                      id: course.id,
                      name: course.name,
                      deadline_date: course.deadline_date,
                      degree: degree
                          ? {
                                id: degree.id,
                                name: degree.name,
                                fees: degree.fees,
                                intake_date: degree.intake_date,
                            }
                          : null,
                  }
                : null,
            rejection_history: [],
        }
    })
}

async function resolveCourseIdsForDegree(
    supabase: SupabaseClient<Database>,
    degreeId: string
) {
    const { data: courses, error } = await supabase
        .from("course")
        .select("id")
        .eq("degree_id", degreeId)

    if (error) {
        throw error
    }

    return (courses ?? []).map((course) => course.id)
}

async function resolveMatchingStudentProfileIds(
    supabase: SupabaseClient<Database>,
    searchTerm: string,
    options: {
        role: string
        userId: string
        studentId?: string
        scope?: "all"
    }
) {
    if (options.studentId) {
        return [options.studentId]
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
        return []
    }

    const escaped = normalizedSearch.replace(/[%_,]/g, "\\$&")
    const pattern = `%${escaped}%`

    if (options.role === Role.STUDENT) {
        const { data: profile, error } = await supabase
            .from("profile")
            .select("id, first_name, last_name, email")
            .eq("id", options.userId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!profile) {
            return []
        }

        const { data: studentRow } = await supabase
            .from("student")
            .select("student_code")
            .eq("profile_id", options.userId)
            .maybeSingle()

        const haystack = [
            formatFullName(profile.first_name, profile.last_name),
            profile.email ?? "",
            studentRow?.student_code ?? "",
            profile.id,
        ]
            .join(" ")
            .toLowerCase()

        return haystack.includes(normalizedSearch) ? [profile.id] : []
    }

    let allowedProfileIds: string[] | null = null

    if (options.role === Role.AGENT && options.scope !== "all") {
        const { data: agentRow, error: agentError } = await supabase
            .from("agent")
            .select("id")
            .eq("profile_id", options.userId)
            .maybeSingle()

        if (agentError) {
            throw agentError
        }

        if (!agentRow) {
            return []
        }

        const { data: students, error: studentsError } = await supabase
            .from("student")
            .select("profile_id")
            .eq("created_by_agent_id", agentRow.id)

        if (studentsError) {
            throw studentsError
        }

        allowedProfileIds = (students ?? [])
            .map((student) => student.profile_id)
            .filter(Boolean)

        if (allowedProfileIds.length === 0) {
            return []
        }
    }

    const profileIds = new Set<string>()

    let profileQuery = supabase
        .from("profile")
        .select("id, first_name, last_name, email")
        .or(
            `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},id.ilike.${pattern}`
        )

    if (allowedProfileIds) {
        profileQuery = profileQuery.in("id", allowedProfileIds)
    }

    const { data: profiles, error } = await profileQuery

    if (error) {
        throw error
    }

    for (const profile of profiles ?? []) {
        const haystack = [
            formatFullName(profile.first_name, profile.last_name),
            profile.email ?? "",
            profile.id,
        ]
            .join(" ")
            .toLowerCase()

        if (haystack.includes(normalizedSearch)) {
            profileIds.add(profile.id)
        }
    }

    let studentQuery = supabase
        .from("student")
        .select("profile_id, student_code")
        .ilike("student_code", pattern)

    if (allowedProfileIds) {
        studentQuery = studentQuery.in("profile_id", allowedProfileIds)
    }

    const { data: studentsByCode, error: studentsByCodeError } = await studentQuery

    if (studentsByCodeError) {
        throw studentsByCodeError
    }

    for (const student of studentsByCode ?? []) {
        if (!student.profile_id) continue

        const codeHaystack = [student.student_code, student.profile_id]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

        if (codeHaystack.includes(normalizedSearch)) {
            profileIds.add(student.profile_id)
        }
    }

    return Array.from(profileIds)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyApplicationFilters(query: any, ctx: ApplicationFilterContext) {
    let nextQuery = query

    if (ctx.studentId) {
        nextQuery = nextQuery.eq("profile_id", ctx.studentId)
    } else if (ctx.scope === "all") {
        // All Application View — no role-based row restriction
    } else if (ctx.role === Role.STUDENT) {
        nextQuery = nextQuery.eq("profile_id", ctx.userId)
    } else if (ctx.role === Role.AGENT) {
        const studentProfileIds = ctx.agentStudentProfileIds ?? []
        nextQuery = nextQuery.or(
            buildAgentApplicationOrFilter(ctx.userId, studentProfileIds)
        )
    } else if (isUniversityRole(ctx.role)) {
        if (ctx.universityScopeIds?.length === 1) {
            nextQuery = nextQuery.eq("university_id", ctx.universityScopeIds[0])
        } else if (ctx.universityScopeIds && ctx.universityScopeIds.length > 1) {
            nextQuery = nextQuery.in("university_id", ctx.universityScopeIds)
        } else {
            nextQuery = nextQuery.eq("university_id", ctx.userId)
        }
    }

    if (ctx.dateFrom) {
        nextQuery = nextQuery.gte("created_at", `${ctx.dateFrom}T00:00:00.000Z`)
    }

    if (ctx.dateTo) {
        nextQuery = nextQuery.lte("created_at", `${ctx.dateTo}T23:59:59.999Z`)
    }

    if (ctx.filteredCourseIds) {
        nextQuery = nextQuery.in("course_id", ctx.filteredCourseIds)
    }

    if (ctx.filteredProfileIds) {
        nextQuery = nextQuery.in("profile_id", ctx.filteredProfileIds)
    }

    return nextQuery
}

async function fetchApplicationStats(
    supabase: SupabaseClient<Database>,
    ctx: ApplicationFilterContext
): Promise<ApplicationListStats> {
    const baseQuery = applyApplicationFilters(
        supabase.from("application").select("id", { count: "exact", head: true }),
        ctx
    )

    const [totalResult, pendingResult, acceptedResult] = await Promise.all([
        baseQuery,
        applyApplicationFilters(
            supabase.from("application").select("id", { count: "exact", head: true }),
            ctx
        ).eq("status", "PENDING"),
        applyApplicationFilters(
            supabase.from("application").select("id", { count: "exact", head: true }),
            ctx
        ).eq("status", "APPROVED"),
    ])

    if (totalResult.error) throw totalResult.error
    if (pendingResult.error) throw pendingResult.error
    if (acceptedResult.error) throw acceptedResult.error

    return {
        total: totalResult.count ?? 0,
        pending: pendingResult.count ?? 0,
        accepted: acceptedResult.count ?? 0,
    }
}

export type FetchApplicationsListOptions = ApplicationListQuery & {
    userId: string
    role: ApplicationProfileRole
}

export async function fetchApplicationsList(
    supabase: SupabaseClient<Database>,
    options: FetchApplicationsListOptions
): Promise<ApplicationListResponse | { error: string }> {
    const {
        userId,
        role,
        student_id: studentId,
        page: pageOption,
        limit: limitOption,
        status,
        degree_id: degreeId,
        date_from: dateFrom,
        date_to: dateTo,
        q: searchTerm,
        scope: listScope,
    } = options

    if (listScope === "all" && role === Role.STUDENT) {
        return { error: "Forbidden" }
    }

    const page = pageOption
    const pageSize = limitOption
    const usePagination = page != null && pageSize != null

    const emptyResult = (): ApplicationListResponse => ({
        data: [],
        stats: EMPTY_APPLICATION_STATS,
        role,
        ...(usePagination
            ? {
                  pagination: {
                      total: 0,
                      page: 1,
                      limit: pageSize,
                      totalPages: 0,
                  },
              }
            : {}),
    })

    let filteredCourseIds: string[] | null = null
    let filteredProfileIds: string[] | null = null
    let agentStudentProfileIds: string[] | null = null
    let universityScopeIds: string[] | null | undefined

    try {
        const [agentIdsResult, courseIdsResult, profileIdsResult, universityScopeResult] =
            await Promise.all([
                role === Role.AGENT && !studentId && listScope !== "all"
                    ? resolveAgentStudentProfileIds(supabase, userId)
                    : Promise.resolve(null),
                degreeId
                    ? resolveCourseIdsForDegree(supabase, degreeId)
                    : Promise.resolve(null),
                searchTerm
                    ? resolveMatchingStudentProfileIds(supabase, searchTerm, {
                          role,
                          userId,
                          studentId,
                          scope: listScope,
                      })
                    : Promise.resolve(null),
                isUniversityRole(role) && listScope !== "all"
                    ? resolveUniversityApplicationScope(supabase, userId, role)
                    : Promise.resolve(null),
            ])

        agentStudentProfileIds = agentIdsResult
        filteredCourseIds = courseIdsResult
        filteredProfileIds = profileIdsResult
        universityScopeIds = universityScopeResult?.universityIds
    } catch (resolveError) {
        console.error("[fetchApplicationsList] resolve filters", resolveError)
        return emptyResult()
    }

    if (degreeId && (!filteredCourseIds || filteredCourseIds.length === 0)) {
        return emptyResult()
    }

    if (searchTerm && (!filteredProfileIds || filteredProfileIds.length === 0)) {
        return emptyResult()
    }

    const filterContext: ApplicationFilterContext = {
        userId,
        role,
        studentId,
        dateFrom,
        dateTo,
        filteredCourseIds,
        filteredProfileIds,
        agentStudentProfileIds,
        scope: listScope,
        universityScopeIds,
    }

    // Dashboard recent lists (`limit` without `page`) do not use stats — skip 3 count queries.
    const needsStats = pageOption != null || limitOption == null

    let query = applyApplicationFilters(
        supabase
            .from("application")
            .select(APPLICATION_LIST_SELECT, usePagination ? { count: "exact" } : undefined),
        filterContext
    ).order("created_at", { ascending: false })

    if (status && status !== "all") {
        query = query.eq("status", status)
    }

    if (usePagination) {
        const safePage = Math.max(1, page!)
        const from = (safePage - 1) * pageSize!
        const to = from + pageSize! - 1
        query = query.range(from, to)
    } else if (pageSize) {
        query = query.limit(pageSize)
    }

    const [statsResult, listResult] = await Promise.all([
        needsStats
            ? fetchApplicationStats(supabase, filterContext).catch((statsError) => {
                  console.error("[fetchApplicationsList] stats", statsError)
                  return EMPTY_APPLICATION_STATS
              })
            : Promise.resolve(EMPTY_APPLICATION_STATS),
        query,
    ])

    const stats = statsResult
    const { data: applications, error, count } = listResult

    if (error) {
        return { error: error.message }
    }

    let result: ApplicationListItem[]
    try {
        const applicationRows = (applications ?? []) as unknown as ApplicationListRow[]
        const applicationIds = applicationRows.map((application) => application.id)

        const [enrichedApplications, rejectionHistoryByApplicationId] = await Promise.all([
            attachCoursesToApplications(supabase, applicationRows),
            loadRejectionHistoryByApplicationIds(supabase, applicationIds),
        ])

        result = enrichedApplications.map((application) => ({
            ...application,
            rejection_history: rejectionHistoryByApplicationId.get(application.id) ?? [],
        }))
    } catch (attachError) {
        console.error("[fetchApplicationsList] attach courses", attachError)
        return { error: "Failed to load application courses" }
    }

    if (!usePagination) {
        return { data: result, stats, role }
    }

    const total = count ?? 0
    const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize))
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1

    return {
        data: result,
        stats,
        role,
        pagination: {
            total,
            page: safePage,
            limit: pageSize,
            totalPages,
        },
    }
}
