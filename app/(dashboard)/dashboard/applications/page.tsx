import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { GraduationCap, FileText } from "lucide-react";
import Link from "next/link";
import { ApplicationTable } from "../_component/ApplicationTable";
import { ApplicationStatus } from "@/components/shared/StatusBadge";

export default function ApplicationsPage() {
    const applications = [
        { name: "Alexandros Pappas", program: "MSc Global Business Management", status: ApplicationStatus.CREATED, date: "Oct 12, 2023" },
        { name: "Elena Rodriguez", program: "BA International Relations", status: ApplicationStatus.CONTRACT_SENT, date: "Oct 10, 2023" },
        { name: "Wei Chen", program: "PhD Artificial Intelligence", status: ApplicationStatus.SIGNED, date: "Oct 09, 2023" },
        { name: "Sarah O'Connor", program: "LLM Corporate Law", status: ApplicationStatus.COMPLETED, date: "Oct 05, 2023" },
        { name: "Zahra Al-Farsi", program: "BEng Civil Engineering", status: ApplicationStatus.CREATED, date: "Oct 02, 2023" },
    ]

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 px-6 lg:px-12 pt-4">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                    <Typography as="h1" className="text-[32px] font-extrabold text-gray-900 tracking-tight">All Applications</Typography>
                    <Typography as="p" className="text-[14px] font-medium text-gray-500 leading-relaxed">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry.
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

            <ApplicationTable applications={applications} />
        </div>
    )
}
