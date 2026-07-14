import { memo, useMemo } from "react"
import type { LucideIcon } from "lucide-react"
import {
    Activity,
    Award,
    BookOpen,
    FileText,
    GraduationCap,
    Handshake,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import type { UniversityOverviewStats } from "@/types/schemas/university-overview"

type OverviewStatCardsProps = {
    stats: UniversityOverviewStats
}

type StatCardConfig = {
    key: keyof UniversityOverviewStats
    label: string
    icon: LucideIcon
    accent: string
    featured?: boolean
}

const STAT_CARDS: StatCardConfig[] = [
    {
        key: "total_students",
        label: "Total Students",
        icon: GraduationCap,
        accent: "text-brand-blue",
    },
    {
        key: "active_applications",
        label: "Active Applications",
        icon: Activity,
        accent: "text-brand-byzantine",
        featured: true,
    },
    {
        key: "total_applications",
        label: "Total Applications",
        icon: FileText,
        accent: "text-brand-byzantine",
    },
    {
        key: "programs",
        label: "Programs",
        icon: BookOpen,
        accent: "text-brand-blue",
    },
    {
        key: "total_offers",
        label: "Total Offers",
        icon: Award,
        accent: "text-brand-success",
    },
]

export const OverviewStatCards = memo(function OverviewStatCards({ stats }: OverviewStatCardsProps) {
    const cards = useMemo(
        () =>
            STAT_CARDS.map((card) => ({
                ...card,
                value: (stats[card.key] ?? 0).toLocaleString(),
            })),
        [stats]
    )

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon
                const isFeatured = card.featured

                // All cards now have hover state with purple gradient, white by default
                return (
                    <div
                        key={card.key}
                        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-brand-byzantine hover:to-[#7B2FD4] hover:border-brand-byzantine/30 hover:shadow-lg hover:shadow-brand-byzantine/20"
                    >
                        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative p-5 md:p-6">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="w-fit rounded-xl border border-gray-200 bg-gray-50 p-2.5 transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/15">
                                    <Icon className={cn("size-7 opacity-85 transition-colors duration-300", card.accent, "group-hover:text-white")} />
                                </div>
                            </div>
                            <Typography
                                as="p"
                                font="sub-text"
                                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 transition-colors duration-300 group-hover:text-white/80"
                            >
                                {card.label}
                            </Typography>
                            <Typography
                                as="p"
                                font="title"
                                className="mt-2 font-bold tracking-tight text-brand-primary transition-colors duration-300 group-hover:text-white"
                            >
                                {card.value}
                            </Typography>
                        </div>
                    </div>
                )
            })}
        </div>
    )
})
