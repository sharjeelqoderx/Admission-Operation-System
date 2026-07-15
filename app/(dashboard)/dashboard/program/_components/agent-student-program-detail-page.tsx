"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { PageLoader } from "@/components/shared/page-loader"
import { BluryCard } from "@/components/shared/blury-card"
import type { CourseProgram } from "@/types/schemas/program"
import {
    deriveProgramCategory,
    formatIntakeDate,
    formatProgramDate,
    formatStudyMode,
} from "@/lib/utils/program"

async function fetchCourseDetail(courseId: string): Promise<CourseProgram> {
    const res = await fetch(`/api/program/${courseId}`)
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "Failed to fetch program")
    return json.data as CourseProgram
}

function buildOverviewText(course: CourseProgram): string {
    const degree = course.degree
    if (!degree) {
        return `The programme in ${course.name} at FHM University combines academic excellence with practical learning. It equips you to develop the skills and knowledge needed for your chosen career path.`
    }

    const level = degree.level?.name ?? deriveProgramCategory(degree.name)
    return `The ${level} programme in ${course.name} at FHM University is delivered in ${degree.language_of_study ?? "English"} at ${degree.location ?? "our campus"}. Over ${degree.duration ?? "the programme duration"}, you will build expertise connected to ${degree.name}, with ${degree.credits != null ? `${degree.credits} ECTS credits` : "a structured academic curriculum"} and support from experienced faculty.`
}

function buildAdmissionSummary(course: CourseProgram): string {
    const degree = course.degree
    const level = degree?.level?.name ?? "programme"

    if (!degree) {
        return `The formal entry requirement for this programme is a relevant academic qualification. Please review the required documents below before submitting your application.`
    }

    return `The formal entry requirement for this ${level.toLowerCase()} programme is a relevant qualification aligned with ${degree.name}${degree.credits != null ? `, typically involving ${degree.credits} ECTS credits where applicable` : ""}. Applications must be submitted before ${formatProgramDate(course.deadline_date)}.`
}

function buildPerspectivesText(course: CourseProgram): string {
    const degree = course.degree
    const level = degree?.level?.name ?? "programme"

    return `In this ${level} programme, you will develop subject knowledge and professional skills through ${course.name}. You will learn in ${degree?.language_of_study ?? "English"} at ${degree?.location ?? "FHM University"}, with a study format designed for ${formatStudyMode(degree?.study_mode).toLowerCase()} learners.`
}

function buildPerspectivesSubtext(course: CourseProgram): string {
    return `The programme combines academic learning with practical orientation at FHM University, strengthening communication, analytical thinking and intercultural skills — ideal for building a strong foundation in ${course.degree?.name ?? "your chosen field"}.`
}

function buildProspectsText(course: CourseProgram): string {
    return `As a graduate of ${course.name}, you will be prepared for professional roles connected to ${course.degree?.name ?? "your field of study"}, with qualifications from FHM University recognised in ${course.degree?.location ?? "Germany"}.`
}

function buildCareerPaths(course: CourseProgram): string[] {
    const level = course.degree?.level?.name?.toLowerCase() ?? ""
    const name = course.name

    if (level.includes("mba")) {
        return [
            "Business development and technology management roles",
            "Project and product management in international companies",
            "Consulting and strategic advisory positions",
            "Leadership roles in automotive, energy, or data-driven sectors",
            "Entrepreneurship and SME management opportunities",
        ]
    }

    if (level.includes("master")) {
        return [
            `Specialist and management roles related to ${name}`,
            "Research, analysis, and strategy positions in international organisations",
            "Consulting and project leadership across industry sectors",
            "Cross-functional roles in digital transformation and innovation",
            "Further academic progression and doctoral study pathways",
        ]
    }

    if (level.includes("foundation") || level.includes("studienkolleg")) {
        return [
            "Pathway progression to bachelor programmes in Germany",
            "Preparation for university-level technical and business studies",
            "Language and academic readiness for German higher education",
            "Foundation for engineering, business, and applied sciences degrees",
            "Structured transition into full degree programmes at FHM University",
        ]
    }

    return [
        `Professional roles aligned with ${name}`,
        "Industry positions in business, technology, and applied sciences",
        "Further specialisation through postgraduate study",
        "Management trainee and graduate entry programmes",
        "International career opportunities across European markets",
    ]
}

