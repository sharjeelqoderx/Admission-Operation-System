import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { fetchInChunks } from "@/lib/supabase/query-in-chunks"
import { COURSE_SELECT, attachLevelsToCourses, type CourseRow } from "@/lib/api/course-program"
import { formatFullName } from "@/lib/utils/profile"
import { formatIntakeDate } from "@/lib/utils/program"
import { formatLocation } from "@/lib/utils/location"
import { resolveStudentPipelineStatus } from "@/lib/student/pipeline-status"
import { resolveQualificationLabel } from "@/lib/education/resolve-qualification"
import type {
    UniversityStudentDetail,
    UniversityStudentListItem,
    UniversityStudentListResponse,
} from "@/types/schemas/university-student"
import { isUniversityStaffRole, resolveUniversityScopeId } from "@/lib/auth/university-role"
import { rpcUniversityStudentsList, toUniversityIdsParam } from "@/lib/rpc/dashboard"
import { Role } from "@/types/enums/role"
import type { StudentPipelineStatus } from "@/types/schemas/university-student"

type StudentRow = {
    profile_id: string
    student_code: string | null
    country: string | null
    state: string | null
    city: string | null
    nationality: string | null
    guardian_phone: string | null
    created_by_agent_id: string | null
    profile: {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
        phone: string | null
        date_of_birth: string | null
        avatar_url: string | null
        role: string | null
    } | null
}

type ApplicationRow = {
    id: string
    profile_id: string
    application_no: string | null
    status: string
    created_at: string
    submitted_by_profile_id: string | null
    course_id: string
    university_id: string
}

type OfferRow = {
    application_id: string
    status: string
    created_at: string
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
    const degreeName = course.degree?.name
    return typeof degreeName === "string" ? degreeName : typeof course.name === "string" ? course.name : null
}

function pickApplicationForStudent(
    applications: ApplicationRow[],
    profileId: string,
    universityId?: string
) {
    const studentApps = applications.filter((app) => app.profile_id === profileId)
    if (studentApps.length === 0) return null

    if (universityId) {
        const universityApp = studentApps.find((app) => app.university_id === universityId)
        if (universityApp) return universityApp
    }

    return studentApps[0]
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
        throw new Error(error.message)
    }

    const courses = await attachLevelsToCourses(supabase, (data ?? []) as unknown as CourseRow[])
    return new Map(courses.map((course) => [course.id, course]))
}

async function loadAgentNames(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    profileIds: string[]
) {
    if (profileIds.length === 0) {
        return new Map<string, string>()
    }

    const { data, error } = await fetchInChunks(profileIds, async (chunkIds) =>
        supabase.from("profile").select("id, first_name, last_name").in("id", chunkIds)
    )

    if (error) {
        throw new Error(error.message)
    }

    return new Map(
        (data ?? []).map((profile) => [
            profile.id,
            formatFullName(profile.first_name, profile.last_name),
        ])
    )
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
        throw new Error(error.message)
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
    student: StudentRow
    application: ApplicationRow | null
    offer: OfferRow | undefined
    course: CourseRow | undefined
    agentName: string | null
}): UniversityStudentListItem {
    const name = formatFullName(
        params.student.profile?.first_name,
        params.student.profile?.last_name
    )

    const pipelineStatus = resolveStudentPipelineStatus({
        applicationStatus: params.application?.status,
        offerStatus: params.offer?.status,
        hasOffer: Boolean(params.offer),
    })

    const appliedThrough =
        params.application?.submitted_by_profile_id &&
        params.application.submitted_by_profile_id !== params.student.profile_id
            ? "University Partner"
            : "Direct"

    return {
        profile_id: params.student.profile_id,
        name,
        student_code: params.student.student_code,
        program_name: getProgramName(params.course),
        intake_label: buildIntakeLabel(params.course),
        applied_through: appliedThrough,
        pipeline_status: pipelineStatus,
        submission_date: formatSubmissionDate(params.application?.created_at),
    }
}

