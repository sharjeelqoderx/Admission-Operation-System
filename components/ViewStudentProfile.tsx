"use client"

import { useStudents } from "@/hooks/useStudents"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Mail, MapPin, Building2, Phone, Calendar, Globe, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export function ViewStudentProfile({ id: propId }: { id?: string } = {}) {
    const searchParams = useSearchParams()
    const id = propId ?? searchParams.get("id") ?? ""

    const { getStudent } = useStudents()
    const { data: student, isLoading, isError } = getStudent(id)

    if (isLoading) return <div className="py-10 text-center"><Typography as="p">Loading profile...</Typography></div>
    if (isError || !student) return <div className="py-10 text-center"><Typography as="p" className="text-red-500">Student not found.</Typography></div>

    // API returns: { ...profile fields, student: {...}, education: {...} }
    const s = student.student
    const edu = student.education

    return (
        <div className="max-w-5xl space-y-8 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                    <Typography as="p" className="text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">
                        ID: {student.id?.slice(0, 8)}
                    </Typography>
                    <Typography as="h2" className="text-[28px] font-bold text-gray-900 tracking-tight">
                        {student.name ?? "—"}
                    </Typography>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Mail className="size-4" />
                            <span>{student.email ?? "—"}</span>
                        </div>
                        {s?.country && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="size-4" />
                                <span>{s.country}</span>
                            </div>
                        )}
                        {student.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="size-4" />
                                <span>{student.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
                <Link href={`/dashboard/student/${student.id}/edit`}>
                    <Button className="bg-[#9B51E0] hover:bg-[#8a42cf] text-white px-8 h-11 rounded-md shrink-0 shadow-md">
                        Edit Profile
                    </Button>
                </Link>
            </div>

            {/* Profile Card */}
            <div className="bg-white/50 backdrop-blur-xl border border-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-[20px] p-6 lg:p-8 space-y-8">

                {/* Avatar + Academic */}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="shrink-0">
                        <img
                            src={student.avatar_url ?? "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.name ?? "S")}
                            alt={student.name ?? "Student"}
                            className="size-32 rounded-[20px] object-cover shadow-sm border-4 border-white/60"
                        />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="size-5 text-[#9B51E0]" />
                            <Typography as="h3" className="text-lg font-bold text-gray-900">Academic Record</Typography>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <Typography as="p" className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">Qualification</Typography>
                                <Typography as="p" className="font-bold text-gray-900 text-sm mt-1">{edu?.qualification ?? "—"}</Typography>
                            </div>
                            <div>
                                <Typography as="p" className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">Institution</Typography>
                                <Typography as="p" className="font-bold text-gray-900 text-sm mt-1">{edu?.institution_name ?? "—"}</Typography>
                            </div>
                            <div>
                                <Typography as="p" className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">GPA</Typography>
                                <Typography as="p" className="font-bold text-gray-900 text-sm mt-1">{edu?.cumulative_gpa ?? "—"}</Typography>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                    <Typography as="h3" className="text-lg font-bold text-gray-900">Basic Info</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8">
                        {[
                            { label: "Email",          value: student.email },
                            { label: "Phone",          value: student.phone },
                            { label: "Gender",         value: student.gender },
                            { label: "Date of Birth",  value: student.date_of_birth },
                            { label: "Nationality",    value: s?.nationality },
                            { label: "Country",        value: s?.country },
                            { label: "City",           value: s?.city },
                            { label: "Address",        value: s?.address },
                            { label: "Guardian Email", value: s?.guardian_email },
                            { label: "Guardian Phone", value: s?.guardian_phone },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col gap-0.5">
                                <Typography as="span" className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase">{label}</Typography>
                                <Typography as="span" className="text-sm font-medium text-gray-800">{value ?? "—"}</Typography>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Passport */}
                {s?.passport_file_url && (
                    <div className="pt-2 border-t border-gray-100">
                        <Typography as="p" className="text-[9px] font-extrabold tracking-widest text-gray-400 uppercase mb-2">Passport / ID</Typography>
                        <a href={s.passport_file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                            View Document
                        </a>
                    </div>
                )}
            </div>

            {/* Applications */}
            <div className="space-y-4">
                <Typography as="h3" className="text-xl font-bold text-gray-900">Applications Applied For</Typography>
                <div className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200/50">
                                {["ID", "Program", "Status", "Submission Date", "Action"].map(h => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-gray-900 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No applications found.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submission Source */}
            <div className="bg-[#f5ebff]/80 backdrop-blur-xl border border-[#e9d5ff] rounded-[16px] p-5 w-full sm:w-[320px] flex flex-col gap-4 shadow-sm">
                <Typography as="p" className="text-[10px] font-extrabold tracking-widest text-[#9B51E0] uppercase">Submission Source</Typography>
                <div className="flex items-center gap-4">
                    <div className="size-12 bg-white rounded-xl shadow-sm border border-purple-100 flex items-center justify-center shrink-0">
                        <Building2 className="size-6 text-[#9B51E0]" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                        <Typography as="p" className="text-sm font-bold text-gray-900">Added by Agent</Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-0.5">ID: {s?.created_by_agent_id?.slice(0, 8) ?? "—"}</Typography>
                    </div>
                </div>
            </div>
        </div>
    )
}
