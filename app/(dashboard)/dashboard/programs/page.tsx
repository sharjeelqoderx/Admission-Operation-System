import { Typography } from "@/components/shared/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Clock, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProgramsPage() {
    const programs = [
        {
            level: "Masters",
            intake: "January Intake 2026",
            deadline: "365 Days",
            tuition: "€522.00",
            commission: "15%",
            title: "Digital Business & Innovation",
            subtitle: "Technology & Innovation",
            location: "Austria",
            duration: "6 months",
            language: "English"
        },
        {
            level: "Masters",
            intake: "January Intake 2026",
            deadline: "365 Days",
            tuition: "€522.00",
            commission: "15%",
            title: "Digital Business & Innovation",
            subtitle: "Technology & Innovation",
            location: "Austria",
            duration: "6 months",
            language: "English"
        },
        {
            level: "Masters",
            intake: "January Intake 2026",
            deadline: "365 Days",
            tuition: "€522.00",
            commission: "15%",
            title: "Digital Business & Innovation",
            subtitle: "Technology & Innovation",
            location: "Austria",
            duration: "6 months",
            language: "English"
        }
    ];

    return (
        <div className="space-y-8">

            {/* ── Header ── */}
            <div className="space-y-3">
                <Typography as="h1" className="text-[32px] font-extrabold text-gray-900 tracking-tight">
                    All Programs
                </Typography>
                <Typography as="p" className="text-[14px] font-medium text-gray-500 leading-relaxed">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s
                </Typography>
            </div>

            {/* ── Search Bar ── */}
            <div className="relative bg-white rounded-xl shadow-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                    placeholder="Search program"
                    className="border-0 bg-transparent h-14 pl-12 text-[15px] focus-visible:ring-0"
                />
            </div>

            {/* ── Programs List ── */}
            <div className="space-y-6">
                {programs.map((prog, i) => (
                    <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="flex-1 space-y-4">
                            {/* Meta top */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-800">
                                <span>{prog.level}</span>
                                <span className="text-[#a855f7]">•</span>
                                <span>{prog.intake}</span>
                                <span className="text-[#a855f7]">•</span>
                                <span>Deadline: {prog.deadline}</span>
                            </div>

                            {/* Titles */}
                            <div>
                                <Typography as="h2" className="text-[22px] font-extrabold text-gray-900">{prog.title}</Typography>
                                <Typography as="h3" className="text-[15px] font-bold text-gray-800 mt-1">{prog.subtitle}</Typography>
                            </div>

                            {/* Details Icons */}
                            <div className="flex flex-wrap items-center gap-6 text-[12px] font-bold text-gray-900">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="size-4 text-gray-600" />
                                    <span>{prog.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="size-4 text-gray-600" />
                                    <span>{prog.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Globe className="size-4 text-gray-600" />
                                    <span>{prog.language}</span>
                                </div>
                            </div>

                            {/* Action Buttons Left */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link href="/dashboard/programs/details">
                                    <Button className="bg-[#4285f4] hover:bg-[#3367d6] text-white h-9 px-6 text-[11px] font-bold rounded-lg shadow-sm">
                                        View Details
                                    </Button>
                                </Link>
                                <Button className="bg-[#a855f7] hover:bg-[#9333ea] text-white h-9 px-6 text-[11px] font-bold rounded-lg shadow-sm">
                                    View Requirements
                                </Button>
                            </div>
                        </div>

                        {/* Right side (Badges & Apply Button) */}
                        <div className="flex flex-col items-end justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#cce5ff] text-[#004085] px-4 py-1.5 rounded-md text-[10px] font-extrabold tracking-wide">
                                    Tuition Fees {prog.tuition}
                                </div>
                                <div className="bg-[#ccffcc] text-[#155724] px-4 py-1.5 rounded-md text-[10px] font-extrabold tracking-wide">
                                    {prog.commission} Commission
                                </div>
                            </div>

                            <Link href="/dashboard/application/new">
                                <Button className="w-full sm:w-auto bg-[#a855f7] hover:bg-[#9333ea] text-white h-12 px-10 text-[14px] font-bold rounded-xl shadow-lg shadow-purple-500/20">
                                    Apply Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer Navigation ── */}
            <div className="flex items-center justify-between pt-10">
                <Button variant="outline" className="h-12 px-8 border-gray-400 text-[#0a1e42] hover:bg-white/50 font-bold rounded-sm border-2">
                    <ArrowLeft className="size-4 mr-2" />
                    Previous
                </Button>
                <Link href="/dashboard/programs/details">
                    <Button className="h-12 px-8 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-bold rounded-xl shadow-lg flex items-center">
                        Next Step: Review & Submit
                        <ArrowRight className="size-4 ml-2" />
                    </Button>
                </Link>
            </div>

        </div>
    )
}
