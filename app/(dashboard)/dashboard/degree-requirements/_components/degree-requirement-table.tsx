"use client"

import { memo } from "react"
import { AlertCircle, FileStack, RotateCcw } from "lucide-react"
import { TableSkeleton } from "@/components/shared/table-skeleton"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { DegreeRequirementListItem } from "@/types/schemas/degree-requirement"
import { cn } from "@/lib/utils"

type DegreeRequirementTableProps = {
    requirements: DegreeRequirementListItem[]
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    removingId: string | null
    onEdit: (item: DegreeRequirementListItem) => void
    onRemove: (item: DegreeRequirementListItem) => void
    onRestore: (item: DegreeRequirementListItem) => void
    onRetry: () => void
}

const COLUMN_COUNT = 5

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export const DegreeRequirementTable = memo(function DegreeRequirementTable({
    requirements,
    isLoading,
    isError,
    errorMessage,
    removingId,
    onEdit,
    onRemove,
    onRestore,
    onRetry,
}: DegreeRequirementTableProps) {
    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <TableSkeleton columns={5} rows={6} showFooter />
            </BluryCard>
        )
    }

    if (isError) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <div className="px-4 text-center">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            {errorMessage || "Failed to load degree requirements"}
                        </Typography>
                        <Typography as="p" className="mt-1 text-xs text-gray-500">
                            Check your connection and try again.
                        </Typography>
                    </div>
                    <Button type="button" onClick={onRetry} className="gap-2">
                        <RotateCcw className="size-4" />
                        Retry
                    </Button>
                </div>
            </BluryCard>
        )
    }

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="p-0!"
            className="rounded-lg p-0"
        >
            <div className="w-full max-w-full overflow-x-auto rounded-xl pb-2">
                <Table className="w-full min-w-[900px] border-collapse text-left">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Degree
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Document
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Type
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Updated
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {requirements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileStack className="size-8 text-gray-300" />
                                        <Typography as="p" className="text-sm font-medium text-gray-500">
                                            No degree requirements yet.
                                        </Typography>
                                        <Typography as="p" className="text-xs text-gray-400">
                                            Create one to assign required or optional documents to a
                                            degree.
                                        </Typography>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            requirements.map((item, index) => (
                                <TableRow
                                    key={item.id}
                                    className={cn(
                                        "border-b border-brand-secondary/15 transition-colors",
                                        index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                        "hover:bg-brand-secondary/5",
                                        item.is_deleted && "opacity-60",
                                        removingId === item.id && "opacity-50"
                                    )}
                                >
                                    <TableCell className="px-6 py-5">
                                        <Typography
                                            as="span"
                                            className="block text-sm font-bold text-gray-900"
                                        >
                                            {item.degree_name}
                                        </Typography>
                                        {item.degree_location ? (
                                            <Typography
                                                as="span"
                                                className="block text-[11px] font-light text-gray-500"
                                            >
                                                {item.degree_location}
                                            </Typography>
                                        ) : null}
                                    </TableCell>

                                    <TableCell className="px-6 py-5">
                                        <Typography
                                            as="span"
                                            className="block text-sm font-semibold text-gray-800"
                                        >
                                            {item.document_type_name}
                                        </Typography>
                                        {item.document_type_code ? (
                                            <Typography
                                                as="span"
                                                className="block text-[11px] font-light text-gray-500"
                                            >
                                                {item.document_type_code}
                                            </Typography>
                                        ) : null}
                                    </TableCell>

                                    <TableCell className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "rounded-full",
                                                    item.requirement_type === "REQUIRED"
                                                        ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-blue-text"
                                                        : "border-gray-300 bg-white/70 text-gray-600"
                                                )}
                                            >
                                                {item.requirement_type}
                                            </Badge>
                                            {item.is_deleted ? (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full border-orange-200 bg-orange-50 text-orange-700"
                                                >
                                                    Removed
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-5 whitespace-nowrap">
                                        <Typography
                                            as="span"
                                            className="text-sm font-medium text-gray-600"
                                        >
                                            {formatDate(item.updated_at)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            {item.is_deleted ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-9 rounded-lg border-white/40 bg-white/20 px-4 text-[12px] font-bold"
                                                    onClick={() => onRestore(item)}
                                                >
                                                    Restore
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 rounded-lg border-white/40 bg-white/20 px-4 text-[12px] font-bold"
                                                        onClick={() => onEdit(item)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 rounded-lg border-red-200 bg-white/20 px-4 text-[12px] font-bold text-red-600 hover:bg-red-50"
                                                        disabled={removingId === item.id}
                                                        onClick={() => onRemove(item)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>

                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="border-0 hover:bg-brand-secondary/10">
                            <TableCell colSpan={COLUMN_COUNT} className="px-8 py-5">
                                <Typography as="span" className="text-sm font-medium text-gray-600">
                                    Showing {requirements.length} entr
                                    {requirements.length === 1 ? "y" : "ies"}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </BluryCard>
    )
})
