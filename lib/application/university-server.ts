import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import { formatLocation } from "@/lib/utils/location"
import { resolveStudentPipelineStatus } from "@/lib/student/pipeline-status"
import { resolveQualificationLabel } from "@/lib/education/resolve-qualification"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    applyUniversityIdFilter,
    resolveUniversityApplicationScope,
    type UniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { canApproveApplicationForSignature } from "@/lib/application/review-access"
import { loadApplicationReviewMeta, loadRejectionHistoryByApplicationIds } from "@/lib/application/review-meta"
import { fetchInChunks } from "@/lib/supabase/query-in-chunks"
import type {
    UniversityApplicationDetail,
    UniversityApplicationDetailPageData,
    UniversityApplicationListItem,
    UniversityApplicationListResponse,
    UniversityApplicationTab,
} from "@/types/schemas/university-application"
import type { ApplicationReviewHistoryEntry } from "@/types/schemas/application"

export const EMPTY_UNIVERSITY_APPLICATION_LIST: UniversityApplicationListResponse = {
    tab_counts: {
        all: 0,
        pending_review: 0,
        awaiting_signature: 0,
        recently_completed: 0,
        rejected: 0,
    },
    data: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
}

export async function resolveUniversityScope(userId: string, role: string) {
    if (!isUniversityStaffRole(role)) {
        return null
    }

    const supabase = await createSupabaseServerClient()
    return resolveUniversityApplicationScope(supabase, userId, role)
}

type ApplicationRow = {
    id: string
    application_no: string | null
    status: string
    created_at: string
    updated_at: string
    profile_id: string
    course_id: string
    submitted_by_profile_id: string | null
    university_id: string
}

type OfferRow = {
    application_id: string
    status: string
    created_at: string
    accepted_at: string | null
}

type EducationRow = {
    qualification: string | null
    degree_id: string | null
    institution_name: string | null
    grade_type: string | null
    gpa: number | null
    obtained_marks: number | null
    total_marks: number | null
    honors: string | null
}

type StudentProfileRow = {
    profile_id: string
    student_code: string | null
    country: string | null
    state: string | null
    city: string | null
}

type ProfileRow = {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
    date_of_birth: string | null
}

type DocumentRow = {
    id: string
    document_type: { name: string | null } | { name: string | null }[] | null
    document_review: { status: string }[] | null
    document_files: { id: string }[] | null
}

const RECENTLY_COMPLETED_DAYS = 90

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

function buildIntakeLabel(course?: CourseRow | null) {
    const intake = course?.degree?.intake_date
    if (!intake) return null

    const formatted = formatIntakeDate(String(intake))
    return `${formatted} Intake`
}

function getProgramName(course?: CourseRow | null): string | null {
    if (!course) return null
    return typeof course.name === "string" ? course.name : null
}

function formatGpaLabel(education?: EducationRow | null) {
    if (!education) return null

    if (education.grade_type === "gpa" && education.gpa != null) {
        return `${education.gpa} / 4.0`
    }

    if (
        education.obtained_marks != null &&
        education.total_marks != null &&
        education.total_marks > 0
    ) {
        const percentage = ((education.obtained_marks / education.total_marks) * 100).toFixed(1)
        return `${percentage}%`
    }

    return null
}

function isRecentlyCompleted(pipelineStatus: string, updatedAt: string, offer?: OfferRow) {
    if (pipelineStatus !== "Completed" && pipelineStatus !== "Signed") {
        return false
    }

    const referenceDate = offer?.accepted_at ?? offer?.created_at ?? updatedAt
    const date = new Date(referenceDate)
    if (Number.isNaN(date.getTime())) return false

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RECENTLY_COMPLETED_DAYS)
    return date >= cutoff
}

function matchesTab(
    tab: UniversityApplicationTab,
    pipelineStatus: string,
    applicationStatus: string,
    updatedAt: string,
    offer?: OfferRow
) {
    switch (tab) {
        case "pending-review":
            return applicationStatus === "PENDING" && pipelineStatus === "Created"
        case "awaiting-signature":
            return pipelineStatus === "Contract Sent"
        case "recently-completed":
            return isRecentlyCompleted(pipelineStatus, updatedAt, offer)
        case "rejected":
            return applicationStatus === "REJECTED"
        default:
            return true
    }
}

