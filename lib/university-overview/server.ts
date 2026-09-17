import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
    OverviewChartPoint,
    OverviewTrendPoint,
    UniversityOverview,
} from "@/types/schemas/university-overview"
import type { StudentPipelineStatus } from "@/types/schemas/university-student"
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import {
    resolveUniversityApplicationScope,
    type UniversityApplicationScope,
} from "@/lib/auth/university-scope"
import { rpcUniversityOverview, toUniversityIdsParam } from "@/lib/rpc/dashboard"

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

function formatStatusLabel(status: string) {
    return status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function countsFromRecord(record: Record<string, number> | null | undefined): Map<string, number> {
    const counts = new Map<string, number>()
    for (const [key, value] of Object.entries(record ?? {})) {
        counts.set(key, value)
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

export async function fetchUniversityOverview(
    universityScope?: UniversityApplicationScope
): Promise<UniversityOverview> {
    const supabase = await createSupabaseServerClient()
    const rpcResult = await rpcUniversityOverview(supabase, {
        universityIds: toUniversityIdsParam(universityScope),
    })

    const stats = rpcResult.stats

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
            countsFromRecord(rpcResult.application_status_counts),
            APPLICATION_STATUS_ORDER
        ),
        pipeline: toOrderedChartPoints(
            countsFromRecord(rpcResult.pipeline_status_counts),
            PIPELINE_STATUS_ORDER,
            (key) => key
        ),
        offers_by_status: toOrderedChartPoints(
            countsFromRecord(rpcResult.offer_status_counts),
            OFFER_STATUS_ORDER
        ),
        programs_by_status: toOrderedChartPoints(
            countsFromRecord(rpcResult.program_status_counts),
            PROGRAM_STATUS_ORDER
        ),
        documents_by_status: toOrderedChartPoints(
            countsFromRecord(rpcResult.document_status_counts),
            DOCUMENT_STATUS_ORDER
        ),
        monthly_trend: rpcResult.monthly_trend as OverviewTrendPoint[],
    }

    return {
        title: "University Dashboard",
        subtitle:
            "Charts across students, applications, programs, documents, and offers for your institution.",
        stats,
        charts,
        recent: {
            students: rpcResult.recent.students.map((student) => ({
                ...student,
                pipeline_status: student.pipeline_status as StudentPipelineStatus,
            })),
            applications: rpcResult.recent.applications.map((application) => ({
                ...application,
                pipeline_status: application.pipeline_status as StudentPipelineStatus,
            })),
            programs: rpcResult.recent.programs,
            templates: rpcResult.recent.templates,
            documents: rpcResult.recent.documents,
            offers: rpcResult.recent.offers,
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
