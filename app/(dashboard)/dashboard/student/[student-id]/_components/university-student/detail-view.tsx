"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Building2, Mail, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { StudentPipelineBadge } from "@/components/shared/student-pipeline-badge"
import { StudentProgressCard } from "./progress-card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { UniversityStudentDetail } from "@/types/schemas/university-student"

type UniversityStudentDetailViewProps = {
    detail: UniversityStudentDetail
}

export const UniversityStudentDetailView = memo(function UniversityStudentDetailView({
    detail,
}: UniversityStudentDetailViewProps) {
    const avatarSrc =
        detail.avatar_url ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.name)}&background=random`

    const basicInfo = [
        { label: "Name", value: detail.basic_info.name },
        { label: "Email", value: detail.basic_info.email },
        { label: "Date of Birth", value: detail.basic_info.date_of_birth },
        { label: "Nationality", value: detail.basic_info.nationality },
        { label: "Phone", value: detail.basic_info.phone },
        { label: "Guardian Phone", value: detail.basic_info.guardian_phone },
    ]

    return (
        <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 pt-4 lg:px-8">
            <div className="space-y-4">
                <Typography as="p" font="small" className="font-bold uppercase tracking-[0.12em] text-gray-500">
                    ID: {detail.display_id ?? detail.profile_id}
                </Typography>
                <Typography as="h1" font="text-xl" className="font-bold text-brand-primary">
                    {detail.name}
                </Typography>
                <div className="flex flex-wrap items-center gap-4">
                    {detail.email ? (
                        <div className="flex items-center gap-2">
                            <Mail className="size-4 text-gray-500" />
                            <Typography as="span" font="sub-text" className="text-gray-500">
                                {detail.email}
                            </Typography>
                        </div>
                    ) : null}
                    {detail.location && detail.location !== "—" ? (
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-gray-500" />
                            <Typography as="span" font="sub-text" className="text-gray-500">
                                {detail.location}
                            </Typography>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card className="border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <Image
                                src={avatarSrc}
                                alt={detail.name}
                                width={160}
                                height={160}
                                className="size-40 rounded-[28px] border-4 border-white object-cover shadow-xl"
                                unoptimized
                            />
                            <div className="flex-1 space-y-6">
                                <Typography as="h3" font="title" className="font-bold text-brand-primary">
                                    Academic Record
                                </Typography>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Previous Degree
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.previous_degree ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.institution_name ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Final GPA
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.gpa_label ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.honors_label ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Program Selection
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-blue">
                                            {detail.academic_record.program_selection ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-brand-blue">
                                            {detail.academic_record.intake_label ?? "—"}
                                        </Typography>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                            Tuition Status
                                        </Typography>
                                        <Typography as="p" font="title" className="text-brand-primary">
                                            {detail.academic_record.tuition_status ?? "—"}
                                        </Typography>
                                        <Typography as="p" font="sub-text" className="text-gray-500">
                                            {detail.academic_record.tuition_total ?? "—"}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none bg-white/80 px-5 py-6 shadow-sm ring-1 ring-black/5 backdrop-blur-lg">
                        <Typography as="h3" font="title" className="mb-6 font-bold text-brand-primary">
                            Basic Info
                        </Typography>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {basicInfo.map((item) => (
                                <div key={item.label} className="space-y-1 border-b border-gray-100 pb-3">
                                    <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                        {item.label}
                                    </Typography>
                                    <Typography as="p" font="sub-text" className="font-semibold text-brand-primary">
                                        {item.value ?? "—"}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Typography as="h3" font="title" className="font-bold text-brand-primary">
                            Applications Applied For
                        </Typography>
                        <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[900px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            {[
                                                "Application ID",
                                                "Program",
                                                "Status",
                                                "Submission Date",
                                                "Action",
                                            ].map((heading) => (
                                                <TableHead key={heading} className="px-6 py-5">
                                                    <Typography
                                                        as="span"
                                                        font="small"
                                                        className="uppercase tracking-[0.12em] text-gray-500"
                                                    >
                                                        {heading}
                                                    </Typography>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detail.applications.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="px-6 py-10 text-center">
                                                    <Typography as="span" font="sub-text" className="text-gray-500">
                                                        No applications found for this student.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            detail.applications.map((application) => (
                                                <TableRow key={application.id}>
                                                    <TableCell className="px-6 py-5">
                                                        <Typography as="span" font="sub-text">
                                                            {application.application_no ??
                                                                application.id.slice(0, 8).toUpperCase()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-5">
                                                        <Typography as="span" font="sub-text" className="font-medium">
                                                            {application.program_name ?? "—"}
                                                            {application.intake_label
                                                                ? ` (${application.intake_label})`
                                                                : ""}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-5">
                                                        <StudentPipelineBadge status={application.pipeline_status} />
                                                    </TableCell>
                                                    <TableCell className="px-6 py-5">
                                                        <Typography as="span" font="sub-text" className="text-gray-600">
                                                            {application.submission_date}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-5">
                                                        <Link
                                                            href={`/dashboard/application/${application.id}`}
                                                            className="font-bold uppercase tracking-wide text-brand-blue"
                                                        >
                                                            View
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="space-y-6">
                    <StudentProgressCard progress={detail.progress} />

                    {detail.submission_source ? (
                        <Card className="border-none bg-brand-byzantine/10 px-5 py-5 shadow-sm ring-1 ring-brand-byzantine/20">
                            <Typography
                                as="p"
                                font="small"
                                className="font-bold uppercase tracking-[0.14em] text-brand-byzantine"
                            >
                                Submission Source
                            </Typography>
                            <div className="mt-4 flex items-start gap-3">
                                <Building2 className="mt-1 size-5 text-brand-byzantine" />
                                <div className="space-y-1">
                                    <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                        {detail.submission_source.organization}
                                    </Typography>
                                    {detail.submission_source.agent_name ? (
                                        <Typography as="p" font="sub-text" className="text-gray-600">
                                            University Partner: {detail.submission_source.agent_name}
                                        </Typography>
                                    ) : null}
                                </div>
                            </div>
                        </Card>
                    ) : null}
                </div>
            </div>
        </div>
    )
})