export async function fetchUniversityStudentList(params: {
    universityId?: string | null
    q?: string
    status?: string
    page?: number
    limit?: number
}): Promise<UniversityStudentListResponse> {
    const supabase = await createSupabaseServerClient()
    const rpcResult = await rpcUniversityStudentsList(supabase, {
        universityIds: toUniversityIdsParam(undefined, params.universityId),
        q: params.q,
        status: params.status,
        page: params.page,
        limit: params.limit,
    })

    return {
        stats: rpcResult.stats,
        data: rpcResult.data.map((item) => ({
            ...item,
            pipeline_status: item.pipeline_status as StudentPipelineStatus,
        })),
        pagination: rpcResult.pagination,
    }
}

export async function fetchUniversityStudentDetail(params: {
    universityId?: string | null
    profileId: string
}): Promise<UniversityStudentDetail | null> {
    const supabase = await createSupabaseServerClient()

    const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", params.profileId)
        .maybeSingle()

    if (profileError || !profile || profile.role !== Role.STUDENT) {
        return null
    }

    const { data: student } = await supabase
        .from("student")
        .select("*")
        .eq("profile_id", params.profileId)
        .maybeSingle()

    const { data: educationRows } = await supabase
        .from("education")
        .select("qualification, degree_id, institution_name, grade_type, gpa, obtained_marks, total_marks, honors")
        .eq("profile_id", params.profileId)
        .order("created_at", { ascending: false })

    const education = ((educationRows ?? []) as EducationRow[])[0] ?? null
    const previousDegreeLabel = education
        ? await resolveQualificationLabel(supabase, {
              qualification: education.qualification,
              degree_id: education.degree_id,
          })
        : null

    const { data: applications } = await supabase
        .from("application")
        .select(
            "id, profile_id, application_no, status, created_at, submitted_by_profile_id, course_id, university_id"
        )
        .eq("profile_id", params.profileId)
        .order("created_at", { ascending: false })

    const applicationRows = (applications ?? []) as ApplicationRow[]
    const applicationIds = applicationRows.map((application) => application.id)

    const { data: offers } = await fetchInChunks<OfferRow>(applicationIds, async (chunkIds) =>
        supabase
            .from("offer_letter")
            .select("application_id, status, created_at")
            .in("application_id", chunkIds)
    )

    const offerByApplicationId = new Map(
        (offers ?? []).map((offer) => [offer.application_id, offer])
    )

    const courseIds = [
        ...new Set(applicationRows.map((application) => application.course_id).filter(Boolean)),
    ]
    const courseById = await loadCoursesById(supabase, courseIds)

    const primaryApplication =
        pickApplicationForStudent(
            applicationRows,
            params.profileId,
            params.universityId ?? undefined
        ) ??
        applicationRows[0] ??
        null

    const primaryCourse = primaryApplication
        ? courseById.get(primaryApplication.course_id)
        : undefined

    const primaryOffer = primaryApplication
        ? offerByApplicationId.get(primaryApplication.id)
        : undefined

    const agentProfileId = primaryApplication?.submitted_by_profile_id ?? null
    const agentNameByProfileId = await loadAgentNames(
        supabase,
        agentProfileId ? [agentProfileId] : []
    )
    const agentOrgByProfileId = await loadAgentOrganizations(
        supabase,
        agentProfileId ? [agentProfileId] : []
    )

    const mappedApplications = applicationRows.map((application) => {
        const course = courseById.get(application.course_id)
        const offer = offerByApplicationId.get(application.id)

        return {
            id: application.id,
            application_no: application.application_no,
            program_name: getProgramName(course),
            intake_label: buildIntakeLabel(course),
            pipeline_status: resolveStudentPipelineStatus({
                applicationStatus: application.status,
                offerStatus: offer?.status,
                hasOffer: Boolean(offer),
            }),
            submission_date:
                formatSubmissionDate(application.created_at) ??
                new Date(application.created_at).toISOString(),
        }
    })

    const degreeData = primaryCourse?.degree as { fees?: string | null } | null | undefined
    const tuitionFees = typeof degreeData?.fees === "string" ? degreeData.fees : null
    const tuitionStatus = primaryOffer?.status === "ACCEPTED" ? "Deposit Pending" : "Not Invoiced"

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
            status: primaryApplication ? ("completed" as const) : ("pending" as const),
            meta: primaryApplication
                ? formatSubmissionDate(primaryApplication.created_at)
                : "Pending",
        },
        {
            key: "documents-reviewed",
            label: "Documents Reviewed",
            status:
                primaryApplication && primaryApplication.status !== "PENDING"
                    ? ("completed" as const)
                    : ("pending" as const),
            meta:
                primaryApplication && primaryApplication.status !== "PENDING"
                    ? "Auto"
                    : "Pending",
        },
        {
            key: "decision-made",
            label: "Decision Made",
            status:
                primaryApplication &&
                ["APPROVED", "REJECTED", "NEEDS_REVISION"].includes(primaryApplication.status)
                    ? ("completed" as const)
                    : ("pending" as const),
            meta:
                primaryApplication?.status === "APPROVED"
                    ? "Approved"
                    : primaryApplication?.status === "REJECTED"
                      ? "Rejected"
                      : "Pending",
        },
        {
            key: "offer-received",
            label: "Offer Received",
            status: primaryOffer ? ("completed" as const) : ("pending" as const),
            meta: primaryOffer
                ? formatSubmissionDate(primaryOffer.created_at)
                : "Pending",
        },
        {
            key: "enrolled",
            label: "Enrolled",
            status:
                primaryApplication?.status === "APPROVED" || primaryOffer?.status === "ACCEPTED"
                    ? ("completed" as const)
                    : ("pending" as const),
            meta:
                primaryApplication?.status === "APPROVED" || primaryOffer?.status === "ACCEPTED"
                    ? "Completed"
                    : "Pending",
        },
    ]

    const name = formatFullName(profile.first_name, profile.last_name)

    return {
        profile_id: params.profileId,
        display_id: primaryApplication?.application_no ?? student?.student_code ?? null,
        name,
        email: profile.email,
        location: formatLocation({
            city: student?.city,
            state: student?.state,
            country: student?.country,
        }),
        avatar_url: profile.avatar_url,
        academic_record: {
            previous_degree: previousDegreeLabel,
            institution_name: education?.institution_name ?? null,
            gpa_label: formatGpaLabel(education),
            honors_label: education?.honors ?? null,
            program_selection: getProgramName(primaryCourse),
            intake_label: buildIntakeLabel(primaryCourse),
            tuition_status: tuitionStatus,
            tuition_total: tuitionFees ? `EUR ${tuitionFees}` : null,
        },
        basic_info: {
            name,
            email: profile.email,
            date_of_birth: profile.date_of_birth,
            nationality: student?.nationality ?? null,
            phone: profile.phone,
            guardian_phone: student?.guardian_phone ?? null,
        },
        applications: mappedApplications,
        progress: {
            program_name: getProgramName(primaryCourse),
            steps: progressSteps,
        },
        submission_source: agentProfileId
            ? {
                  organization:
                      agentOrgByProfileId.get(agentProfileId) ?? "University Partner",
                  agent_name: agentNameByProfileId.get(agentProfileId) ?? null,
              }
            : null,
    }
}

export async function fetchUniversityStudentsForPage(params?: {
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

    return fetchUniversityStudentList({
        universityId: resolveUniversityScopeId(profile?.role, user.id),
        q: params?.q,
        status: params?.status,
        page: params?.page,
        limit: params?.limit,
    })
}

export async function fetchUniversityStudentDetailForPage(profileId: string) {
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

    return fetchUniversityStudentDetail({
        universityId: resolveUniversityScopeId(profile?.role, user.id),
        profileId,
    })
}
