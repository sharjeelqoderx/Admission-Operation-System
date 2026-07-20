"use client"

import { memo, useMemo, type ReactNode } from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import type {
    OverviewChartPoint,
    OverviewTrendPoint,
    UniversityOverviewCharts,
} from "@/types/schemas/university-overview"

const CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--brand-blue)",
    "var(--brand-byzantine)",
    "var(--brand-secondary)",
] as const

type OverviewChartsProps = {
    charts: UniversityOverviewCharts
}

type ChartPanelProps = {
    title: string
    description: string
    children: ReactNode
    className?: string
}

const ChartPanel = memo(function ChartPanel({
    title,
    description,
    children,
    className,
}: ChartPanelProps) {
    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            className={cn("h-full rounded-xl", className)}
            childClass="!p-4 md:!p-5"
        >
            <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="space-y-0.5">
                    <Typography as="h3" font="text-lg" className="font-bold text-brand-primary">
                        {title}
                    </Typography>
                    <Typography as="p" font="small" className="font-normal text-gray-500">
                        {description}
                    </Typography>
                </div>
                <div className="w-full shrink-0">{children}</div>
            </div>
        </BluryCard>
    )
})

const EmptyChartState = memo(function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="flex h-[160px] items-center justify-center rounded-lg border border-dashed border-brand-secondary/20 bg-white/40 px-4">
            <Typography as="p" font="small" className="font-normal text-center text-gray-400">
                {message}
            </Typography>
        </div>
    )
})

const OverviewBarChart = memo(function OverviewBarChart({ data }: { data: OverviewChartPoint[] }) {
    const config = useMemo<ChartConfig>(
        () => ({
            value: {
                label: "Total",
                color: "var(--brand-byzantine)",
            },
        }),
        []
    )

    if (data.length === 0) {
        return <EmptyChartState message="No overview metrics yet." />
    }

    return (
        <ChartContainer
            config={config}
            className="!aspect-auto h-[220px] w-full lg:h-[340px]"
        >
            <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={48}
                    tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
})

const StatusPieChart = memo(function StatusPieChart({
    data,
    emptyMessage,
}: {
    data: OverviewChartPoint[]
    emptyMessage: string
}) {
    const { chartData, config } = useMemo(() => {
        const nextConfig: ChartConfig = {
            value: { label: "Count" },
        }
        const nextData = data.map((point, index) => {
            const key = `segment_${index}`
            const color = CHART_COLORS[index % CHART_COLORS.length]
            nextConfig[key] = { label: point.name, color }
            return {
                segment: key,
                name: point.name,
                value: point.value,
                fill: `var(--color-${key})`,
            }
        })
        return { chartData: nextData, config: nextConfig }
    }, [data])

    if (data.length === 0) {
        return <EmptyChartState message={emptyMessage} />
    }

    return (
        <ChartContainer config={config} className="!aspect-auto mx-auto h-[170px] w-full">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="segment"
                    innerRadius={32}
                    outerRadius={54}
                    strokeWidth={1}
                >
                    {chartData.map((entry) => (
                        <Cell key={entry.segment} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="segment" className="gap-1 pt-1 text-[11px]" />} />
            </PieChart>
        </ChartContainer>
    )
})

const PipelineBarChart = memo(function PipelineBarChart({ data }: { data: OverviewChartPoint[] }) {
    const config = useMemo<ChartConfig>(
        () => ({
            value: {
                label: "Applications",
                color: "var(--brand-blue)",
            },
        }),
        []
    )

    if (data.length === 0) {
        return <EmptyChartState message="No pipeline activity yet." />
    }

    return (
        <ChartContainer config={config} className="!aspect-auto h-[170px] w-full">
            <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
            >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                    tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ChartContainer>
    )
})

const MonthlyTrendChart = memo(function MonthlyTrendChart({ data }: { data: OverviewTrendPoint[] }) {
    const config = useMemo<ChartConfig>(
        () => ({
            applications: {
                label: "Applications",
                color: "var(--brand-byzantine)",
            },
            offers: {
                label: "Offers",
                color: "var(--brand-blue)",
            },
        }),
        []
    )

    const hasValues = useMemo(
        () => data.some((point) => point.applications > 0 || point.offers > 0),
        [data]
    )

    if (!hasValues) {
        return <EmptyChartState message="No monthly activity in the last 6 months." />
    }

    return (
        <ChartContainer config={config} className="!aspect-auto h-[170px] w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent className="gap-1 pt-1 text-[11px]" />} />
                <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="var(--color-applications)"
                    fill="var(--color-applications)"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                />
                <Area
                    type="monotone"
                    dataKey="offers"
                    stroke="var(--color-offers)"
                    fill="var(--color-offers)"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                />
            </AreaChart>
        </ChartContainer>
    )
})

export const OverviewCharts = memo(function OverviewCharts({ charts }: OverviewChartsProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
                <ChartPanel
                    title="Institution Overview"
                    description="Totals across students, applications, programs, documents, offers, partners, and templates."
                    className="lg:col-span-2 lg:row-span-2"
                >
                    <OverviewBarChart data={charts.overview} />
                </ChartPanel>

                <ChartPanel
                    title="Applications by Status"
                    description="Distribution of application review outcomes."
                    className="lg:col-start-3 lg:row-start-1"
                >
                    <StatusPieChart
                        data={charts.applications_by_status}
                        emptyMessage="No applications to chart yet."
                    />
                </ChartPanel>

                <ChartPanel
                    title="Offer Status"
                    description="Pending, accepted, and rejected offer letters."
                    className="lg:col-start-3 lg:row-start-2"
                >
                    <StatusPieChart
                        data={charts.offers_by_status}
                        emptyMessage="No offers to chart yet."
                    />
                </ChartPanel>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ChartPanel
                    title="Student Pipeline"
                    description="Where applications sit in the admission pipeline."
                >
                    <PipelineBarChart data={charts.pipeline} />
                </ChartPanel>

                <ChartPanel
                    title="Programs"
                    description="Active versus inactive programs at your institution."
                >
                    <StatusPieChart
                        data={charts.programs_by_status}
                        emptyMessage="No programs to chart yet."
                    />
                </ChartPanel>

                <ChartPanel
                    title="Documents by Status"
                    description="Latest review status across student documents."
                >
                    <StatusPieChart
                        data={charts.documents_by_status}
                        emptyMessage="No documents to chart yet."
                    />
                </ChartPanel>

                <ChartPanel
                    title="6-Month Trend"
                    description="Applications and offers created over the last six months."
                >
                    <MonthlyTrendChart data={charts.monthly_trend} />
                </ChartPanel>
            </div>
        </div>
    )
})
