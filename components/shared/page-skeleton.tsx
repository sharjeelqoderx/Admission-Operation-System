import { cn } from "@/lib/utils"
import { TableSkeleton } from "@/components/shared/table-skeleton"

const PULSE = "bg-gray-200/60 rounded animate-pulse"
const PULSE_SOFT = "bg-gray-200/40 rounded animate-pulse"

type PageSkeletonProps = {
    className?: string
    showHeader?: boolean
    showStats?: boolean
    showFilters?: boolean
    showTable?: boolean
    showCards?: boolean
    tableColumns?: number
    tableRows?: number
}

export function PageSkeleton({
    className,
    showHeader = false,
    showStats = false,
    showFilters = false,
    showTable = false,
    showCards = false,
    tableColumns = 5,
    tableRows = 6,
}: PageSkeletonProps) {
    return (
        <div className={cn("space-y-8 animate-in fade-in duration-300", className)}>
            {/* Headers/descriptions are static — never skeleton them by default */}
            {showHeader && (
                <div className="space-y-3">
                    <div className={cn(PULSE, "h-8 w-64")} />
                    <div className={cn(PULSE_SOFT, "h-4 w-96 max-w-full")} />
                </div>
            )}

            {showStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 space-y-6"
                        >
                            <div className={cn(PULSE, "size-12 rounded-lg")} />
                            <div className="space-y-2">
                                <div className={cn(PULSE_SOFT, "h-3 w-24")} />
                                <div className={cn(PULSE, "h-8 w-16")} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showFilters && (
                <div className="flex flex-wrap items-center gap-3">
                    <div className={cn(PULSE, "h-10 w-48 rounded-lg")} />
                    <div className={cn(PULSE, "h-10 w-36 rounded-lg")} />
                    <div className={cn(PULSE, "h-10 w-36 rounded-lg")} />
                    <div className={cn(PULSE, "h-10 w-32 rounded-lg")} />
                </div>
            )}

            {showTable && (
                <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl overflow-hidden">
                    <TableSkeleton columns={tableColumns} rows={tableRows} showFooter />
                </div>
            )}

            {showCards && <CardsGridSkeleton count={6} />}
        </div>
    )
}

export function CardsGridSkeleton({
    count = 6,
    className,
}: {
    count?: number
    className?: string
}) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-5 space-y-4"
                >
                    <div className={cn(PULSE, "size-10 rounded-xl")} />
                    <div className={cn(PULSE, "h-5 w-3/4")} />
                    <div className={cn(PULSE_SOFT, "h-3 w-full")} />
                    <div className={cn(PULSE_SOFT, "h-3 w-5/6")} />
                    <div className="flex items-center justify-between pt-3 border-t border-brand-secondary/15">
                        <div className={cn(PULSE, "h-3 w-20")} />
                        <div className={cn(PULSE, "size-4 rounded")} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function StatsRowSkeleton({ count = 3, className }: { count?: number; className?: string }) {
    return (
        <div className={cn("flex flex-col sm:flex-row gap-8 py-2", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className={cn(PULSE, "size-14 rounded-2xl")} />
                    <div className="space-y-2">
                        <div className={cn(PULSE_SOFT, "h-3 w-28")} />
                        <div className={cn(PULSE, "h-7 w-14")} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function FormPageSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-8 animate-in fade-in duration-300 max-w-4xl", className)}>
            <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 sm:p-8 space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className={cn(PULSE_SOFT, "h-3 w-28")} />
                        <div className={cn(PULSE, "h-11 w-full rounded-lg")} />
                    </div>
                ))}
                <div className="flex justify-end gap-3 pt-4">
                    <div className={cn(PULSE, "h-10 w-28 rounded-lg")} />
                    <div className={cn(PULSE, "h-10 w-36 rounded-lg")} />
                </div>
            </div>
        </div>
    )
}

export function DashboardShellSkeleton() {
    return (
        <div className="flex h-screen overflow-hidden bg-transparent app-bg animate-in fade-in duration-300">
            <div className="hidden md:flex w-64 shrink-0 flex-col gap-4 border-r border-white/30 bg-white/20 p-4">
                <div className={cn(PULSE, "h-10 w-36")} />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={cn(PULSE, "h-9 w-full rounded-lg")} />
                ))}
            </div>
            <div className="flex-1 overflow-auto p-6 sm:p-8">
                <DashboardPageSkeleton />
            </div>
        </div>
    )
}

export function DashboardPageSkeleton() {
    return <PageSkeleton showStats showTable tableColumns={6} tableRows={5} />
}

export function ListPageSkeleton() {
    return (
        <PageSkeleton showStats showFilters showTable tableColumns={6} tableRows={6} />
    )
}

export function DetailPageSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("space-y-8 animate-in fade-in duration-300", className)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 space-y-4">
                        <div className={cn(PULSE, "h-6 w-48")} />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className={cn(PULSE_SOFT, "h-4 w-28 shrink-0")} />
                                <div className={cn(PULSE, "h-4 flex-1")} />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 space-y-4">
                        <div className={cn(PULSE, "h-6 w-40")} />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={cn(PULSE, "h-14 w-full rounded-lg")} />
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 space-y-4">
                        <div className={cn(PULSE, "h-6 w-32")} />
                        <div className="flex items-center gap-3">
                            <div className={cn(PULSE, "size-12 rounded-full")} />
                            <div className="space-y-2 flex-1">
                                <div className={cn(PULSE, "h-4 w-32")} />
                                <div className={cn(PULSE_SOFT, "h-3 w-24")} />
                            </div>
                        </div>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={cn(PULSE_SOFT, "h-4 w-full")} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CardsPageSkeleton() {
    return <PageSkeleton showFilters showCards />
}

export function InlineTableSkeleton({
    columns = 5,
    rows = 5,
    className,
}: {
    columns?: number
    rows?: number
    className?: string
}) {
    return (
        <div
            className={cn(
                "bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl overflow-hidden",
                className
            )}
        >
            <TableSkeleton columns={columns} rows={rows} showFooter />
        </div>
    )
}

export function PanelSkeleton({ className, rows = 4 }: { className?: string; rows?: number }) {
    return (
        <div
            className={cn(
                "bg-white/40 backdrop-blur-lg border border-white/60 rounded-xl p-6 space-y-4 animate-in fade-in duration-300",
                className
            )}
        >
            <div className={cn(PULSE, "h-6 w-40")} />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={cn(PULSE, "h-12 w-full rounded-lg")} />
            ))}
        </div>
    )
}
