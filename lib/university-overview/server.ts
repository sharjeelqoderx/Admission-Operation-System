import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { formatFullName } from "@/lib/utils/profile"
import { resolveStudentPipelineStatus } from "@/lib/student/pipeline-status"
import type {
    OverviewChartPoint,
    OverviewTrendPoint,
    UniversityOverview,
} from "@/types/schemas/university-overview"
import type { StudentPipelineStatus } from "@/types/schemas/university-student"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    applyUniversityIdFilter,
    resolveUniversityApplicationScope,
    type UniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { Role } from "@/types/enums/role"

type ApplicationRow = {
    id: string
    profile_id: string
    application_no: string | null
    status: string
    created_at: string
    course_id: string
}

type OfferRow = {
    id: string
    application_id: string
    status: string
    created_at: string
}

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000"
const RECENT_LIMIT = 5
const TREND_MONTHS = 6

const APPLICATION_STATUS_ORDER = ["PENDING", "NEEDS_REVISION", "APPROVED", "REJECTED"] as const
const OFFER_STATUS_ORDER = ["PENDING", "ACCEPTED", "REJECTED"] as const
const PIPELINE_STATUS_ORDER: StudentPipelineStatus[] = [
    "Created",
    "Contract Sent",
    "Signed",
    "Completed",
    "Rejected",
]
const PROGRAM_STATUS_ORDER = ["ACTIVE", "INACTIVE"] as const
const DOCUMENT_STATUS_ORDER = [
    "PENDING",
    "VERIFIED",
    "APPROVED",
    "NEEDS_REVISION",
    "ACTION_REQUIRED",
    "REJECTED",
] as const

function formatSubmissionDate(value?: string | null) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatShortDate(value?: string | null) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function getProgramName(course?: CourseRow | null): string | null {
    if (!course) return null
    const degreeName = course.degree?.name
    return typeof degreeName === "string" ? degreeName : typeof course.name === "string" ? course.name : null
}

function isActiveApplication(applicationStatus: string, pipelineStatus: string) {
    if (applicationStatus === "REJECTED" || applicationStatus === "APPROVED") {
        return false
    }

    return pipelineStatus !== "Completed" && pipelineStatus !== "Signed"
}

function formatStatusLabel(status: string) {
    return status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function countByKey(items: string[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const item of items) {
        counts.set(item, (counts.get(item) ?? 0) + 1)
    }
    return counts
}

function toOrderedChartPoints(
    counts: Map<string, number>,
    order: readonly string[],
    formatLabel: (key: string) => string = formatStatusLabel
): OverviewChartPoint[] {
    const known = new Set(order)
    const points: OverviewChartPoint[] = order.map((key) => ({
        name: formatLabel(key),
        value: counts.get(key) ?? 0,
    }))

    for (const [key, value] of counts.entries()) {
        if (!known.has(key) && value > 0) {
            points.push({ name: formatLabel(key), value })
        }
    }

    return points.filter((point) => point.value > 0)
}

function buildMonthlyTrend(
    applications: ApplicationRow[],
    offers: OfferRow[]
): OverviewTrendPoint[] {
    const now = new Date()
    const buckets: Array<OverviewTrendPoint & { key: string }> = []

    for (let offset = TREND_MONTHS - 1; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        buckets.push({
            key,
            month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            applications: 0,
            offers: 0,
        })
    }

    const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index] as const))

    for (const application of applications) {
        const created = new Date(application.created_at)
        if (Number.isNaN(created.getTime())) continue
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`
        const index = indexByKey.get(key)
        if (index === undefined) continue
        buckets[index].applications += 1
    }

    for (const offer of offers) {
        const created = new Date(offer.created_at)
        if (Number.isNaN(created.getTime())) continue
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`
        const index = indexByKey.get(key)
        if (index === undefined) continue
        buckets[index].offers += 1
    }

    return buckets.map(({ month, applications: applicationCount, offers: offerCount }) => ({
        month,
        applications: applicationCount,
        offers: offerCount,
    }))
}

async function loadCoursesById(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, courseIds: string[]) {
    if (courseIds.length === 0) {
        return new Map<string, CourseRow>()
    }

    const { data, error } = await supabase
        .from("course")
        .select(COURSE_SELECT)
        .in("id", courseIds)

    if (error) {
        throw new Error(error.message)
    }

    const courses = await attachLevelsToCourses(supabase, (data ?? []) as unknown as CourseRow[])
    return new Map(courses.map((course) => [course.id, course]))
}

