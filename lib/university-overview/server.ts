import "server-only"

import type { UniversityOverview } from "@/types/schemas/university-overview"

export async function fetchUniversityOverviewForPage(): Promise<UniversityOverview> {
    return {
        title: "Global Recruitment Overview",
        subtitle:
            "Quarterly performance analysis for FHM International recruitment pipeline. Monitor conversion metrics and institutional growth across all global territories.",
        summaryCards: [
            {
                key: "total-applications",
                label: "TOTAL APPLICATIONS",
                value: "12,482",
                badge: { label: "+12%", tone: "success" },
                variant: "default",
            },
            {
                key: "conversion-rate",
                label: "CONVERSION RATE",
                value: "8.4%",
                badge: { label: "Stable", tone: "stable" },
                variant: "default",
            },
            {
                key: "projected-revenue",
                label: "PROJECTED REVENUE",
                value: "€4.2M",
                subtitle: "INVOICED Q2",
                variant: "highlight",
            },
            {
                key: "agent-activity",
                label: "AGENT ACTIVITY",
                value: "412",
                subtitle: "Active Global",
                variant: "default",
            },
        ],
        pipeline: {
            stages: [
                {
                    key: "created",
                    label: "CREATED",
                    value: 12482,
                    barClassName: "bg-brand-primary",
                },
                {
                    key: "qualified",
                    label: "QUALIFIED",
                    value: 7104,
                    barClassName: "bg-brand-secondary",
                },
                {
                    key: "document-review",
                    label: "DOCUMENT REVIEW",
                    value: 3822,
                    barClassName: "bg-brand-secondary/60",
                },
                {
                    key: "completed",
                    label: "COMPLETED",
                    value: 1048,
                    barClassName: "bg-brand-blue",
                },
            ],
        },
        recruitmentHubs: [
            { code: "IN", name: "India", applications: 2840 },
            { code: "BR", name: "Brazil", applications: 1922 },
            { code: "ES", name: "Spain", applications: 1405 },
            { code: "VN", name: "Vietnam", applications: 912 },
        ],
        agentPartners: [
            {
                rank: "01",
                name: "Global Scholars Link",
                region: "SOUTH ASIA REGION",
                revenue: "€840k",
                change: { label: "+16.2%", tone: "success" },
            },
            {
                rank: "02",
                name: "Horizon Edu Partners",
                region: "EUROPEAN UNION",
                revenue: "€722k",
                change: { label: "Stable", tone: "stable" },
            },
            {
                rank: "03",
                name: "Iberian Talent Net",
                region: "LATIN AMERICA",
                revenue: "€510k",
                change: { label: "+5.4%", tone: "success" },
            },
            {
                rank: "04",
                name: "Pacific Rim Admissions",
                region: "ASEAN REGION",
                revenue: "€485k",
                change: { label: "-2.1%", tone: "danger" },
            },
        ],
    }
}