function resolveDocumentStatus(reviewStatus?: string | null): UniversityApplicationDetail["documents"][number]["status"] {
    if (!reviewStatus) return "missing"

    if (reviewStatus === "APPROVED" || reviewStatus === "VERIFIED") {
        return "verified"
    }

    if (reviewStatus === "ACTION_REQUIRED" || reviewStatus === "NEEDS_REVISION") {
        return "action_required"
    }

    if (reviewStatus === "REJECTED") {
        return "action_required"
    }

    return "pending"
}

function resolveDocumentStatusLabel(status: UniversityApplicationDetail["documents"][number]["status"]) {
    if (status === "action_required") return "MISSING OR EXPIRED"
    if (status === "missing") return "NOT UPLOADED"
    return null
}

async function loadCoursesById(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    courseIds: string[]
) {
    if (courseIds.length === 0) {
        return new Map<string, CourseRow>()
    }

    const { data, error } = await fetchInChunks(courseIds, async (chunkIds) =>
        supabase.from("course").select(COURSE_SELECT).in("id", chunkIds)
    )

    if (error) {
        console.error("[loadCoursesById]", error.message)
        return new Map<string, CourseRow>()
    }

    const courses = await attachLevelsToCourses(supabase, (data ?? []) as unknown as CourseRow[])
    return new Map(courses.map((course) => [course.id, course]))
}

async function loadAgentOrganizations(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    agentProfileIds: string[]
) {
    if (agentProfileIds.length === 0) {
        return new Map<string, string>()
    }

    // Live DB may not have agency_name — use contact person (or default) instead.
    const { data, error } = await fetchInChunks(agentProfileIds, async (chunkIds) =>
        supabase
            .from("agent")
            .select("profile_id, contact_person_first_name, contact_person_last_name")
            .in("profile_id", chunkIds)
    )

    if (error) {
        console.error("[loadAgentOrganizations]", error.message)
        return new Map<string, string>()
    }

    return new Map(
        (data ?? []).map((agent) => [
            agent.profile_id,
            formatFullName(
                agent.contact_person_first_name,
                agent.contact_person_last_name
            ) || "University Partner",
        ])
    )
}

function mapListItem(params: {
    application: ApplicationRow
    studentName: string
    studentCode: string | null
    avatarUrl: string | null
    course: CourseRow | undefined
    agentLabel: string
    offer: OfferRow | undefined
    rejectionHistory: ApplicationReviewHistoryEntry[]
}): UniversityApplicationListItem {
    return {
        id: params.application.id,
        student_name: params.studentName,
        student_code: params.studentCode,
        avatar_url: params.avatarUrl,
        course_name: getProgramName(params.course),
        intake_label: buildIntakeLabel(params.course),
        agent_name: params.agentLabel,
        pipeline_status: resolveStudentPipelineStatus({
            applicationStatus: params.application.status,
            offerStatus: params.offer?.status,
            hasOffer: Boolean(params.offer),
        }),
        submission_date: formatSubmissionDate(params.application.created_at),
        rejection_history: params.rejectionHistory,
    }
}

async function loadOffersByApplicationIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    applicationIds: string[]
) {
    if (applicationIds.length === 0) {
        return [] as OfferRow[]
    }

    const { data, error } = await fetchInChunks<OfferRow>(applicationIds, async (chunkIds) =>
        supabase
            .from("offer_letter")
            .select("application_id, status, created_at, accepted_at")
            .in("application_id", chunkIds)
    )

    if (error) {
        console.error("[fetchUniversityApplicationList] offers", error.message)
        return []
    }

    return data ?? []
}

async function loadProfilesByIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    if (profileIds.length === 0) {
        return [] as ProfileRow[]
    }

    const { data, error } = await fetchInChunks<ProfileRow>(profileIds, async (chunkIds) =>
        supabase
            .from("profile")
            .select("id, first_name, last_name, email, avatar_url, date_of_birth")
            .in("id", chunkIds)
    )

    if (error) {
        console.error("[fetchUniversityApplicationList] profiles", error.message)
        return []
    }

    return data ?? []
}

