"use client"

import Image from "next/image"
import Link from "next/link"
import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/page-loader"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"

import { Mail, MapPin } from "lucide-react"
import { BluryCard } from "@/components/shared/blury-card"

type PageProps = {
    params: Promise<{ "student-id": string }>
}



export default function StudentDetailPage({ params }: PageProps) {
    const { "student-id": id } = use(params)

    const { data: student, isLoading, isError } = useQuery({
        queryKey: ["students", id],
        queryFn: async () => {
            const res = await fetch(`/api/student/${id}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch")
            return json.data
        },
        enabled: !!id,
    })

    const { data: applicationsData, isLoading: appsLoading } = useQuery({
        queryKey: ["applications", "student", id],
        queryFn: async () => {
            const res = await fetch(`/api/application?student_id=${id}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch applications")
            return json.data as {
                id: string
                application_no: string | null
                status: string
                created_at: string
                program: { id: string; name: string | null } | null
                agent: { id: string; name: string | null } | null
            }[]
        },
        enabled: !!id,
    })

    const studentApplications = Array.isArray(applicationsData) ? applicationsData : []

    if (isLoading) return <PageLoader label="Loading profile..." />
    if (isError || !student) return (
        <div className="py-20 text-center">
            <Typography as="p" font="sub-text" className="font-bold text-gray-500">Student not found.</Typography>
        </div>

    )

    const s = student.student
    const eduList: any[] = Array.isArray(student.education) ? student.education : student.education ? [student.education] : []
    const edu = eduList[0]
    const avatarSrc = student.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name ?? "S")}&background=random`

    const basicInfo = [
        { label: "Email", value: student.email },
        { label: "Gender", value: student.gender },
        { label: "Nationality", value: s?.nationality },
        { label: "Date of Birth", value: student.date_of_birth },
        { label: "Phone", value: student.phone },
        { label: "Guardian Email", value: s?.guardian_email },
        { label: "Country", value: s?.country },
        { label: "Guardian Phone", value: s?.guardian_phone },
    ]

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 px-6 lg:px-12 pt-4">

            {/* ── Header ── */}
            <div className="flex justify-between flex-wrap items-center gap-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Typography as="h1" font="sub-text" className="text-gray-500 font-bold uppercase">
                            {`ID: ${s?.student_code || 'N/A'}`}
                        </Typography>

                        <Typography as="h1" font="text-xl">
                            {student.name}
                        </Typography>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {student.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="size-4 opacity-60" />
                                <Typography font="sub-text" className="text-gray-500">{student.email}</Typography>
                            </div>
                        )}
                        {s?.country && (
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 opacity-60" />
                                <Typography font="sub-text" className="text-gray-500">{s.city ? `${s.city}, ${s.country}` : s.country}</Typography>
                            </div>
                        )}
                    </div>

                </div>
                <Link href={`/dashboard/student/${id}/edit`}>
                    <Button value={'default'} className="px-4">
                        Edit Profile
                    </Button>
                </Link>
            </div>

            {/* ── Profile + Academic ── */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                childClass="space-y-10"
                className='rounded-lg'
            >

                <div className="flex flex-col sm:flex-row gap-8">
                    <div className="shrink-0">
                        <Image
                            src={avatarSrc}
                            alt={student.name ?? "Student"}
                            width={160}
                            height={160}
                            className="size-40 rounded-[28px] object-cover border-4 border-white/40 shadow-xl"
                            unoptimized
                        />
                    </div>

                    <div className="flex-1 space-y-6">
                        <Typography as="h3" font="text-xl" className="text-gray-900">Academic Record</Typography>

                        <div className="space-y-6">
                            {eduList.length === 0 ? (
                                <Typography as="p" font="sub-text" className="text-gray-400">No academic records found.</Typography>
                            ) : eduList.map((e: any, i: number) => {
                                const obtained = parseFloat(e.obtained_marks)
                                const total = parseFloat(e.total_marks)
                                const percentage = (!isNaN(obtained) && !isNaN(total) && total > 0)
                                    ? ((obtained / total) * 100).toFixed(1)
                                    : null

                                return (
                                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 border-b border-gray-200/30 last:border-0">
                                        <div className="space-y-1">
                                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Degree</Typography>
                                            <Typography as="p" font="title" className="text-gray-900">{e.degree?.name ?? "—"}</Typography>
                                            <Typography as="p" font="small" className="text-gray-500 capitalize">{e.degree?.level?.toLowerCase() ?? ""}</Typography>
                                        </div>

                                        <div className="space-y-1">
                                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Institution</Typography>
                                            <Typography as="p" font="title" className="text-gray-900">{e.institution_name ?? "—"}</Typography>
                                        </div>

                                        <div className="space-y-1">
                                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Marks</Typography>
                                            <Typography as="p" font="title" className="text-gray-900">
                                                {e.obtained_marks ?? "—"} / {e.total_marks ?? "—"}
                                            </Typography>
                                        </div>

                                        <div className="space-y-1">
                                            <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">Percentage</Typography>
                                            <Typography as="p" font="title" className="text-gray-900">
                                                {percentage ? `${percentage}%` : "—"}
                                            </Typography>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>


                {/* ── Basic Info ── */}
                <div className="space-y-6">
                    <Typography as="h3" font="text-xl" className="text-gray-900">Basic Info</Typography>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                        {basicInfo.map(({ label, value }) => (
                            <div key={label} className="space-y-1 border-b border-gray-200/40 pb-3">
                                <Typography as="p" font="small" className="text-gray-400 uppercase tracking-widest">{label}</Typography>
                                <Typography as="p" font="sub-text" className="font-semibold text-gray-800">{value ?? "—"}</Typography>
                            </div>
                        ))}
                    </div>

                </div>
            </BluryCard>


            {/* ── Applications Table ── */}
            <div className="space-y-6">
                <Typography as="h3" font="text-xl" className="text-gray-900">Applications Applied For</Typography>


                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-lg"
                    childClass='p-0!'
                    className='rounded-lg p-0'
                >
                    <div className="overflow-x-auto">
                        <Table className="w-full min-w-[900px]">
                            <TableHeader>
                                <TableRow className="border-b border-white/20 bg-white/30 hover:bg-white/30">
                                    <TableHead className="px-8 py-6"><Typography font="small" className="text-gray-500 uppercase tracking-widest">Application</Typography></TableHead>
                                    <TableHead className="px-8 py-6"><Typography font="small" className="text-gray-500 uppercase tracking-widest">Program</Typography></TableHead>
                                    <TableHead className="px-8 py-6"><Typography font="small" className="text-gray-500 uppercase tracking-widest">Status</Typography></TableHead>
                                    <TableHead className="px-8 py-6"><Typography font="small" className="text-gray-500 uppercase tracking-widest leading-tight">Submission Date</Typography></TableHead>
                                    <TableHead className="px-8 py-6"><Typography font="small" className="text-gray-500 uppercase tracking-widest">Action</Typography></TableHead>
                                </TableRow>

                            </TableHeader>
                            <TableBody className="divide-y divide-white/10">
                                {appsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-8 py-10 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="size-4 border-2 border-gray-300 border-t-[#9B51E0] rounded-full animate-spin" />
                                                <Typography as="span" className="text-sm text-gray-400">Loading applications...</Typography>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : studentApplications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-8 py-10 text-center">
                                            <Typography as="p" className="text-sm text-gray-500">No applications found for this student.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : studentApplications.map((app) => (
                                    <TableRow key={app.id} className="hover:bg-white/10 transition-colors border-b border-white/10">
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography font="sub-text" as="span" className="font-light">
                                                {app.application_no ?? app.id.slice(0, 8).toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" font="sub-text" className="font-medium">
                                                {app.program?.name ?? "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <StatusBadge status={app.status} />
                                        </TableCell>
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography font="small" className="text-gray-600">
                                                {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-[#1e3a8a] hover:bg-white/40 hover:text-[#1e3a8a] rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                                disabled={!app.program?.id}
                                            >
                                                <Link href={app.program?.id ? `/dashboard/program/${app.program.id}` : "#"}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                        <div className="flex items-center space-x-1">
                            <Typography font="small" className="text-gray-500">Showing</Typography>
                            <Typography font="small" className="font-bold text-[#1e3a8a] mx-1">{studentApplications.length}</Typography>
                            <Typography font="small" className="text-gray-500">entries</Typography>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="size-8 rounded-lg bg-white/40 hover:bg-white/60 flex items-center justify-center border border-white/40 transition-all text-gray-600 shadow-sm">
                                <ChevronLeft className="size-4" />
                            </button>
                            <button className="size-8 rounded-lg bg-white/40 hover:bg-white/60 flex items-center justify-center border border-white/40 transition-all text-gray-600 shadow-sm">
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </BluryCard>
            </div>

            {/* ── Documents Section ── */}
            {s?.passport_file_url && (
                <div className="space-y-6">
                    <Typography as="h3" font="text-xl" className="text-gray-900">Documents</Typography>

                    <BluryCard
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        childClass="p-6"
                        className='rounded-lg w-full max-w-2xl'
                    >
                        <div className="space-y-4">
                            <Typography as="p" font="small" className="text-gray-700 uppercase tracking-widest">Passport Copy</Typography>

                            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                                <Image
                                    src={s.passport_file_url}
                                    alt="Passport"
                                    fill
                                    className="object-contain bg-black/5"
                                    unoptimized
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" className="text-xs h-9" asChild>
                                    <a href={s.passport_file_url} target="_blank" rel="noopener noreferrer">
                                        View Original
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </BluryCard>
                </div>
            )}
        </div >
    )
}
