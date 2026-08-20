import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableFooter,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const ROW_WIDTHS = ["72%", "58%", "64%", "48%", "80%", "55%"] as const
const SUB_WIDTHS = ["42%", "36%", "48%", "30%", "40%", "34%"] as const

type TableSkeletonProps = {
    columns: number
    rows?: number
    showFooter?: boolean
    className?: string
}

export function TableSkeleton({
    columns,
    rows = 5,
    showFooter = true,
    className,
}: TableSkeletonProps) {
    return (
        <div className={cn("overflow-x-auto rounded-xl", className)}>
            <Table className="w-full text-left border-collapse">
                <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableHead key={i} className="px-6 py-4">
                                <div className="h-4 w-20 bg-gray-200/60 rounded animate-pulse" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody className="bg-white/45">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            className={cn(
                                "border-b border-brand-secondary/15",
                                rowIndex % 2 === 0 ? "bg-white/70" : "bg-white/45"
                            )}
                        >
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <TableCell key={colIndex} className="px-6 py-5">
                                    <div className="space-y-2">
                                        <div
                                            className="h-4 bg-gray-200/60 rounded animate-pulse"
                                            style={{
                                                width: ROW_WIDTHS[(rowIndex + colIndex) % ROW_WIDTHS.length],
                                            }}
                                        />
                                        {colIndex === 0 && (
                                            <div
                                                className="h-3 bg-gray-200/40 rounded animate-pulse"
                                                style={{
                                                    width: SUB_WIDTHS[rowIndex % SUB_WIDTHS.length],
                                                }}
                                            />
                                        )}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>

                {showFooter && (
                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="hover:bg-brand-secondary/10 border-0">
                            <TableCell colSpan={columns} className="px-8 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-32 bg-gray-200/60 rounded animate-pulse" />
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 bg-gray-200/60 rounded animate-pulse" />
                                        <div className="h-4 w-16 bg-gray-200/60 rounded animate-pulse" />
                                        <div className="h-9 w-9 bg-gray-200/60 rounded animate-pulse" />
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    )
}
