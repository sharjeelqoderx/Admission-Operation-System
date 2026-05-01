"use client"

import { useStudents } from "@/hooks/useStudents"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Mail, MapPin, Building2, Phone, Calendar, Globe, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

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
        <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6 lg:px-12">
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 ">
                <div className="space-y-1 ">
                    <Typography as="h2" className="text-[36px] font-extrabold text-gray-900 tracking-tight">
                        {student.name ?? "—"}
                    </Typography>
                    <div className="flex items-center gap-6 text-[14px] font-medium text-gray-500 pt-1">
                        <div className="flex items-center gap-2">
                            <Mail className="size-4 opacity-60" />
                            <span>{student.email ?? "—"}</span>
                        </div>
                        {s?.country && (
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 opacity-60" />
                                <span>{s.city ? `${s.city}, ${s.country}` : s.country}</span>
                            </div>
                        )}
                    </div>
                </div>
                <Link href={`/dashboard/student/edit?id=${id}`}>
                    <Button className="bg-[#9B51E0] hover:bg-[#8a42cf] text-white px-10 h-12 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all">
                        Edit Profile
                    </Button>
                </Link>
            </div>

            {/* ── Main Info Container (Glass wrapper) ── */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[32px] p-10 space-y-12">
                {/* Academic Record Section */}
                <div className="flex flex-col md:flex-row gap-12 relative overflow-hidden">
                    <div className="shrink-0 relative group">
                        <img
                            src={student.avatar_url ?? "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.name ?? "S")}
                            alt={student.name ?? "Student"}
                            className="size-40 rounded-[28px] object-cover border-4 border-white/40 shadow-xl"
                        />
                    </div>
                    
                    <div className="flex-1 space-y-8 max-w-2xl">
                        <Typography as="h3" className="text-2xl font-bold text-gray-900">Academic Record</Typography>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-1">
                                <Typography as="p" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Highest Degree</Typography>
                                <Typography as="p" className="text-[16px] font-bold text-gray-900 leading-tight">{edu?.qualification ?? "BSc Economics & Finance"}</Typography>
                                <Typography as="p" className="text-[12px] font-medium text-gray-500">{edu?.institution_name ?? "University of Athens"}</Typography>
                            </div>
                            
                            <div className="space-y-1">
                                <Typography as="p" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Final GPA</Typography>
                                <Typography as="p" className="text-[16px] font-bold text-gray-900">{edu?.cumulative_gpa ?? "3.8 / 4.0"}</Typography>
                                <Typography as="p" className="text-[12px] font-medium text-gray-500">Honors Graduate</Typography>
                            </div>

                            <div className="space-y-1">
                                <Typography as="p" className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Program Selection</Typography>
                                <Typography as="p" className="text-[16px] font-bold text-[#4285f4] leading-tight">MSc Global Business Management</Typography>
                                <Typography as="p" className="text-[12px] font-medium text-gray-500">2024 Intake (Fall)</Typography>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Basic Info Section */}
                <div className="space-y-8">
                    <Typography as="h3" className="text-2xl font-bold text-gray-900">Basic Info</Typography>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                        {[
                            { label: "Email",          value: student.email,          placeholder: "mike@gmail.com" },
                            { label: "Gender",         value: student.gender,         placeholder: "Male" },
                            { label: "Nationality",    value: s?.nationality,         placeholder: "Spain" },
                            { label: "Date of Birth",  value: student.date_of_birth,  placeholder: "10/12/1995" },
                            { label: "Guardian Email", value: s?.guardian_email,      placeholder: "guardian@gmail.com" },
                            { label: "Institution Name", value: edu?.institution_name,  placeholder: "guardian@gmail.com" },
                            { label: "Phone",          value: student.phone,          placeholder: "+123-458-7890" },
                            { label: "Guardian Phone", value: s?.guardian_phone,      placeholder: "+123-458-7890" },
                        ].map(({ label, value, placeholder }) => (
                            <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-200/40 pb-2">
                                <Typography as="span" className="text-[14px] font-bold text-gray-900 shrink-0">{label}:</Typography>
                                <Typography as="span" className="text-[14px] font-medium text-gray-600 text-right">{value || placeholder}</Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Applications Applied For (Glass Table) ── */}
            <div className="space-y-8">
                <Typography as="h3" className="text-2xl font-bold text-gray-900">Applications Applied For</Typography>
                
                <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[32px] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                {["ID", "Program", "Status", "Submission Date", "Action"].map(h => (
                                    <th key={h} className="px-10 py-6 text-[11px] font-bold tracking-[0.2em] text-gray-900 uppercase opacity-60">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {[
                                { id: "SH-2024-8902", program: "MSc Global Business Management", intake: "Fall 2024 Intake", status: "CREATED", date: "Oct 12, 2023", color: "bg-blue-500" },
                                { id: "SH-2024-1234", program: "BA International Relations", intake: "Spring 2024 Intake", status: "CONTRACTSENT", date: "Oct 10, 2023", color: "bg-red-500" },
                                { id: "SH-2024-5678", program: "PhD Artificial Intelligence", intake: "Fall 2024 Intake", status: "SIGNED", date: "Oct 08, 2023", color: "bg-green-500" },
                            ].map((app, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-10 py-8 text-[13px] font-bold text-gray-500">{app.id}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-bold text-gray-900">{app.program}</span>
                                            <span className="text-[12px] font-medium text-gray-500">{app.intake}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={cn(
                                            "inline-flex items-center px-6 py-1.5 rounded-full text-[10px] font-extrabold text-white tracking-widest",
                                            app.color
                                        )}>
                                            {app.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-[14px] font-bold text-gray-700">{app.date}</td>
                                    <td className="px-10 py-8">
                                        <Button variant="outline" className="h-9 px-6 bg-white/10 border-white/20 text-gray-900 hover:bg-white/20 rounded-lg font-bold text-[12px]">
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
