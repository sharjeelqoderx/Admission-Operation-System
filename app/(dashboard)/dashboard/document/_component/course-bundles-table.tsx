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
import { getDegreeLevels } from "./degree-documents-shared"

type Props = {
    bundles: DegreeDocumentBundle[]
    studentId: string
}

export function CourseBundlesTable({ bundles, studentId }: Props) {
    return (
        <BluryCard
            isCentered={false}
            childClass="p-0!"
            className="rounded-2xl overflow-hidden"
        >
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <Typography as="h3" font="text-lg" className="font-bold text-gray-900">
                    All programs & courses
                </Typography>
                <Typography as="p" font="small" className="text-gray-500 mt-1">
                    Select a program to view and upload required documents.
                </Typography>
            </div>

            <Table>
                <TableHeader className="bg-gray-50/80">
                    <TableRow>
                        <TableHead className="font-semibold text-gray-700 min-w-[220px]">
                            Program
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">Level</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[160px]">
                            Location
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[200px]">
                            Courses
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[140px]">
                            Documents
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 w-[120px] text-right">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bundles.map((bundle) => {
                        const levels = getDegreeLevels(bundle.degree)

                        return (
                            <TableRow key={bundle.degree.id} className="align-middle">
                                <TableCell>
                                    <div className="flex items-start gap-2">
                                        <GraduationCap
                                            className="size-4 text-brand-byzantine shrink-0 mt-0.5"
                                        />
                                        <div className="min-w-0">
                                            <Typography
                                                font="text"
                                                className="font-semibold text-gray-900"
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
                                <TableCell>
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
                                <TableCell>
                                    {bundle.degree.location ? (
                                        <span className="text-sm text-gray-600 flex items-center gap-1">
                                            <MapPin className="size-3.5 shrink-0" />
                                            {bundle.degree.location}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {bundle.courses.length === 0 ? (
                                        <span className="text-gray-400 text-sm">—</span>
                                    ) : bundle.courses.length === 1 ? (
                                        <span className="text-sm text-gray-700">
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
                                        <div className="text-sm text-gray-700 space-y-1">
                                            {bundle.courses.slice(0, 2).map((course) => (
                                                <div key={course.id}>{course.name}</div>
                                            ))}
                                            {bundle.courses.length > 2 && (
                                                <span className="text-xs text-gray-500">
                                                    +{bundle.courses.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-2 min-w-[120px]">
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span className="text-gray-600">
                                                {bundle.uploaded_count}/{bundle.total_required}
                                            </span>
                                            <span className="font-semibold text-brand-byzantine">
                                                {bundle.completion_percentage}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={bundle.completion_percentage}
                                            className="h-1.5"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
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
        </BluryCard>
    )
}