async function loadStudentsByProfileIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    if (profileIds.length === 0) {
        return [] as { profile_id: string; student_code: string | null }[]
    }

    const { data, error } = await fetchInChunks<{ profile_id: string; student_code: string | null }>(
        profileIds,
        async (chunkIds) =>
            supabase.from("student").select("profile_id, student_code").in("profile_id", chunkIds)
    )

    if (error) {
        console.error("[fetchUniversityApplicationList] students", error.message)
        return []
    }

    return data ?? []
}

export async function fetchUniversityApplicationList(params: {
    universityScope?: UniversityApplicationScope
    q?: string
    tab?: UniversityApplicationTab
    page?: number
    limit?: number
}): Promise<UniversityApplicationListResponse> {
    const supabase = await createSupabaseServerClient()
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const searchTerm = params.q?.trim().toLowerCase() ?? ""
    const tab = params.tab ?? "all"

    // First fetch ALL applications to calculate tab counts (this is necessary for count accuracy)
    let applicationsQuery = supabase
        .from("application")
        .select(
            "id, application_no, status, created_at, updated_at, profile_id, course_id, submitted_by_profile_id, university_id"
        )
        .order("created_at", { ascending: false })

    if (params.universityScope) {
        applicationsQuery = applyUniversityIdFilter(
            applicationsQuery,
            "university_id",
            params.universityScope
        )
    }

    const { data: allApplications, error: applicationsError } = await applicationsQuery

    if (applicationsError) {
        console.error("[fetchUniversityApplicationList]", applicationsError.message)
        return {
            ...EMPTY_UNIVERSITY_APPLICATION_LIST,
            pagination: {
                ...EMPTY_UNIVERSITY_APPLICATION_LIST.pagination,
                page,
                limit,
            },
        }
    }

    const allApplicationRows = (allApplications ?? []) as ApplicationRow[]
    const allApplicationIds = allApplicationRows.map((application) => application.id)
    const allProfileIds = [...new Set(allApplicationRows.map((application) => application.profile_id))]
    const allAgentProfileIds = [
        ...new Set(
            allApplicationRows
                .map((application) => application.submitted_by_profile_id)
                .filter((id): id is string => Boolean(id))
        ),
    ]
    const allCourseIds = [...new Set(allApplicationRows.map((application) => application.course_id))]

    const [offers, profiles, students, courseById, agentOrgByProfileId, rejectionHistoryByApplicationId] =
        await Promise.all([
            loadOffersByApplicationIds(supabase, allApplicationIds),
            loadProfilesByIds(supabase, allProfileIds),
            loadStudentsByProfileIds(supabase, allProfileIds),
            loadCoursesById(supabase, allCourseIds),
            loadAgentOrganizations(supabase, allAgentProfileIds),
            loadRejectionHistoryByApplicationIds(supabase, allApplicationIds),
        ])

    const offerByApplicationId = new Map(offers.map((offer) => [offer.application_id, offer]))

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

    const studentCodeByProfileId = new Map(
        students.map((student) => [student.profile_id, student.student_code])
    )

    // Create all list items for filtering/counting
    const allListItems = allApplicationRows.map((application) => {
        const profile = profileById.get(application.profile_id)
        const studentName = formatFullName(profile?.first_name, profile?.last_name)
        const course = courseById.get(application.course_id)
        const offer = offerByApplicationId.get(application.id)

        const isDirect =
            !application.submitted_by_profile_id ||
            application.submitted_by_profile_id === application.profile_id

        const agentLabel = isDirect
            ? "Direct Application"
            : agentOrgByProfileId.get(application.submitted_by_profile_id!) ?? "University Partner"

        return mapListItem({
            application,
            studentName,
            studentCode: studentCodeByProfileId.get(application.profile_id) ?? null,
            avatarUrl: profile?.avatar_url ?? null,
            course,
            agentLabel,
            offer,
            rejectionHistory: rejectionHistoryByApplicationId.get(application.id) ?? [],
        })
    })

    // Calculate tab counts
    const tabCounts = {
        all: allListItems.length,
        pending_review: allApplicationRows.filter((application) => {
            const offer = offerByApplicationId.get(application.id)
            const pipelineStatus = resolveStudentPipelineStatus({
                applicationStatus: application.status,
                offerStatus: offer?.status,
                hasOffer: Boolean(offer),
            })
            return matchesTab("pending-review", pipelineStatus, application.status, application.updated_at, offer)
        }).length,
        awaiting_signature: allApplicationRows.filter((application) => {
            const offer = offerByApplicationId.get(application.id)
            const pipelineStatus = resolveStudentPipelineStatus({
                applicationStatus: application.status,
                offerStatus: offer?.status,
                hasOffer: Boolean(offer),
            })
            return matchesTab("awaiting-signature", pipelineStatus, application.status, application.updated_at, offer)
        }).length,
        recently_completed: allApplicationRows.filter((application) => {
            const offer = offerByApplicationId.get(application.id)
            const pipelineStatus = resolveStudentPipelineStatus({
                applicationStatus: application.status,
                offerStatus: offer?.status,
                hasOffer: Boolean(offer),
            })
            return matchesTab("recently-completed", pipelineStatus, application.status, application.updated_at, offer)
        }).length,
        rejected: allApplicationRows.filter((application) => application.status === "REJECTED").length,
    }

    // Apply filters
    let filteredItems = allListItems

    if (searchTerm) {
        const profileIdByApplicationId = new Map(
            allApplicationRows.map((application) => [application.id, application.profile_id])
        )

        filteredItems = filteredItems.filter((item) => {
            const profileId = profileIdByApplicationId.get(item.id)?.toLowerCase() ?? ""
            const haystack = [item.student_name, item.student_code, profileId]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()

            return haystack.includes(searchTerm)
        })
    }

    if (tab !== "all") {
        filteredItems = filteredItems.filter((item) => {
            const originalApplication = allApplicationRows.find((row) => row.id === item.id)
            if (!originalApplication) return false

            const offer = offerByApplicationId.get(originalApplication.id)
            return matchesTab(
                tab,
                item.pipeline_status,
                originalApplication.status,
                originalApplication.updated_at,
                offer
            )
        })
    }

    // Apply pagination
    const total = filteredItems.length
    const totalPages = Math.max(Math.ceil(total / limit), 1)
    const start = (page - 1) * limit
    const paginatedItems = filteredItems.slice(start, start + limit)

    return {
        tab_counts: tabCounts,
        data: paginatedItems,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
    }
}

