"use client"

import Link from "next/link"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { DegreeDocumentBundle } from "@/types/schemas/document"
import { formatStudyMode } from "@/lib/utils/program"
import { formatProgramDate } from "@/lib/utils/program"
import { Clock, ExternalLink, GraduationCap, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDegreeDocumentStats, getDegreeLevels } from "./degree-documents-shared"

type Props = {
    bundles: DegreeDocumentBundle[]
    studentId: string
}

export function CourseBundlesTable({ bundles, studentId }: Props) {
    return (
        <BluryCard
            isCentered={false}
            childClass="p-0!"
            className="p-0! rounded-2xl overflow-hidden"
        >
            {/* <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <Typography as="h3" font="text-lg" className="font-bold text-gray-900">
                    All programs & courses
                </Typography>
                <Typography as="p" font="small" className="text-gray-500 mt-1">
                    Select a program to view and upload required documents.
                </Typography>
            </div> */}

            <div className="w-full overflow-x-auto rounded-xl">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[220px] max-w-[280px]">
                                Program
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[160px]">
                                Level
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[160px]">
                                Location
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[120px] max-w-[150px]">
                                Courses
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase min-w-[140px]">
                                Documents
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase w-[120px] text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/45">
                        {bundles.map((bundle, index) => {
                            const levels = getDegreeLevels(bundle.degree)
                            const documentStats = getDegreeDocumentStats(bundle)

                            return (
                                <TableRow
                                    key={bundle.degree.id}
                                    className={cn(
                                        "align-middle border-b border-brand-secondary/15 transition-colors",
                                        index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                        "hover:bg-brand-secondary/5"
                                    )}
                                >
                                    <TableCell className="px-6 py-5 max-w-[280px]">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <GraduationCap
                                                className="size-4 text-brand-byzantine shrink-0 mt-0.5"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <Typography
                                                    font="text"
                                                    className="font-semibold text-gray-900 truncate max-w-[240px]"
                                                    title={bundle.degree.name}
                                                >
                                                    {bundle.degree.name}
                                                </Typography>
                                                {bundle.degree.duration && (
                                                    <Typography
                                                        font="small"
                                                        className="text-gray-500 flex items-center gap-1 mt-0.5"
                                                    >
                                                        <Clock className="size-3" />
                                                        {bundle.degree.duration}
                                                        {bundle.degree.study_mode
                                                            ? ` · ${formatStudyMode(bundle.degree.study_mode)}`
                                                            : ""}
                                                    </Typography>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 min-w-[160px]">
                                        <div className="flex flex-wrap gap-1">
                                            {levels.length === 0 ? (
                                                <span className="text-gray-400 text-sm">—</span>
                                            ) : (
                                                levels.map((level) => (
                                                    <Badge
                                                        key={level.id}
                                                        variant="outline"
                                                        className="text-[10px] font-medium"
                                                    >
                                                        {level.name}
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        {bundle.degree.location ? (
                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                <MapPin className="size-3.5 shrink-0" />
                                                {bundle.degree.location}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 min-w-[120px] max-w-[150px]">
                                        {bundle.courses.length === 0 ? (
                                            <span className="text-gray-400 text-sm">—</span>
                                        ) : bundle.courses.length === 1 ? (
                                            <span className="text-sm text-gray-700 line-clamp-2">
                                                {bundle.courses[0].name}
                                                {bundle.courses[0].deadline_date && (
                                                    <span className="text-gray-500 block text-xs mt-0.5">
                                                        Deadline:{" "}
                                                        {formatProgramDate(
                                                            bundle.courses[0].deadline_date
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <div className="text-sm text-gray-700 space-y-1 min-w-0">
                                                {bundle.courses.slice(0, 2).map((course) => (
                                                    <div key={course.id} className="truncate">
                                                        {course.name}
                                                    </div>
                                                ))}
                                                {bundle.courses.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{bundle.courses.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="space-y-2 min-w-[120px]">
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <span className="text-gray-600">
                                                    {documentStats.uploaded_count}/
                                                    {documentStats.total_required}
                                                </span>
                                                <span className="font-semibold text-brand-byzantine">
                                                    {documentStats.completion_percentage}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={documentStats.completion_percentage}
                                                className="h-1.5"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 shrink-0"
                                            asChild
                                        >
                                            <Link
                                                href={`/dashboard/document/student/${studentId}/degree/${bundle.degree.id}`}
                                                scroll={false}
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Documents
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </BluryCard>
    )
}
