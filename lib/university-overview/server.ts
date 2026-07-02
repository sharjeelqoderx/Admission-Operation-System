import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { formatFullName } from "@/lib/utils/profile"
import { resolveStudentPipelineStatus } from "@/lib/student/pipeline-status"
import type { UniversityOverview } from "@/types/schemas/university-overview"

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

export async function fetchUniversityOverview(universityId: string): Promise<UniversityOverview> {
    const supabase = await createSupabaseServerClient()

    const { data: applications, error: applicationsError } = await supabase
        .from("application")
        .select("id, profile_id, application_no, status, created_at, course_id")
        .eq("university_id", universityId)
        .order("created_at", { ascending: false })

    if (applicationsError) {
        throw new Error(applicationsError.message)
    }

    const applicationRows = (applications ?? []) as ApplicationRow[]
    const applicationIds = applicationRows.map((application) => application.id)
    const profileIds = [...new Set(applicationRows.map((application) => application.profile_id))]
    const courseIds = [...new Set(applicationRows.map((application) => application.course_id))]

    const [
        offersResult,
        templatesCountResult,
        templatesRecentResult,
        programsCountResult,
        programsRecentResult,
        documentsCountResult,
        documentsRecentResult,
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
        supabase
            .from("program")
            .select("id", { count: "exact", head: true })
            .eq("profile_id", universityId),
        supabase
            .from("program")
            .select("id, name, category, status, created_at")
            .eq("profile_id", universityId)
            .order("created_at", { ascending: false })
            .limit(RECENT_LIMIT),
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
    if (documentsCountResult.error) throw new Error(documentsCountResult.error.message)
    if (documentsRecentResult.error) throw new Error(documentsRecentResult.error.message)
    if (profilesResult.error) throw new Error(profilesResult.error.message)
    if (agentsResult.error) throw new Error(agentsResult.error.message)

    const totalUniversityPartners = (agentsResult.data ?? []).filter((agent) => {
        const profile = Array.isArray(agent.profile) ? agent.profile[0] : agent.profile
        return profile?.role === "AGENT"
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

    const recentPrograms = (programsRecentResult.data ?? []).map((program) => ({
        id: program.id,
        name: program.name ?? "Untitled Program",
        category: program.category,
        status: program.status,
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

    return {
        title: "University Dashboard",
        subtitle:
            "Overview of students, applications, programs, documents, and offers across your institution.",
        stats: {
            total_students: profileIds.length,
            total_university_partners: totalUniversityPartners,
            active_applications: activeApplications,
            total_applications: applicationRows.length,
            templates: templatesCountResult.count ?? 0,
            programs: programsCountResult.count ?? 0,
            total_documents: documentsCountResult.count ?? 0,
            total_offers: offers.length,
        },
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

    if (profile?.role !== "UNIVERSITY") {
        return null
    }

    return fetchUniversityOverview(user.id)
}
