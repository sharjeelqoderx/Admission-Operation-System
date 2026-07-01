"use client"

import { memo, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { UniversityOverviewRecent } from "@/types/schemas/university-overview"

const TABLE_HEAD_CLASS =
    "px-4 py-3.5 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase"

function tableRowClass(index: number) {
    return cn(
        "border-b border-brand-secondary/15 transition-colors hover:bg-brand-secondary/8",
        index % 2 === 0 ? "bg-white/70" : "bg-white/45"
    )
}

type OverviewRecentSectionProps = {
    title: string
    viewAllHref: string
    children: ReactNode
}

const OverviewRecentSection = memo(function OverviewRecentSection({
    title,
    viewAllHref,
    children,
}: OverviewRecentSectionProps) {
    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="flex h-full flex-col p-0!"
            className="h-full overflow-hidden rounded-xl shadow-sm"
        >
            <div className="flex items-center justify-between gap-3 border-b border-brand-secondary/20 bg-brand-secondary/8 px-5 py-4">
                <Typography as="h3" font="text-xl" className="font-bold text-brand-primary">
                    {title}
                </Typography>
                <Button
                    variant="link"
                    className="h-auto shrink-0 gap-1.5 px-0 font-bold text-brand-byzantine hover:gap-2.5 transition-all"
                    asChild
                >
                    <Link href={viewAllHref}>
                        View All
                        <ArrowRight className="size-4" />
                    </Link>
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-auto">{children}</div>
        </BluryCard>
    )
})

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="px-6 py-10 text-center">
                <Typography as="p" font="sub-text" className="text-gray-400">
                    {message}
                </Typography>
            </TableCell>
        </TableRow>
    )
}

type OverviewRecentTablesProps = {
    recent: UniversityOverviewRecent
}

export const OverviewRecentTables = memo(function OverviewRecentTables({
    recent,
}: OverviewRecentTablesProps) {
    return (
        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <OverviewRecentSection title="Recent Students" viewAllHref="/dashboard/student">
                <Table className="min-w-[420px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className={TABLE_HEAD_CLASS}>Name</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Program</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/45">
                        {recent.students.length === 0 ? (
                            <EmptyRow colSpan={3} message="No students yet" />
                        ) : (
                            recent.students.map((student, index) => (
                                <TableRow key={student.profile_id} className={tableRowClass(index)}>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-bold text-gray-900">
                                            {student.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {student.program_name ?? "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <StudentPipelineBadge status={student.pipeline_status} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </OverviewRecentSection>

            <OverviewRecentSection title="Recent Applications" viewAllHref="/dashboard/application">
                <Table className="min-w-[420px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className={TABLE_HEAD_CLASS}>Student</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Program</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/45">
                        {recent.applications.length === 0 ? (
                            <EmptyRow colSpan={3} message="No applications yet" />
                        ) : (
                            recent.applications.map((application, index) => (
                                <TableRow key={application.id} className={tableRowClass(index)}>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-bold text-gray-900">
                                            {application.student_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {application.program_name ?? "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <StudentPipelineBadge status={application.pipeline_status} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </OverviewRecentSection>

            <OverviewRecentSection title="Recent Programs" viewAllHref="/dashboard/program">
                <Table className="min-w-[420px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className={TABLE_HEAD_CLASS}>Program</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Category</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/45">
                        {recent.programs.length === 0 ? (
                            <EmptyRow colSpan={3} message="No programs yet" />
                        ) : (
                            recent.programs.map((program, index) => (
                                <TableRow key={program.id} className={tableRowClass(index)}>
                                    <TableCell className="max-w-[160px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-bold text-brand-primary">
                                            {program.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="max-w-[120px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {program.category ?? "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <Typography
                                            as="span"
                                            className="inline-flex rounded-full bg-brand-secondary/15 px-2.5 py-1 text-[11px] font-semibold capitalize text-brand-blue-text"
                                        >
                                            {program.status.toLowerCase()}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </OverviewRecentSection>

            <OverviewRecentSection title="Recent Offers" viewAllHref="/dashboard/offer">
                <Table className="min-w-[420px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className={TABLE_HEAD_CLASS}>Student</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Program</TableHead>
                            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white/45">
                        {recent.offers.length === 0 ? (
                            <EmptyRow colSpan={3} message="No offers yet" />
                        ) : (
                            recent.offers.map((offer, index) => (
                                <TableRow key={offer.id} className={tableRowClass(index)}>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-bold text-gray-900">
                                            {offer.student_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate px-4 py-4">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {offer.program_name ?? "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="px-4 py-4">
                                        <Typography
                                            as="span"
                                            className="inline-flex rounded-full bg-brand-byzantine/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-brand-byzantine"
                                        >
                                            {offer.status.toLowerCase()}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </OverviewRecentSection>
        </div>
    )
})
