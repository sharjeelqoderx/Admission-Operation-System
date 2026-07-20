import { z } from "zod"
import { studentPipelineStatusSchema } from "@/types/schemas/university-student"

export const overviewBadgeToneSchema = z.enum(["success", "stable", "danger", "neutral"])
export type OverviewBadgeTone = z.infer<typeof overviewBadgeToneSchema>

export const universityOverviewStatsSchema = z.object({
    total_students: z.number(),
    total_university_partners: z.number(),
    active_applications: z.number(),
    total_applications: z.number(),
    templates: z.number(),
    programs: z.number(),
    total_documents: z.number(),
    total_offers: z.number(),
})

export const universityOverviewRecentStudentSchema = z.object({
    profile_id: z.string().uuid(),
    name: z.string(),
    program_name: z.string().nullable(),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string().nullable(),
})

export const universityOverviewRecentApplicationSchema = z.object({
    id: z.string().uuid(),
    student_name: z.string(),
    program_name: z.string().nullable(),
    pipeline_status: studentPipelineStatusSchema,
    submission_date: z.string().nullable(),
})

export const universityOverviewRecentProgramSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.string().nullable(),
    status: z.string(),
})

export const universityOverviewRecentTemplateSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    updated_at: z.string(),
})

export const universityOverviewRecentDocumentSchema = z.object({
    id: z.string().uuid(),
    student_name: z.string(),
    document_type: z.string().nullable(),
    status: z.string().nullable(),
    created_at: z.string().nullable(),
})

export const universityOverviewRecentOfferSchema = z.object({
    id: z.string().uuid(),
    student_name: z.string(),
    program_name: z.string().nullable(),
    status: z.string(),
    created_at: z.string().nullable(),
})

export const universityOverviewRecentSchema = z.object({
    students: z.array(universityOverviewRecentStudentSchema),
    applications: z.array(universityOverviewRecentApplicationSchema),
    programs: z.array(universityOverviewRecentProgramSchema),
    templates: z.array(universityOverviewRecentTemplateSchema),
    documents: z.array(universityOverviewRecentDocumentSchema),
    offers: z.array(universityOverviewRecentOfferSchema),
})

export const overviewChartPointSchema = z.object({
    name: z.string(),
    value: z.number(),
})

export const overviewTrendPointSchema = z.object({
    month: z.string(),
    applications: z.number(),
    offers: z.number(),
})

export const universityOverviewChartsSchema = z.object({
    overview: z.array(overviewChartPointSchema),
    applications_by_status: z.array(overviewChartPointSchema),
    pipeline: z.array(overviewChartPointSchema),
    offers_by_status: z.array(overviewChartPointSchema),
    programs_by_status: z.array(overviewChartPointSchema),
    documents_by_status: z.array(overviewChartPointSchema),
    monthly_trend: z.array(overviewTrendPointSchema),
})

export const universityOverviewSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    stats: universityOverviewStatsSchema,
    charts: universityOverviewChartsSchema,
    recent: universityOverviewRecentSchema,
})

export type UniversityOverview = z.infer<typeof universityOverviewSchema>
export type UniversityOverviewStats = z.infer<typeof universityOverviewStatsSchema>
export type UniversityOverviewRecent = z.infer<typeof universityOverviewRecentSchema>
export type UniversityOverviewCharts = z.infer<typeof universityOverviewChartsSchema>
export type OverviewChartPoint = z.infer<typeof overviewChartPointSchema>
export type OverviewTrendPoint = z.infer<typeof overviewTrendPointSchema>

const DEFAULT_OVERVIEW_STATS: UniversityOverviewStats = {
    total_students: 0,
    total_university_partners: 0,
    active_applications: 0,
    total_applications: 0,
    templates: 0,
    programs: 0,
    total_documents: 0,
    total_offers: 0,
}

const DEFAULT_OVERVIEW_CHARTS: UniversityOverviewCharts = {
    overview: [],
    applications_by_status: [],
    pipeline: [],
    offers_by_status: [],
    programs_by_status: [],
    documents_by_status: [],
    monthly_trend: [],
}

export function normalizeUniversityOverviewStats(
    stats?: Partial<UniversityOverviewStats> | null
): UniversityOverviewStats {
    return {
        ...DEFAULT_OVERVIEW_STATS,
        ...stats,
    }
}

export function normalizeUniversityOverviewCharts(
    charts?: Partial<UniversityOverviewCharts> | null
): UniversityOverviewCharts {
    return {
        ...DEFAULT_OVERVIEW_CHARTS,
        ...charts,
        overview: charts?.overview ?? DEFAULT_OVERVIEW_CHARTS.overview,
        applications_by_status:
            charts?.applications_by_status ?? DEFAULT_OVERVIEW_CHARTS.applications_by_status,
        pipeline: charts?.pipeline ?? DEFAULT_OVERVIEW_CHARTS.pipeline,
        offers_by_status: charts?.offers_by_status ?? DEFAULT_OVERVIEW_CHARTS.offers_by_status,
        programs_by_status: charts?.programs_by_status ?? DEFAULT_OVERVIEW_CHARTS.programs_by_status,
        documents_by_status:
            charts?.documents_by_status ?? DEFAULT_OVERVIEW_CHARTS.documents_by_status,
        monthly_trend: charts?.monthly_trend ?? DEFAULT_OVERVIEW_CHARTS.monthly_trend,
    }
}

export function normalizeUniversityOverview(overview: UniversityOverview): UniversityOverview {
    return {
        ...overview,
        stats: normalizeUniversityOverviewStats(overview.stats),
        charts: normalizeUniversityOverviewCharts(overview.charts),
    }
}