export async function fetchUniversityApplicationDetail(params: {
    applicationId: string
    universityScope?: UniversityApplicationScope
    viewerRole?: string | null
    viewerId?: string | null
}): Promise<UniversityApplicationDetail | null> {
    const supabase = await createSupabaseServerClient()

    let applicationQuery = supabase
        .from("application")
        .select(
            "id, application_no, status, created_at, updated_at, profile_id, course_id, submitted_by_profile_id, university_id"
        )
        .eq("id", params.applicationId)

    if (params.universityScope?.universityIds) {
        applicationQuery = applicationQuery.in("university_id", params.universityScope.universityIds)
    }

    const { data: application, error: applicationError } = await applicationQuery.maybeSingle()

    if (applicationError || !application) {
        return null
    }

    const applicationRow = application as ApplicationRow

    const { data: profile } = await supabase
        .from("profile")
        .select("id, first_name, last_name, email, avatar_url, date_of_birth")
        .eq("id", applicationRow.profile_id)
        .maybeSingle()

    if (!profile) {
        return null
    }

    const { data: student } = await supabase
        .from("student")
        .select("profile_id, student_code, country, state, city, nationality, guardian_phone")
        .eq("profile_id", applicationRow.profile_id)
        .maybeSingle()

    const { data: educationRows } = await supabase
        .from("education")
        .select("qualification, degree_id, institution_name, grade_type, gpa, obtained_marks, total_marks, honors")
        .eq("profile_id", applicationRow.profile_id)
        .order("created_at", { ascending: false })

    const education = ((educationRows ?? []) as EducationRow[])[0] ?? null
    const previousDegreeLabel = education
        ? await resolveQualificationLabel(supabase, {
              qualification: education.qualification,
              degree_id: education.degree_id,
          })
        : null

    const courseById = await loadCoursesById(supabase, [applicationRow.course_id])
    const course = courseById.get(applicationRow.course_id)

    const { data: offer } = await supabase
        .from("offer_letter")
        .select("application_id, status, created_at, accepted_at")
        .eq("application_id", applicationRow.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    const offerRow = (offer as OfferRow | null) ?? undefined

    const { data: payments } = await supabase
        .from("payment")
        .select("status, amount, currency")
        .eq("application_id", applicationRow.id)
        .order("created_at", { ascending: false })
        .limit(1)

    const payment = payments?.[0] ?? null

    const agentProfileId = applicationRow.submitted_by_profile_id
    const agentOrgByProfileId = await loadAgentOrganizations(
        supabase,
        agentProfileId ? [agentProfileId] : []
    )

    let agentName: string | null = null
    if (agentProfileId && agentProfileId !== applicationRow.profile_id) {
        const { data: agentProfile } = await supabase
            .from("profile")
            .select("first_name, last_name")
            .eq("id", agentProfileId)
            .maybeSingle()

        agentName = formatFullName(agentProfile?.first_name, agentProfile?.last_name)
    }

    const { data: applicationDocuments } = await supabase
        .from("application_document")
        .select(`
            document:document_id (
                id,
                document_type:document_type_id ( name ),
                document_review ( status ),
                document_files ( id )
            )
        `)
        .eq("application_id", applicationRow.id)

    const mappedDocuments: UniversityApplicationDetail["documents"] = []

    for (const row of applicationDocuments ?? []) {
        const document = row.document as DocumentRow | DocumentRow[] | null
        const doc = Array.isArray(document) ? document[0] : document
        if (!doc) continue

        const documentType = Array.isArray(doc.document_type)
            ? doc.document_type[0]
            : doc.document_type
        const reviewStatus = doc.document_review?.[0]?.status ?? null
        const hasFiles = (doc.document_files?.length ?? 0) > 0
        const status = hasFiles ? resolveDocumentStatus(reviewStatus) : "missing"

        mappedDocuments.push({
            id: doc.id,
            name: documentType?.name ?? "Document",
            status,
            status_label: resolveDocumentStatusLabel(status),
        })
    }

    const verifiedCount = mappedDocuments.filter((doc) => doc.status === "verified").length
    const totalDocuments = mappedDocuments.length

    const degreeData = course?.degree as { fees?: string | null } | null | undefined
    const tuitionFees = typeof degreeData?.fees === "string" ? degreeData.fees : null

    let tuitionStatus = "Not Invoiced"
    if (payment?.status === "CONFIRMED") {
        tuitionStatus = "Deposit Paid"
    } else if (offerRow?.status === "ACCEPTED" || offerRow?.status === "PENDING") {
        tuitionStatus = "Deposit Pending"
    }

    const progressSteps = [
        {
            key: "profile-created",
            label: "Profile Created",
            status: "completed" as const,
            meta: "Completed",
        },
        {
            key: "application-submitted",
            label: "Application Submitted",
            status: "completed" as const,
            meta: formatSubmissionDate(applicationRow.created_at),
        },
        {
            key: "documents-reviewed",
            label: "Documents Reviewed",
            status:
                applicationRow.status !== "PENDING" || verifiedCount > 0
                    ? ("completed" as const)
                    : ("pending" as const),
            meta:
                applicationRow.status !== "PENDING" || verifiedCount > 0 ? "Auto" : "Pending",
        },
        {
            key: "decision-made",
            label: "Decision Made",
            status: ["APPROVED", "REJECTED", "NEEDS_REVISION"].includes(applicationRow.status)
                ? ("completed" as const)
                : ("pending" as const),
            meta:
                applicationRow.status === "APPROVED"
                    ? "Approved"
                    : applicationRow.status === "REJECTED"
                      ? "Rejected"
                      : "Pending",
        },
        {
            key: "offer-received",
            label: "Offer Received",
            status: offerRow ? ("completed" as const) : ("pending" as const),
            meta: offerRow ? formatSubmissionDate(offerRow.created_at) : "Pending",
        },
        {
            key: "enrolled",
            label: "Enrolled",
            status:
                applicationRow.status === "APPROVED" || offerRow?.status === "ACCEPTED"
                    ? ("completed" as const)
                    : ("pending" as const),
            meta:
                applicationRow.status === "APPROVED" || offerRow?.status === "ACCEPTED"
                    ? "Completed"
                    : "Pending",
        },
    ]

    const studentRow = student as StudentProfileRow | null
    const name = formatFullName(profile.first_name, profile.last_name)

    const isDirect =
        !applicationRow.submitted_by_profile_id ||
        applicationRow.submitted_by_profile_id === applicationRow.profile_id

    const reviewMeta = await loadApplicationReviewMeta(supabase, {
        applicationId: applicationRow.id,
        applicationStatus: applicationRow.status,
        hasOffer: Boolean(offerRow),
        profileId: applicationRow.profile_id,
        submittedByProfileId: applicationRow.submitted_by_profile_id,
        viewerId: params.viewerId ?? "",
        viewerRole: params.viewerRole,
    })

    return {
        id: applicationRow.id,
        display_id: applicationRow.application_no ?? studentRow?.student_code ?? null,
        application_status: applicationRow.status,
        student_name: name,
        email: profile.email,
        location: formatLocation({
            city: studentRow?.city,
            state: studentRow?.state,
            country: studentRow?.country,
        }),
        avatar_url: profile.avatar_url,
        profile_id: applicationRow.profile_id,
        academic_record: {
            previous_degree: previousDegreeLabel,
            institution_name: education?.institution_name ?? null,
            gpa_label: formatGpaLabel(education),
            honors_label: education?.honors ?? null,
            program_selection: getProgramName(course),
            intake_label: buildIntakeLabel(course),
            tuition_status: tuitionStatus,
            tuition_total: tuitionFees ? `EUR ${tuitionFees}` : null,
        },
        documents: mappedDocuments,
        documents_verified_count: verifiedCount,
        documents_total_count: totalDocuments,
        progress: {
            course_name: getProgramName(course),
            steps: progressSteps,
        },
        submission_source: isDirect
            ? null
            : {
                  organization:
                      agentOrgByProfileId.get(agentProfileId!) ?? "University Partner",
                  agent_name: agentName,
              },
        can_approve_for_signature: canApproveApplicationForSignature({
            role: params.viewerRole,
            applicationStatus: applicationRow.status,
            hasOffer: Boolean(offerRow),
        }),
        can_reject: reviewMeta.can_reject,
        can_resubmit: reviewMeta.can_resubmit,
        has_offer: Boolean(offerRow),
        review_history: reviewMeta.review_history,
        rejection_history: reviewMeta.rejection_history,
    }
}

export async function fetchUniversityApplicationsForPage(params?: {
    q?: string
    tab?: UniversityApplicationTab
    page?: number
    limit?: number
}) {
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

    const scope = await resolveUniversityScope(user.id, profile?.role ?? "")
    if (!scope) {
        return null
    }

    try {
        return await fetchUniversityApplicationList({
            universityScope: scope,
            q: params?.q,
            tab: params?.tab,
            page: params?.page,
            limit: params?.limit,
        })
    } catch (error) {
        console.error("[fetchUniversityApplicationsForPage]", error)
        return {
            ...EMPTY_UNIVERSITY_APPLICATION_LIST,
            pagination: {
                ...EMPTY_UNIVERSITY_APPLICATION_LIST.pagination,
                page: params?.page ?? 1,
                limit: params?.limit ?? 10,
            },
        }
    }
}

export async function fetchUniversityApplicationDetailForPage(
    applicationId: string
): Promise<UniversityApplicationDetailPageData> {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return {
            detail: null,
            error: "Unauthorized",
        }
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

    const scope = await resolveUniversityScope(user.id, profile?.role ?? "")
    if (!scope) {
        return {
            detail: null,
            error: "Profile not found",
        }
    }

    const detail = await fetchUniversityApplicationDetail({
        applicationId,
        universityScope: scope,
        viewerRole: profile?.role ?? null,
        viewerId: user.id,
    })

    if (!detail) {
        return {
            detail: null,
            error: "Application not found",
        }
    }

    return {
        detail,
        error: null,
    }
}
