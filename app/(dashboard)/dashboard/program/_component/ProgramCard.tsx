"use client"

import { memo, useCallback, useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Globe, BookOpen, Layers, Loader2, GraduationCap } from "lucide-react"
import Link from "next/link"
import { BluryCard } from "@/components/shared/blury-card"
import type { CourseProgram } from "@/types/schemas/program"
import {
    deriveProgramCategory,
    formatIntakeDate,
    formatProgramDate,
    formatStudyMode,
} from "@/lib/utils/program"
import { ProgramRequirementsModal } from "./ProgramRequirementsModal"

type ProgramCardProps = {
    course: CourseProgram
}

export const ProgramCard = memo(function ProgramCard({ course }: ProgramCardProps) {
    const [requirementsOpen, setRequirementsOpen] = useState(false)
    const degree = course.degree

    const handleOpenRequirements = useCallback(() => {
        setRequirementsOpen(true)
    }, [])

    const category = degree?.level?.name ?? deriveProgramCategory(degree?.name)
    const seats = "Unlimited"

    return (
        <>
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/10"
                className="hover:bg-brand-blue/5 transition-all group overflow-hidden"
                childClass="p-6 flex! flex-col md:flex-row gap-6 relative"
            >
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography font="small" className="text-gray-800 uppercase tracking-tight flex items-center gap-1">
                            <Layers size={12} className="text-brand-byzantine" />
                            {category}
                        </Typography>
                        <span className="text-[#a855f7]">•</span>
                        <Typography font="small" className="text-gray-800 uppercase tracking-tight flex items-center gap-1">
                            <BookOpen size={12} className="text-brand-byzantine" />
                            {`Intake: ${formatIntakeDate(degree?.intake_date)}`}
                        </Typography>
                        <span className="text-[#a855f7]">•</span>
                        <Typography font="small" className="text-gray-500 uppercase tracking-tight">
                            {`Deadline: ${formatProgramDate(course.deadline_date)}`}
                        </Typography>
                    </div>

                    <div>
                        <Typography as="h2" font="title" className="text-gray-900 transition-colors leading-tight">
                            {course.name}
                        </Typography>
                        <Typography as="h3" font="sub-text" className="text-gray-600 mt-1">
                            {degree?.name ?? "FHM University Program"}
                        </Typography>
                        <Typography font="small" className="text-gray-500 mt-1">
                            FHM University
                        </Typography>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                            <MapPin className="size-4" />
                            <Typography font="small" className="text-gray-900">
                                {degree?.location ?? "N/A"}
                            </Typography>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                            <Clock className="size-4" />
                            <Typography font="small" className="text-gray-900">
                                {degree?.duration ?? formatStudyMode(degree?.study_mode)}
                            </Typography>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                            <Globe className="size-4" />
                            <Typography font="small" className="text-gray-900">
                                {degree?.language_of_study ?? "N/A"}
                            </Typography>
                        </div>
                        {degree?.credits != null && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                                <GraduationCap className="size-4" />
                                <Typography font="small" className="text-gray-900">
                                    {`${degree.credits} ECTS`}
                                </Typography>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link href={`/dashboard/program/${course.id}`}>
                            <Button className="bg-brand-blue hover:bg-brand-blue/80 text-white h-9 px-6 text-[11px] font-bold transition-all">
                                View Details
                            </Button>
                        </Link>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenRequirements}
                            className="bg-white/40 hover:bg-white text-gray-700 border-white/60 h-9 px-6 text-[11px] font-bold rounded-lg shadow-sm transition-all"
                        >
                            View Requirements
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-6 min-w-[200px]">
                    <div className="flex flex-col items-end gap-3 w-full">
                        <div className="bg-[#e8f0fe] text-[#1967d2] px-4 py-2 rounded-xl border border-[#1967d2]/10 w-full text-center">
                            <Typography font="small" className="font-extrabold uppercase tracking-wide">
                                {`Tuition Fees: ${degree?.fees ?? "Contact University"}`}
                            </Typography>
                        </div>
                        <div className="bg-[#e6f4ea] text-[#1e8e3e] px-4 py-2 rounded-xl border border-[#1e8e3e]/10 w-full text-center">
                            <Typography font="small" className="font-extrabold uppercase tracking-wide">
                                {`Available Seats: ${seats}`}
                            </Typography>
                        </div>
                        {degree?.study_mode && (
                            <div className="bg-[#f3e8ff] text-[#7e22ce] px-4 py-2 rounded-xl border border-[#7e22ce]/10 w-full text-center">
                                <Typography font="small" className="font-extrabold uppercase tracking-wide">
                                    {formatStudyMode(degree.study_mode)}
                                </Typography>
                            </div>
                        )}
                    </div>

                    <Link href={`/dashboard/application/new?course_id=${course.id}`} className="w-full">
                        <Button className="w-full hover:bg-brand-byzantine/80 text-white h-12 px-10 text-[14px] font-bold transition-all active:scale-95">
                            Apply Now
                        </Button>
                    </Link>
                </div>
            </BluryCard>

            <ProgramRequirementsModal
                open={requirementsOpen}
                onOpenChange={setRequirementsOpen}
                course={course}
            />
        </>
    )
})

export function ProgramSkeleton() {
    return (
        <div className="h-48 w-full bg-white/20 backdrop-blur-md rounded-[20px] animate-pulse border border-white/40" />
    )
}

export function InfiniteLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="size-8 text-brand-byzantine animate-spin" />
            <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                Loading more programs...
            </Typography>
        </div>
    )
}