export function AgentStudentProgramDetailPage() {
    const params = useParams()
    const courseId = params?.["program-id"] as string

    const { data: course, isLoading, isError } = useQuery({
        queryKey: ["program", courseId],
        queryFn: () => fetchCourseDetail(courseId),
        enabled: Boolean(courseId),
    })

    const degree = course?.degree
    const requirements = useMemo(
        () => degree?.requirements?.filter((item) => item.document_type) ?? [],
        [degree?.requirements]
    )

    const levelLabel = degree?.level?.name ?? deriveProgramCategory(degree?.name)
    const programLevelShort = degree?.level?.name?.split(" ")?.[0] ?? levelLabel.split(" ")?.[0] ?? "Programme"

    const competencyItems = useMemo(
        () => [
            { label: "Academic Level", value: levelLabel },
            { label: "Language of Study", value: degree?.language_of_study ?? "English" },
            { label: "Study Mode", value: formatStudyMode(degree?.study_mode) },
            { label: "Application Deadline", value: formatProgramDate(course?.deadline_date) },
        ],
        [course?.deadline_date, degree?.language_of_study, degree?.study_mode, levelLabel]
    )

    if (isLoading) return <PageLoader />

    if (isError || !course) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <AlertCircle className="size-12 text-red-400" />
                <Typography className="font-bold text-gray-700">Failed to load program details</Typography>
                <Link href="/dashboard/program">
                    <Button variant="outline">Back to Catalog</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <div className="space-y-2">
                <Typography as="h1" font="heading" className="text-[#0a1e42] tracking-tight leading-tight">
                    {course.name}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">
                        {levelLabel}
                    </Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">
                        {programLevelShort}
                    </Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">
                        {`${formatStudyMode(degree?.study_mode)} Study`}
                    </Typography>
                </div>
            </div>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="p-8 flex! flex-wrap gap-8"
            >
                <div className="flex-1 flex justify-start items-end flex-col space-y-6">
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed font-medium">
                        {buildOverviewText(course)}
                    </Typography>

                    <div>
                        <Link href={`/dashboard/application/new?course_id=${course.id}`}>
                            <Button className="bg-brand-secondary hover:bg-brand-secondary/90 text-white h-12 px-12 text-[14px] font-bold rounded-xl shadow-lg">
                                Apply now
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative w-full md:w-72 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md bg-gray-100">
                    <Image
                        src="/assets/optimized/german-uni.webp"
                        alt="Program"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 288px"
                    />
                </div>
            </BluryCard>

            <div className="space-y-4">
                <Typography as="h2" font="title" className="text-gray-900">
                    Admission Requirements
                </Typography>

                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-xl"
                    blendColorClass="bg-white/20"
                    childClass="p-8 space-y-4"
                >
                    <Typography as="h3" font="sub-text" className="font-bold text-gray-900">
                        {`Admission requirements ${course.name}*`}
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                        {buildAdmissionSummary(course)}
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed mt-4">
                        The following documents are required for your application:
                    </Typography>
                    <ul className="space-y-1 pl-4 list-none">
                        {requirements.length === 0 ? (
                            <li>
                                <Typography font="sub-text" className="text-gray-700">
                                    Document requirements will be published soon.
                                </Typography>
                            </li>
                        ) : (
                            requirements.map((requirement) => (
                                <li key={requirement.id}>
                                    <Typography font="sub-text" className="text-gray-700">
                                        {requirement.document_type?.name}
                                    </Typography>
                                </li>
                            ))
                        )}
                    </ul>
                </BluryCard>
            </div>

            <div className="space-y-4">
                <Typography as="h2" font="title" className="text-gray-900">
                    Perspectives
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Typography as="h3" font="sub-text" className="font-bold text-gray-900">
                            What to expect during your studies
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                            {buildPerspectivesText(course)}
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                            {buildPerspectivesSubtext(course)}
                        </Typography>
                    </div>

                    <div className="space-y-3">
                        {competencyItems.map((item) => (
                            <div
                                key={item.label}
                                className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/80 transition-colors shadow-sm"
                            >
                                <div className="space-y-1">
                                    <Typography as="span" font="sub-text" className="font-bold text-gray-900">
                                        {item.label}
                                    </Typography>
                                    {item.value && (
                                        <Typography font="small" className="text-gray-500 line-clamp-1">
                                            {item.value}
                                        </Typography>
                                    )}
                                </div>
                                <Plus className="size-5 text-gray-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="p-8 flex! flex-col md:flex-row gap-8"
            >
                <div className="flex-1 space-y-4">
                    <Typography as="h3" font="sub-text" className="font-bold text-gray-900">
                        Your prospects after graduation
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                        {buildProspectsText(course)}
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 mt-2">
                        Typical career paths and fields of activity include:
                    </Typography>
                    <ul className="space-y-1.5 pl-5 list-disc marker:text-gray-400">
                        {buildCareerPaths(course).map((path) => (
                            <li key={path}>
                                <Typography font="small" className="text-gray-700">
                                    {path}
                                </Typography>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative w-full md:w-64 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                    <Image
                        src="/assets/optimized/cheerful-team.webp"
                        alt="Career Path"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                    />
                </div>
            </BluryCard>

            <div className="space-y-4 pt-4">
                <Typography as="h3" font="title" className="text-gray-900">
                    {`${course.name} ${formatStudyMode(degree?.study_mode)} Study`}
                </Typography>
                <Typography as="h4" font="sub-text" className="font-bold text-gray-900">
                    All The Facts About Your Studies
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <FactBadge
                        label={`Creditpoints: ${degree?.credits != null ? `${degree.credits} ECTS` : "N/A"}`}
                    />
                    <FactBadge label={`Duration: ${degree?.duration ?? "N/A"}`} />
                    <FactBadge label={`Start of studies: ${formatIntakeDate(degree?.intake_date)}`} />
                </div>
            </div>
        </div>
    )
}

function FactBadge({ label }: { label: string }) {
    return (
        <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
            <Typography font="sub-text" className="font-bold text-gray-900">
                {label}
            </Typography>
        </div>
    )
}
