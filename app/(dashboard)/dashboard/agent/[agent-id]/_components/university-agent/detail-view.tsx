"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, FileText, Mail, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
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
import type { UniversityAgentDetail } from "@/types/schemas/university-agent"

type UniversityAgentDetailViewProps = {
    detail: UniversityAgentDetail
}

export const UniversityAgentDetailView = memo(function UniversityAgentDetailView({
    detail,
}: UniversityAgentDetailViewProps) {
    const avatarSrc =
        detail.avatar_url ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.name)}&background=random`

    const basicInfo = [
        { label: "Email", value: detail.basic_info.email },
        { label: "Gender", value: detail.basic_info.gender },
        { label: "Nationality", value: detail.basic_info.nationality },
        { label: "Country", value: detail.basic_info.country },
        { label: "Contact", value: detail.basic_info.phone },
        { label: "Other Contact", value: detail.basic_info.other_contact_number },
        { label: "Web", value: detail.basic_info.website },
        { label: "Address", value: detail.basic_info.address },
    ]

    return (
        <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 pt-4 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
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

                <div className="flex flex-col items-start gap-4 lg:items-end">
                    <Typography as="p" font="small" className="font-bold uppercase tracking-[0.12em] text-gray-500">
                        Students Count: {detail.students_count}
                    </Typography>
                    <Card className="border-none bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
                        <Typography as="p" font="small" className="font-bold uppercase tracking-[0.12em] text-brand-byzantine">
                            Student Enrolled
                        </Typography>
                        <div className="mt-3 flex items-center gap-3">
                            <FileText className="size-5 text-brand-byzantine" />
                            <Typography as="p" font="sub-text" className="text-brand-primary">
                                {detail.enrolled_count} Students get enrolled successfully
                            </Typography>
                        </div>
                    </Card>
                </div>
            </div>

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
                    <div className="flex-1 space-y-4">
                        <Typography as="h3" font="title" className="font-bold text-brand-primary">
                            {detail.agency_info.agency_name ?? detail.name}
                        </Typography>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="space-y-1">
                                <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                    Address
                                </Typography>
                                <Typography as="p" font="sub-text" className="font-semibold text-brand-primary">
                                    {detail.agency_info.address ?? "—"}
                                </Typography>
                            </div>
                            <div className="space-y-1">
                                <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                    Experience
                                </Typography>
                                <Typography as="p" font="sub-text" className="font-semibold text-brand-primary">
                                    {detail.agency_info.experience_years != null
                                        ? `${detail.agency_info.experience_years} years`
                                        : "—"}
                                </Typography>
                            </div>
                            <div className="space-y-1">
                                <Typography as="p" font="small" className="uppercase tracking-widest text-gray-400">
                                    Contact
                                </Typography>
                                <Typography as="p" font="sub-text" className="font-semibold text-brand-primary">
                                    {detail.agency_info.phone ?? "—"}
                                </Typography>
                                <Typography as="p" font="sub-text" className="text-gray-500">
                                    {detail.agency_info.other_contact_number ?? "—"}
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
                    Document
                </Typography>
                <Card className="border-none bg-white shadow-sm ring-1 ring-black/5">
                    {detail.documents.length === 0 ? (
                        <div className="px-6 py-10">
                            <Typography as="p" font="sub-text" className="text-gray-500">
                                No documents uploaded yet.
                            </Typography>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {detail.documents.map((document) => (
                                <div
                                    key={document.id}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="size-5 text-brand-blue" />
                                        <div>
                                            <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                {document.name}
                                            </Typography>
                                            <Typography as="p" font="sub-text" className="text-gray-500">
                                                Uploaded {document.uploaded_at ?? "—"}
                                            </Typography>
                                        </div>
                                    </div>
                                    {document.file_url ? (
                                        <a
                                            href={document.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-500 hover:text-brand-blue"
                                        >
                                            <Eye className="size-4" />
                                        </a>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <Typography as="h3" font="title" className="font-bold text-brand-primary">
                        Students
                    </Typography>
                    <Link href="/dashboard/student" className="font-bold uppercase tracking-wide text-brand-blue">
                        View All
                    </Link>
                </div>

                <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {["Student ID", "Program", "Status", "Submission Date", "Action"].map(
                                        (heading) => (
                                            <TableHead key={heading} className="px-6 py-5">
                                                <Typography
                                                    as="span"
                                                    font="small"
                                                    className="uppercase tracking-[0.12em] text-gray-500"
                                                >
                                                    {heading}
                                                </Typography>
                                            </TableHead>
                                        )
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detail.students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-6 py-10 text-center">
                                            <Typography as="span" font="sub-text" className="text-gray-500">
                                                No students linked to this agent yet.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    detail.students.map((student) => (
                                        <TableRow key={student.profile_id}>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="span" font="sub-text">
                                                    {student.student_code ?? student.profile_id.slice(0, 8).toUpperCase()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="p" font="sub-text" className="font-medium">
                                                    {student.program_name ?? "—"}
                                                </Typography>
                                                <Typography as="p" font="small" className="text-gray-500">
                                                    {student.intake_label ?? "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <StudentPipelineBadge status={student.pipeline_status} />
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Typography as="span" font="sub-text" className="text-gray-600">
                                                    {student.submission_date ?? "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <Link
                                                    href={`/dashboard/student/${student.profile_id}`}
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
    )
})
