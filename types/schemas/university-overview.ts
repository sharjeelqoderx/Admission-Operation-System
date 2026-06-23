import { z } from "zod"

export const overviewBadgeToneSchema = z.enum(["success", "stable", "danger", "neutral"])

export const overviewStatSchema = z.object({
    key: z.string(),
    label: z.string(),
    value: z.string(),
    badge: z
        .object({
            label: z.string(),
            tone: overviewBadgeToneSchema,
        })
        .optional(),
    subtitle: z.string().optional(),
    variant: z.enum(["default", "highlight"]).default("default"),
})

export const pipelineStageSchema = z.object({
    key: z.string(),
    label: z.string(),
    value: z.number(),
    barClassName: z.string(),
})

export const recruitmentHubSchema = z.object({
    code: z.string(),
    name: z.string(),
    applications: z.number(),
})

export const agentPartnerSchema = z.object({
    rank: z.string(),
    name: z.string(),
    region: z.string(),
    revenue: z.string(),
    change: z.object({
        label: z.string(),
        tone: overviewBadgeToneSchema,
    }),
})

export const universityOverviewSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    summaryCards: z.array(overviewStatSchema),
    pipeline: z.object({
        stages: z.array(pipelineStageSchema),
    }),
    recruitmentHubs: z.array(recruitmentHubSchema),
    agentPartners: z.array(agentPartnerSchema),
})

export type UniversityOverview = z.infer<typeof universityOverviewSchema>
export type OverviewBadgeTone = z.infer<typeof overviewBadgeToneSchema>