export async function fetchUniversityOverview(
    universityScope?: UniversityApplicationScope
): Promise<UniversityOverview> {
    const supabase = await createSupabaseServerClient()

    let applicationsQuery = supabase
        .from("application")
        .select("id, profile_id, application_no, status, created_at, course_id")
        .order("created_at", { ascending: false })

    if (universityScope) {
        applicationsQuery = applyUniversityIdFilter(
            applicationsQuery,
            "university_id",
            universityScope
        )
    }

    const { data: applications, error: applicationsError } = await applicationsQuery

    if (applicationsError) {
        throw new Error(applicationsError.message)
    }

    const applicationRows = (applications ?? []) as ApplicationRow[]
    const applicationIds = applicationRows.map((application) => application.id)
    const profileIds = [...new Set(applicationRows.map((application) => application.profile_id))]
    const courseIds = [...new Set(applicationRows.map((application) => application.course_id))]

    let programsCountQuery = supabase
        .from("course")
        .select("id", { count: "exact", head: true })
        .eq("is_deleted", false)
    let programsRecentQuery = supabase
        .from("course")
        .select("id, name, category, status, created_at")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT)
    let programsStatusQuery = supabase
        .from("course")
        .select("status")
        .eq("is_deleted", false)

    if (universityScope) {
        programsCountQuery = applyUniversityIdFilter(
            programsCountQuery,
            "profile_id",
            universityScope
        )
        programsRecentQuery = applyUniversityIdFilter(
            programsRecentQuery,
            "profile_id",
            universityScope
        )
        programsStatusQuery = applyUniversityIdFilter(
            programsStatusQuery,
            "profile_id",
            universityScope
        )
    }

    const [
        offersResult,
        templatesCountResult,
        templatesRecentResult,
        programsCountResult,
        programsRecentResult,
        programsStatusResult,
        documentsCountResult,
        documentsRecentResult,
        documentsStatusResult,
        profilesResult,
        agentsResult,
        courseById,
    ] = await Promise.all([
        supabase
            .from("offer_letter")
            .select("id, application_id, status, created_at")
            .in("application_id", applicationIds.length > 0 ? applicationIds : [EMPTY_UUID]),
        supabase
            .from("document_template")
            .select("id", { count: "exact", head: true })
            .eq("is_deleted", false),
        supabase
            .from("document_template")
            .select("id, title, updated_at")
            .eq("is_deleted", false)
            .order("updated_at", { ascending: false })
            .limit(RECENT_LIMIT),
        programsCountQuery,
        programsRecentQuery,
        programsStatusQuery,
        profileIds.length > 0
            ? supabase
                  .from("document")
                  .select("id", { count: "exact", head: true })
                  .in("profile_id", profileIds)
            : Promise.resolve({ count: 0, error: null }),
        profileIds.length > 0
            ? supabase
                  .from("document")
                  .select(`
                    id,
                    profile_id,
                    created_at,
                    document_type:document_type_id(name),
                    document_review(status, created_at)
                `)
                  .in("profile_id", profileIds)
                  .order("created_at", { ascending: false })
                  .limit(RECENT_LIMIT)
            : Promise.resolve({ data: [], error: null }),
        profileIds.length > 0
            ? supabase
                  .from("document")
                  .select("id, document_review(status, created_at)")
                  .in("profile_id", profileIds)
            : Promise.resolve({ data: [], error: null }),
        profileIds.length > 0
            ? supabase
                  .from("profile")
                  .select("id, first_name, last_name")
                  .in("id", profileIds)
            : Promise.resolve({ data: [], error: null }),
        supabase.from("agent").select("id, profile:profile_id(role)"),
        loadCoursesById(supabase, courseIds),
    ])

    if (offersResult.error) throw new Error(offersResult.error.message)
    if (templatesCountResult.error) throw new Error(templatesCountResult.error.message)
    if (templatesRecentResult.error) throw new Error(templatesRecentResult.error.message)
    if (programsCountResult.error) throw new Error(programsCountResult.error.message)
    if (programsRecentResult.error) throw new Error(programsRecentResult.error.message)
    if (programsStatusResult.error) throw new Error(programsStatusResult.error.message)
    if (documentsCountResult.error) throw new Error(documentsCountResult.error.message)
    if (documentsRecentResult.error) throw new Error(documentsRecentResult.error.message)
    if (documentsStatusResult.error) throw new Error(documentsStatusResult.error.message)
    if (profilesResult.error) throw new Error(profilesResult.error.message)
    if (agentsResult.error) throw new Error(agentsResult.error.message)

    const totalUniversityPartners = (agentsResult.data ?? []).filter((agent) => {
        const profile = Array.isArray(agent.profile) ? agent.profile[0] : agent.profile
        return profile?.role === Role.AGENT
    }).length

    const offers = (offersResult.data ?? []) as OfferRow[]
    const offerByApplicationId = new Map(offers.map((offer) => [offer.application_id, offer]))

    const profileById = new Map(
        (profilesResult.data ?? []).map((profile) => [
            profile.id,
            formatFullName(profile.first_name, profile.last_name),
        ])
    )

    const applicationItems = applicationRows.map((application) => {
        const offer = offerByApplicationId.get(application.id)
        const course = courseById.get(application.course_id)
        const pipelineStatus = resolveStudentPipelineStatus({
            applicationStatus: application.status,
            offerStatus: offer?.status,
            hasOffer: Boolean(offer),
        })

        return {
            application,
            offer,
            course,
            pipelineStatus,
            studentName: profileById.get(application.profile_id) ?? "Unknown Student",
        }
    })

    const activeApplications = applicationItems.filter((item) =>
        isActiveApplication(item.application.status, item.pipelineStatus)
    ).length

    const latestApplicationByProfile = new Map<string, (typeof applicationItems)[number]>()
    for (const item of applicationItems) {
        if (!latestApplicationByProfile.has(item.application.profile_id)) {
            latestApplicationByProfile.set(item.application.profile_id, item)
        }
    }

    const recentStudents = [...latestApplicationByProfile.values()]
        .slice(0, RECENT_LIMIT)
        .map((item) => ({
            profile_id: item.application.profile_id,
            name: item.studentName,
            program_name: getProgramName(item.course),
            pipeline_status: item.pipelineStatus,
            submission_date: formatSubmissionDate(item.application.created_at),
        }))

    const recentApplications = applicationItems.slice(0, RECENT_LIMIT).map((item) => ({
        id: item.application.id,
        student_name: item.studentName,
        program_name: getProgramName(item.course),
        pipeline_status: item.pipelineStatus,
        submission_date: formatSubmissionDate(item.application.created_at),
    }))

    const recentPrograms = (programsRecentResult.data ?? []).map((course) => ({
        id: course.id,
        name: course.name ?? "Untitled Program",
        category: course.category,
        status: course.status,
    }))

    const recentTemplates = (templatesRecentResult.data ?? []).map((template) => ({
        id: template.id,
        title: template.title,
        updated_at: formatShortDate(template.updated_at) ?? template.updated_at,
    }))

    const recentDocuments = (documentsRecentResult.data ?? []).map((document) => {
        const documentType = Array.isArray(document.document_type)
            ? document.document_type[0]
            : document.document_type
        const reviews = document.document_review as { status: string; created_at: string }[] | null
        const latestReview = reviews?.length
            ? [...reviews].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
            : null

        return {
            id: document.id,
            student_name: profileById.get(document.profile_id) ?? "Unknown Student",
            document_type: documentType?.name ?? null,
            status: latestReview?.status ?? null,
            created_at: formatShortDate(document.created_at),
        }
    })

    const recentOffers = offers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, RECENT_LIMIT)
        .map((offer) => {
            const applicationItem = applicationItems.find(
                (item) => item.application.id === offer.application_id
            )

            return {
                id: offer.id,
                student_name: applicationItem?.studentName ?? "Unknown Student",
                program_name: applicationItem ? getProgramName(applicationItem.course) : null,
                status: offer.status,
                created_at: formatShortDate(offer.created_at),
            }
        })

    const stats = {
        total_students: profileIds.length,
        total_university_partners: totalUniversityPartners,
        active_applications: activeApplications,
        total_applications: applicationRows.length,
        templates: templatesCountResult.count ?? 0,
        programs: programsCountResult.count ?? 0,
        total_documents: documentsCountResult.count ?? 0,
        total_offers: offers.length,
    }

    const documentStatuses = (documentsStatusResult.data ?? []).map((document) => {
        const reviews = document.document_review as { status: string; created_at: string }[] | null
        if (!reviews?.length) return "PENDING"
        const latestReview = [...reviews].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        return latestReview?.status ?? "PENDING"
    })

    const charts = {
        overview: [
            { name: "Students", value: stats.total_students },
            { name: "Active Apps", value: stats.active_applications },
            { name: "Applications", value: stats.total_applications },
            { name: "Programs", value: stats.programs },
            { name: "Documents", value: stats.total_documents },
            { name: "Offers", value: stats.total_offers },
            { name: "Partners", value: stats.total_university_partners },
            { name: "Templates", value: stats.templates },
        ],
        applications_by_status: toOrderedChartPoints(
            countByKey(applicationRows.map((application) => application.status)),
            APPLICATION_STATUS_ORDER
        ),
        pipeline: toOrderedChartPoints(
            countByKey(applicationItems.map((item) => item.pipelineStatus)),
            PIPELINE_STATUS_ORDER,
            (key) => key
        ),
        offers_by_status: toOrderedChartPoints(
            countByKey(offers.map((offer) => offer.status)),
            OFFER_STATUS_ORDER
        ),
        programs_by_status: toOrderedChartPoints(
            countByKey((programsStatusResult.data ?? []).map((course) => course.status)),
            PROGRAM_STATUS_ORDER
        ),
        documents_by_status: toOrderedChartPoints(
            countByKey(documentStatuses),
            DOCUMENT_STATUS_ORDER
        ),
        monthly_trend: buildMonthlyTrend(applicationRows, offers),
    }

    return {
        title: "University Dashboard",
        subtitle:
            "Charts across students, applications, programs, documents, and offers for your institution.",
        stats,
        charts,
        recent: {
            students: recentStudents,
            applications: recentApplications,
            programs: recentPrograms,
            templates: recentTemplates,
            documents: recentDocuments,
            offers: recentOffers,
        },
    }
}

export async function fetchUniversityOverviewForPage(): Promise<UniversityOverview | null> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    if (!isUniversityStaffRole(profile?.role)) {
        return null
    }

    return fetchUniversityOverview(
        await resolveUniversityApplicationScope(supabase, user.id, profile?.role ?? "")
    )
}
