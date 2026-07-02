import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { resolveAgentKycStatus } from "@/lib/agent/kyc-status"
import { resolveStudentPipelineStatus } from "@/lib/student/pipeline-status"
import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import { formatLocation } from "@/lib/utils/location"
import type {
    UniversityAgentDetail,
    UniversityAgentListItem,
    UniversityAgentListResponse,
} from "@/types/schemas/university-agent"

const KYC_DOCUMENT_CODES = ["AGENT_REGISTRATION", "AGENT_ID_FRONT", "AGENT_ID_BACK"] as const

type AgentRow = {
    id: string
    profile_id: string
    agency_name: string | null
    country: string | null
    state: string | null
    city: string | null
    address: string | null
    nationality: string | null
    experience_years: number | null
    website: string | null
    other_contact_number: string | null
    contact_person_first_name: string | null
    contact_person_last_name: string | null
    profile: {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
        phone: string | null
        gender: string | null
        avatar_url: string | null
        role: string | null
    } | null
}

type ApplicationRow = {
    id: string
    profile_id: string
    status: string
    created_at: string
    course_id: string
    university_id: string
}

type OfferRow = {
    application_id: string
    status: string
}

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

function buildAgentDisplayId(profileId: string) {
    return `AG-${profileId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

function getAgencyLabel(agent: AgentRow) {
    if (agent.agency_name) return agent.agency_name
    return formatFullName(
        agent.contact_person_first_name ?? agent.profile?.first_name,
        agent.contact_person_last_name ?? agent.profile?.last_name
    )
}

function getAgentName(agent: AgentRow) {
    const contactName = formatFullName(
        agent.contact_person_first_name,
        agent.contact_person_last_name
    )
    if (contactName) return contactName
    return formatFullName(agent.profile?.first_name, agent.profile?.last_name)
}

function buildIntakeLabel(course?: CourseRow | null) {
    const intake = course?.degree?.intake_date
    if (!intake) return null
    return `${formatIntakeDate(String(intake))} Intake`
}

function getProgramName(course?: CourseRow | null): string | null {
    if (!course) return null
    const degreeName = course.degree?.name
    return typeof degreeName === "string" ? degreeName : typeof course.name === "string" ? course.name : null
}

async function loadCoursesById(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    courseIds: string[]
) {
    if (courseIds.length === 0) return new Map<string, CourseRow>()

    const { data, error } = await supabase
        .from("course")
        .select(COURSE_SELECT)
        .in("id", courseIds)

    if (error) throw new Error(error.message)

    const courses = await attachLevelsToCourses(supabase, (data ?? []) as unknown as CourseRow[])
    return new Map(courses.map((course) => [course.id, course]))
}

async function loadKycDataByProfileId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    const kycByProfileId = new Map<
        string,
        { hasDocuments: boolean; reviewStatuses: string[]; documents: UniversityAgentDetail["documents"] }
    >()

    if (profileIds.length === 0) return kycByProfileId

    const { data: documents, error } = await supabase
        .from("document")
        .select(`
            id,
            profile_id,
            created_at,
            document_type:document_type_id (code, name),
            document_files (file_url, created_at),
            document_review (status)
        `)
        .in("profile_id", profileIds)

    if (error) throw new Error(error.message)

    for (const profileId of profileIds) {
        kycByProfileId.set(profileId, {
            hasDocuments: false,
            reviewStatuses: [],
            documents: [],
        })
    }

    for (const doc of documents ?? []) {
        const docType = doc.document_type as { code?: string | null; name?: string | null } | null
        const code = docType?.code ?? ""
        if (!KYC_DOCUMENT_CODES.includes(code as (typeof KYC_DOCUMENT_CODES)[number])) {
            continue
        }

        const entry = kycByProfileId.get(doc.profile_id)
        if (!entry) continue

        entry.hasDocuments = true

        const reviews = (doc.document_review ?? []) as Array<{ status: string }>
        for (const review of reviews) {
            entry.reviewStatuses.push(review.status)
        }

        const files = (doc.document_files ?? []) as Array<{ file_url: string; created_at: string }>
        const latestFile = files.at(-1)

        entry.documents.push({
            id: doc.id,
            name: docType?.name ?? "Document",
            uploaded_at: formatSubmissionDate(doc.created_at),
            file_url: latestFile?.file_url ?? null,
        })
    }

    return kycByProfileId
}

async function loadStudentCountsByAgentId(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    agentIds: string[]
) {
    const counts = new Map<string, number>()
    if (agentIds.length === 0) return counts

    const { data, error } = await supabase
        .from("student")
        .select("created_by_agent_id")
        .in("created_by_agent_id", agentIds)

    if (error) throw new Error(error.message)

    for (const row of data ?? []) {
        if (!row.created_by_agent_id) continue
        counts.set(row.created_by_agent_id, (counts.get(row.created_by_agent_id) ?? 0) + 1)
    }

    return counts
}

function mapAgentListItem(
    agent: AgentRow,
    studentsCount: number,
    kycStatus: ReturnType<typeof resolveAgentKycStatus>
): UniversityAgentListItem {
    return {
        profile_id: agent.profile_id,
        agent_id: agent.id,
        agency_name: getAgencyLabel(agent),
        display_id: buildAgentDisplayId(agent.profile_id),
        country: agent.country,
        kyc_status: kycStatus,
        students_count: studentsCount,
    }
}

export async function fetchUniversityAgentList(params: {
    q?: string
    status?: string
    country?: string
    sortBy?: string
    page?: number
    limit?: number
}): Promise<UniversityAgentListResponse> {
    const supabase = await createSupabaseServerClient()
    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const searchTerm = params.q?.trim().toLowerCase() ?? ""
    const statusFilter = params.status?.toLowerCase() ?? "all"
    const countryFilter = params.country?.toLowerCase() ?? "all"
    const sortByParam = params.sortBy?.toLowerCase() ?? "default"

    const { data: agents, error } = await supabase
        .from("agent")
        .select(`
            id,
            profile_id,
            agency_name,
            country,
            state,
            city,
            address,
            nationality,
            experience_years,
            website,
            other_contact_number,
            contact_person_first_name,
            contact_person_last_name,
            profile:profile_id (
                id,
                first_name,
                last_name,
                email,
                phone,
                gender,
                avatar_url,
                role
            )
        `)
        .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    const agentRows = (agents ?? []).map((agent) => {
        const row = agent as AgentRow & {
            profile: AgentRow["profile"] | AgentRow["profile"][] | null
        }
        const profile = Array.isArray(row.profile) ? row.profile[0] ?? null : row.profile
        return { ...row, profile }
    }).filter((agent) => !agent.profile || agent.profile.role === "AGENT")

    const profileIds = agentRows.map((agent) => agent.profile_id)
    const agentIds = agentRows.map((agent) => agent.id)

    const [studentCounts, kycByProfileId] = await Promise.all([
        loadStudentCountsByAgentId(supabase, agentIds),
        loadKycDataByProfileId(supabase, profileIds),
    ])

    let listItems = agentRows.map((agent) => {
        const kyc = kycByProfileId.get(agent.profile_id)
        const kycStatus = resolveAgentKycStatus({
            hasDocuments: kyc?.hasDocuments ?? false,
            reviewStatuses: kyc?.reviewStatuses ?? [],
        })

        return mapAgentListItem(agent, studentCounts.get(agent.id) ?? 0, kycStatus)
    })

    const stats = {
        total_agents: listItems.length,
        verified: listItems.filter((item) => item.kyc_status === "Approved").length,
    }

    if (searchTerm) {
        listItems = listItems.filter((item) => {
            const haystack = [item.agency_name, item.display_id, item.country]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return haystack.includes(searchTerm)
        })
    }

    if (statusFilter !== "all") {
        listItems = listItems.filter(
            (item) => item.kyc_status.toLowerCase().replace(/\s+/g, "-") === statusFilter
        )
    }

    if (countryFilter !== "all") {
        listItems = listItems.filter(
            (item) => item.country?.toLowerCase() === countryFilter
        )
    }

    if (sortByParam === "students-count-asc") {
        listItems.sort((a, b) => a.students_count - b.students_count)
    } else if (sortByParam === "students-count-desc") {
        listItems.sort((a, b) => b.students_count - a.students_count)
    }

    const total = listItems.length
    const totalPages = Math.max(Math.ceil(total / limit), 1)
    const start = (page - 1) * limit

    return {
        stats,
        data: listItems.slice(start, start + limit),
        pagination: { total, page, limit, totalPages },
    }
}

export async function fetchUniversityAgentDetail(profileId: string): Promise<UniversityAgentDetail | null> {
    const supabase = await createSupabaseServerClient()

    const { data: agent, error } = await supabase
        .from("agent")
        .select(`
            id,
            profile_id,
            agency_name,
            country,
            state,
            city,
            address,
            nationality,
            experience_years,
            website,
            other_contact_number,
            contact_person_first_name,
            contact_person_last_name,
            profile:profile_id (
                id,
                first_name,
                last_name,
                email,
                phone,
                gender,
                avatar_url,
                role
            )
        `)
        .eq("profile_id", profileId)
        .maybeSingle()

    if (error || !agent) return null

    const row = agent as AgentRow & {
        profile: AgentRow["profile"] | AgentRow["profile"][] | null
    }
    const profile = Array.isArray(row.profile) ? row.profile[0] ?? null : row.profile
    if (!profile || profile.role !== "AGENT") return null

    const agentRow: AgentRow = { ...row, profile }

    const [kycByProfileId, studentsResult] = await Promise.all([
        loadKycDataByProfileId(supabase, [profileId]),
        supabase
            .from("student")
            .select("profile_id, student_code")
            .eq("created_by_agent_id", agentRow.id),
    ])

    if (studentsResult.error) throw new Error(studentsResult.error.message)

    const students = studentsResult.data ?? []
    const studentProfileIds = students.map((student) => student.profile_id)

    const { data: applications } = await supabase
        .from("application")
        .select("id, profile_id, status, created_at, course_id, university_id")
        .in(
            "profile_id",
            studentProfileIds.length > 0 ? studentProfileIds : ["00000000-0000-0000-0000-000000000000"]
        )
        .order("created_at", { ascending: false })

    const applicationRows = (applications ?? []) as ApplicationRow[]
    const applicationIds = applicationRows.map((application) => application.id)

    const { data: offers } = await supabase
        .from("offer_letter")
        .select("application_id, status")
        .in(
            "application_id",
            applicationIds.length > 0 ? applicationIds : ["00000000-0000-0000-0000-000000000000"]
        )

    const offerByApplicationId = new Map(
        ((offers ?? []) as OfferRow[]).map((offer) => [offer.application_id, offer])
    )

    const courseIds = [
        ...new Set(applicationRows.map((application) => application.course_id).filter(Boolean)),
    ]
    const courseById = await loadCoursesById(supabase, courseIds)

    const studentCodeByProfileId = new Map(
        students.map((student) => [student.profile_id, student.student_code])
    )

    let enrolledCount = 0
    const mappedStudents = students.map((student) => {
        const studentApps = applicationRows.filter((app) => app.profile_id === student.profile_id)
        const application = studentApps[0] ?? null
        const offer = application ? offerByApplicationId.get(application.id) : undefined
        const course = application ? courseById.get(application.course_id) : undefined

        if (application?.status === "APPROVED" || offer?.status === "ACCEPTED") {
            enrolledCount += 1
        }

        return {
            profile_id: student.profile_id,
            student_code: student.student_code,
            program_name: getProgramName(course),
            intake_label: buildIntakeLabel(course),
            pipeline_status: resolveStudentPipelineStatus({
                applicationStatus: application?.status,
                offerStatus: offer?.status,
                hasOffer: Boolean(offer),
            }),
            submission_date: formatSubmissionDate(application?.created_at),
        }
    })

    const kyc = kycByProfileId.get(profileId)

    return {
        profile_id: profileId,
        agent_id: agentRow.id,
        display_id: buildAgentDisplayId(profileId),
        name: getAgentName(agentRow),
        email: profile.email,
        location: formatLocation({
            city: agentRow.city,
            state: agentRow.state,
            country: agentRow.country,
        }),
        avatar_url: profile.avatar_url,
        students_count: students.length,
        enrolled_count: enrolledCount,
        agency_info: {
            agency_name: agentRow.agency_name,
            address:
                agentRow.address ??
                formatLocation({
                    city: agentRow.city,
                    state: agentRow.state,
                    country: agentRow.country,
                }),
            experience_years: agentRow.experience_years,
            phone: profile.phone,
            other_contact_number: agentRow.other_contact_number,
        },
        basic_info: {
            email: profile.email,
            gender: profile.gender,
            nationality: agentRow.nationality,
            country: agentRow.country,
            phone: profile.phone,
            other_contact_number: agentRow.other_contact_number,
            website: agentRow.website,
            address: agentRow.address,
        },
        documents: kyc?.documents ?? [],
        students: mappedStudents,
    }
}

export async function fetchUniversityAgentsForPage(params?: {
    q?: string
    status?: string
    page?: number
    limit?: number
}) {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    return fetchUniversityAgentList({
        q: params?.q,
        status: params?.status,
        page: params?.page,
        limit: params?.limit,
    })
}

export async function fetchUniversityAgentDetailForPage(profileId: string) {
    const supabase = await createSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    return fetchUniversityAgentDetail(profileId)
}
