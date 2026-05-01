import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { GraduationCap, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ApplicationsPage() {
    const applications = [
        {
            studentName: "Alexandros Pappas",
            studentId: "SH-2024-8902",
            program: "MSc Global Business Management",
            intake: "Fall 2024 Intake",
            agentName: "Horizon Global Education",
            status: "CREATED",
            statusColor: "bg-blue-500",
            date: "Oct 12, 2023",
            avatar: "https://ui-avatars.com/api/?name=Alexandros+Pappas&background=random"
        },
        {
            studentName: "Elena Rodriguez",
            studentId: "SH-2024-9114",
            program: "BA International Relations",
            intake: "Spring 2024 Intake",
            agentName: "Iberian Scholars Ltd",
            status: "CONTRACT SENT",
            statusColor: "bg-[#eb4335]",
            date: "Oct 10, 2023",
            avatar: "https://ui-avatars.com/api/?name=Elena+Rodriguez&background=random"
        },
        {
            studentName: "Wei Chen",
            studentId: "SH-2024-4421",
            program: "PhD Artificial Intelligence",
            intake: "Fall 2024 Intake",
            agentName: "Pacific Rim Admissions",
            status: "SIGNED",
            statusColor: "bg-[#34a853]",
            date: "Oct 09, 2023",
            avatar: "https://ui-avatars.com/api/?name=Wei+Chen&background=random"
        },
        {
            studentName: "Sarah O'Connor",
            studentId: "SH-2024-7732",
            program: "LLM Corporate Law",
            intake: "Fall 2024 Intake",
            agentName: "Direct Application",
            status: "COMPLETED",
            statusColor: "bg-[#1e3a8a]",
            date: "Oct 05, 2023",
            avatar: "https://ui-avatars.com/api/?name=Sarah+OConnor&background=random"
        },
        {
            studentName: "Zahra Al-Farsi",
            studentId: "SH-2024-1298",
            program: "BEng Civil Engineering",
            intake: "Fall 2024 Intake",
            agentName: "MENA Education Partners",
            status: "CREATED",
            statusColor: "bg-blue-500",
            date: "Oct 02, 2023",
            avatar: "https://ui-avatars.com/api/?name=Zahra+Al-Farsi&background=random"
        }
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 px-6 lg:px-12 pt-4">
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                    <Typography as="h1" className="text-[32px] font-extrabold text-gray-900 tracking-tight">
                        All Applications
                    </Typography>
                    <Typography as="p" className="text-[14px] font-medium text-gray-500 leading-relaxed">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
                    </Typography>
                </div>
                <Link href="/dashboard/applications/new">
                    <Button className="bg-[#9B51E0] hover:bg-[#8a42cf] text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
                        + New Application
                    </Button>
                </Link>
            </div>

            <div className="h-px bg-gray-200/60 w-full" />

            {/* ── Stats ── */}
            <div className="flex flex-col sm:flex-row gap-12 py-2">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-sm">
                        <GraduationCap className="size-6 text-gray-700" />
                    </div>
                    <div>
                        <Typography as="p" className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Total Students</Typography>
                        <Typography as="p" className="text-[28px] font-extrabold text-gray-900 leading-none">1,284</Typography>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-sm">
                        <FileText className="size-6 text-gray-700" />
                    </div>
                    <div>
                        <Typography as="p" className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Active Applications</Typography>
                        <Typography as="p" className="text-[28px] font-extrabold text-gray-900 leading-none">422</Typography>
                    </div>
                </div>
            </div>

            {/* ── Applications Table (Glassmorphism) ── */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-white/20 bg-white/10">
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Student Name</th>
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Program</th>
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Agent Name</th>
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Status</th>
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase leading-tight">Submission<br/>Date</th>
                                <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {applications.map((app, i) => (
                                <tr key={i} className="hover:bg-white/10 transition-colors group">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <img src={app.avatar} alt={app.studentName} className="size-10 rounded-xl object-cover border-2 border-white/50 shadow-sm" />
                                            <div className="flex flex-col">
                                                <Typography as="span" className="text-[14px] font-bold text-[#1e3a8a]">{app.studentName}</Typography>
                                                <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">ID: {app.studentId}</Typography>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Typography as="span" className="text-[13px] font-bold text-gray-900 leading-snug">{app.program}</Typography>
                                            <Typography as="span" className="text-[11px] font-medium text-gray-500 mt-0.5">{app.intake}</Typography>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <Typography as="span" className="text-[13px] font-medium text-gray-600">{app.agentName}</Typography>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className={cn(
                                            "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-extrabold text-white tracking-widest min-w-[100px]",
                                            app.statusColor
                                        )}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <Typography as="span" className="text-[13px] font-medium text-gray-600">{app.date}</Typography>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <Button variant="outline" className="h-9 px-6 bg-white/20 border-white/40 text-[#1e3a8a] hover:bg-white/40 hover:text-[#1e3a8a] rounded-lg font-bold text-[12px] transition-all shadow-sm">
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                    <div className="flex items-center text-[12px] font-medium text-gray-500 space-x-1">
                        <span>Showing</span>
                        <span className="font-bold text-[#1e3a8a]">5</span>
                        <span>of</span>
                        <span className="font-bold text-[#1e3a8a]">1,284</span>
                        <span>entries</span>
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
            </div>
            
        </div>
    )
}
