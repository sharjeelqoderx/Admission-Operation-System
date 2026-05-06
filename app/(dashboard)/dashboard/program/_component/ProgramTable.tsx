"use client"

import { useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Globe, ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react"
import Link from "next/link"

type ProgramRow = {
    id: string
    program_id: string
    name: string
    category: string
    status: string
    tuition_fee: number
    currency: string
    seats: number
    study_type: string
    intake_date: string
    deadline: string
    campus_name: string
    location: string
    university_name: string
    university_logo: string | null
}

type Props = {
    rows: ProgramRow[]
    isLoading: boolean
    isError: boolean
    onRetry: () => void
}

export function ProgramTable({ rows, isLoading, isError, onRetry }: Props) {
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 5

    if (isLoading) {
        return (
            <div className="space-y-6 pt-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 w-full bg-white/20 backdrop-blur-md rounded-[20px] animate-pulse border border-white/40" />
                ))}
            </div>
        )
    }

    // Pagination Logic
    const totalEntries = rows.length
    const totalPages = Math.ceil(totalEntries / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalEntries)
    const currentRows = rows.slice(startIndex, endIndex)

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return (
        <div className="space-y-8 pt-4">
            <div className="space-y-6">
                {currentRows.map((program) => (
                    <div key={program.id} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="flex-1 space-y-4">
                            {/* Meta top */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-800 uppercase tracking-tight">
                                <span className="flex items-center gap-1">
                                    <Layers size={12} className="text-brand-byzantine" />
                                    {program.category || "General"}
                                </span>
                                <span className="text-[#a855f7]">•</span>
                                <span className="flex items-center gap-1">
                                    <BookOpen size={12} className="text-brand-byzantine" />
                                    {program.intake_date ? `Intake: ${new Date(program.intake_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : "N/A"}
                                </span>
                                <span className="text-[#a855f7]">•</span>
                                <span className="text-gray-500">Deadline: {program.deadline ? new Date(program.deadline).toLocaleDateString() : "Rolling"}</span>
                            </div>

                            {/* Titles */}
                            <div>
                                <Typography as="h2" className="text-[22px] font-extrabold text-gray-900 group-hover:text-brand-byzantine transition-colors leading-tight">
                                    {program.name}
                                </Typography>
                                <Typography as="h3" className="text-[14px] font-bold text-gray-600 mt-1 flex items-center gap-2">
                                    <span className="text-brand-byzantine/80">{program.university_name}</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{program.campus_name}</span>
                                </Typography>
                            </div>

                            {/* Details Icons */}
                            <div className="flex flex-wrap items-center gap-6 text-[12px] font-bold text-gray-900">
                                <div className="flex items-center gap-1.5 bg-white/40 px-3 py-1.5 rounded-lg border border-white/20">
                                    <MapPin className="size-4 text-brand-byzantine" />
                                    <span>{program.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/40 px-3 py-1.5 rounded-lg border border-white/20">
                                    <Clock className="size-4 text-brand-byzantine" />
                                    <span>{program.study_type?.replace('_', ' ') || "Full Time"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/40 px-3 py-1.5 rounded-lg border border-white/20">
                                    <Globe className="size-4 text-brand-byzantine" />
                                    <span>English</span>
                                </div>
                            </div>

                            {/* Action Buttons Left */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link href={`/dashboard/program/${program.program_id}`}>
                                    <Button className="bg-[#4285f4] hover:bg-[#3367d6] text-white h-9 px-6 text-[11px] font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02]">
                                        View Details
                                    </Button>
                                </Link>
                                <Button variant="outline" className="bg-white/40 hover:bg-white text-gray-700 border-white/60 h-9 px-6 text-[11px] font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02]">
                                    View Requirements
                                </Button>
                            </div>
                        </div>

                        {/* Right side (Badges & Apply Button) */}
                        <div className="flex flex-col items-end justify-between gap-6 min-w-[200px]">
                            <div className="flex flex-col items-end gap-3 w-full">
                                <div className="bg-[#e8f0fe] text-[#1967d2] px-4 py-2 rounded-xl text-[10px] font-extrabold tracking-wide border border-[#1967d2]/10 w-full text-center">
                                    Tuition Fees: {program.currency} {program.tuition_fee?.toLocaleString()}
                                </div>
                                <div className="bg-[#e6f4ea] text-[#1e8e3e] px-4 py-2 rounded-xl text-[10px] font-extrabold tracking-wide border border-[#1e8e3e]/10 w-full text-center">
                                    Available Seats: {program.seats || "Unlimited"}
                                </div>
                            </div>

                            <Button className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white h-12 px-10 text-[14px] font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95">
                                Apply Now
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Footer Navigation ── */}
            <div className="flex items-center justify-between pt-10 px-2">
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="h-11 px-8 border-gray-200 text-[#0a1e42] hover:bg-white/50 font-bold rounded-lg border-2 disabled:opacity-30 transition-all"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Previous
                </Button>

                <div className="text-[12px] font-bold text-gray-400">
                    Page <span className="text-brand-byzantine">{currentPage}</span> of {totalPages || 1}
                </div>

                <Button
                    onClick={handleNext}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-11 px-8 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-bold rounded-xl shadow-lg flex items-center transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                >
                    Next
                    <ArrowRight className="size-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
