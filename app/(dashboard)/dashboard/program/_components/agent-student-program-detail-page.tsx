"use client"

import { memo, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { BluryCard } from "@/components/shared/blury-card"
import { useAuth } from "@/hooks/useAuth"
import { Role } from "@/types/enums/role"
import type { CourseProgram } from "@/types/schemas/program"
import {
    deriveProgramCategory,
    formatIntakeDate,
    formatProgramDate,
    formatProgramDuration,
    formatStudyMode,
    formatTuitionFees,
} from "@/lib/utils/program"

type AgentStudentProgramDetailPageProps = {
    courseId: string
    initialCourse: CourseProgram
}

type DocumentListItem = {
    id: string
    name: string
    requirementType?: string | null
}

async function fetchCourseDetail(courseId: string): Promise<CourseProgram> {
    const res = await fetch(`/api/program/${courseId}`)
    const json = await res.json()
    if (!res.ok) {
        const details =
            typeof json.details === "string"
                ? json.details
                : json.details?.fieldErrors?.id?.[0]
        throw new Error(
            [json.error ?? "Failed to fetch program", details].filter(Boolean).join(": ")
        )
    }
    return json.data as CourseProgram
}

function buildOverviewFallback(course: CourseProgram): string {
    const degree = course.degree
    if (!degree) {
        return `The programme in ${course.name} at FHM University combines academic excellence with practical learning. It equips you to develop the skills and knowledge needed for your chosen career path.`
    }

    const level = degree.level?.name ?? deriveProgramCategory(degree.name)
    return `The ${level} programme in ${course.name} at FHM University is delivered in ${degree.language_of_study ?? "English"} at ${degree.location ?? "our campus"}. Over ${formatProgramDuration(degree.duration)}, you will build expertise connected to ${degree.name}, with ${degree.credits != null ? `${degree.credits} ECTS credits` : "a structured academic curriculum"} and support from experienced faculty.`
}

function buildAdmissionFallback(course: CourseProgram): string {
    const degree = course.degree
    const level = degree?.level?.name ?? "programme"

    if (!degree) {
        return "The formal entry requirement for this programme is a relevant academic qualification. Please review the required documents below before submitting your application."
    }

    return `The formal entry requirement for this ${level.toLowerCase()} programme is a relevant qualification aligned with ${degree.name}${degree.credits != null ? `, typically involving ${degree.credits} ECTS credits where applicable` : ""}. Applications must be submitted before ${formatProgramDate(course.deadline_date)}.`
}

function buildPerspectivesFallback(course: CourseProgram): string {
    const degree = course.degree
    const level = degree?.level?.name ?? "programme"

    return `In this ${level} programme, you will develop subject knowledge and professional skills through ${course.name}. You will learn in ${degree?.language_of_study ?? "English"} at ${degree?.location ?? "FHM University"}, with a study format designed for ${formatStudyMode(degree?.study_mode).toLowerCase()} learners.`
}

function buildProspectsFallback(course: CourseProgram): string {
    return `As a graduate of ${course.name}, you will be prepared for professional roles connected to ${course.degree?.name ?? "your field of study"}, with qualifications from FHM University recognised in ${course.degree?.location ?? "Germany"}.`
}

function resolveDocumentItems(course: CourseProgram): DocumentListItem[] {
    if (course.document_requirements?.length) {
        return course.document_requirements.map((item) => ({
            id: item.id,
            name: item.name ?? "Document",
            requirementType: "REQUIRED",
        }))
    }

    return (course.degree?.requirements ?? [])
        .filter((item) => item.document_type)
        .map((item) => ({
            id: item.id,
            name: item.document_type?.name ?? "Document",
            requirementType: item.requirement_type,
        }))
}

function resolveIntakeLabel(course: CourseProgram): string {
    const degree = course.degree
    if (degree?.intake_starts_on) {
        return formatProgramDate(degree.intake_starts_on)
    }

    return formatIntakeDate(degree?.intake_date)
}

function DetailTextSection({
    title,
    content,
}: {
    title: string
    content: string
}) {
    return (
        <div className="space-y-3">
            <Typography as="h3" font="sub-text" className="font-bold text-gray-900">
                {title}
            </Typography>
            <Typography as="p" font="sub-text" className="whitespace-pre-wrap leading-relaxed text-gray-700">
                {content}
            </Typography>
        </div>
    )
}

const InfoBadge = memo(function InfoBadge({ label }: { label: string }) {
    return (
        <Typography
            as="span"
            font="small"
            className="rounded-xl border border-white/60 bg-white/60 px-3 py-2 font-semibold text-gray-800 shadow-sm"
        >
            {label}
        </Typography>
    )
})

const FactBadge = memo(function FactBadge({ label }: { label: string }) {
    return (
        <div className="rounded-xl border border-gray-200/50 bg-[#1e1e2d]/10 px-6 py-4 text-center backdrop-blur-md">
            <Typography font="sub-text" className="font-bold text-gray-900">
                {label}
            </Typography>
        </div>
    )
})

export function AgentStudentProgramDetailPage({
    courseId,
    initialCourse,
}: AgentStudentProgramDetailPageProps) {
    const { me } = useAuth()
    const userRole = me.data?.role

    const { data: course, isLoading, isError, error } = useQuery({
        queryKey: ["program", courseId],
        queryFn: () => fetchCourseDetail(courseId),
        initialData: initialCourse,
        enabled: Boolean(courseId),
    })

    const degree = course?.degree
    const program = course?.program

    const display = useMemo(() => {
        if (!course) {
            return null
        }

        const category = program?.category ?? deriveProgramCategory(degree?.name)
        const levelLabel = degree?.level?.name ?? category

        return {
            category,
            levelLabel,
            degreeName: degree?.name ?? null,
            tuitionFees: formatTuitionFees(degree?.fees),
            location: program?.location ?? degree?.location ?? "N/A",
            duration: formatProgramDuration(program?.program_length ?? degree?.duration),
            studyMode: formatStudyMode(degree?.study_mode),
            intakeLabel: resolveIntakeLabel(course),
            deadlineLabel: formatProgramDate(course.deadline_date),
            language: degree?.language_of_study ?? "English",
            creditsLabel: degree?.credits != null ? `${degree.credits} ECTS` : "N/A",
            agentCommission:
                userRole === Role.AGENT && degree?.agent_commission != null
                    ? `${degree.agent_commission}% Commission`
                    : null,
            overview: program?.program_detail?.trim() || buildOverviewFallback(course),
            admission: program?.admission_requirements?.trim() || buildAdmissionFallback(course),
            perspectives: program?.perspectives?.trim() || buildPerspectivesFallback(course),
            prospects:
                program?.prospects_after_graduation?.trim() || buildProspectsFallback(course),
            competencyModel: program?.competency_model?.trim() || null,
            professionalSkills: program?.professional_skills?.trim() || null,
            managementSkills: program?.management_skills?.trim() || null,
            documents: resolveDocumentItems(course),
        }
    }, [course, degree, program, userRole])

    if (isLoading) return <DetailPageSkeleton />

    if (isError || !course || !display) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-40">
                <AlertCircle className="size-12 text-red-400" />
                <Typography className="font-bold text-gray-700">
                    Failed to load program details
                </Typography>
                {error instanceof Error ? (
                    <div className="w-full max-w-lg">
                        <ErrorView message={error.message} />
                    </div>
                ) : null}
                <Link href="/dashboard/program">
                    <Button variant="outline">Back to Catalog</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-10">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/program">
                    <Button variant="outline" size="icon" className="size-9 rounded-full sm:size-10">
                        <ChevronLeft className="size-5" />
                    </Button>
                </Link>
                <Typography as="span" font="sub-text" className="font-medium text-gray-500">
                    Back to Catalog
                </Typography>
            </div>

            <div className="space-y-3">
                <Typography as="h1" font="heading" className="leading-tight tracking-tight text-[#0a1e42]">
                    {course.name}
                </Typography>
                {display.degreeName ? (
                    <Typography as="p" font="sub-text" className="font-semibold text-gray-700">
                        {display.degreeName}
                    </Typography>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                    <Typography font="small" className="font-bold uppercase tracking-widest text-gray-900">
                        {display.levelLabel}
                    </Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="font-bold uppercase tracking-widest text-gray-900">
                        {display.category}
                    </Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="font-bold uppercase tracking-widest text-gray-900">
                        {`${display.studyMode} Study`}
                    </Typography>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                    <InfoBadge label={`Tuition: ${display.tuitionFees}`} />
                    <InfoBadge label={`Location: ${display.location}`} />
                    <InfoBadge label={`Intake: ${display.intakeLabel}`} />
                    <InfoBadge label={`Deadline: ${display.deadlineLabel}`} />
                    {display.agentCommission ? (
                        <InfoBadge label={display.agentCommission} />
                    ) : null}
                </div>
            </div>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="flex! flex-wrap gap-8 p-8"
            >
                <div className="flex flex-1 flex-col justify-end space-y-6">
                    <DetailTextSection title="Program Overview" content={display.overview} />
                    <div>
                        <Link href={`/dashboard/application/new?course_id=${course.id}`}>
                            <Button className="h-12 rounded-xl bg-brand-secondary px-12 text-[14px] font-bold shadow-lg hover:bg-brand-secondary/90">
                                Apply now
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-md md:w-72">
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
                    childClass="space-y-4 p-8"
                >
                    <DetailTextSection
                        title={`Admission requirements ${course.name}`}
                        content={display.admission}
                    />
                    <Typography as="p" font="sub-text" className="leading-relaxed text-gray-700">
                        The following documents are required for your application:
                    </Typography>
                    {display.documents.length === 0 ? (
                        <Typography font="sub-text" className="text-gray-700">
                            Document requirements will be published soon.
                        </Typography>
                    ) : (
                        <ul className="space-y-2 pl-1">
                            {display.documents.map((document) => (
                                <li key={document.id} className="flex flex-wrap items-center gap-2">
                                    <Typography font="sub-text" className="text-gray-700">
                                        {document.name}
                                    </Typography>
                                    {document.requirementType ? (
                                        <Typography
                                            as="span"
                                            font="small"
                                            className="rounded-full bg-brand-byzantine/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-brand-byzantine"
                                        >
                                            {document.requirementType.replace(/_/g, " ")}
                                        </Typography>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </BluryCard>
            </div>

            <div className="space-y-4">
                <Typography as="h2" font="title" className="text-gray-900">
                    Perspectives
                </Typography>
                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-xl"
                    blendColorClass="bg-white/20"
                    childClass="grid grid-cols-1 gap-8 p-8 md:grid-cols-2"
                >
                    <DetailTextSection title="What to expect during your studies" content={display.perspectives} />
                    <div className="space-y-3">
                        <FactBadge label={`Academic Level: ${display.levelLabel}`} />
                        <FactBadge label={`Language of Study: ${display.language}`} />
                        <FactBadge label={`Study Mode: ${display.studyMode}`} />
                        <FactBadge label={`Application Deadline: ${display.deadlineLabel}`} />
                        {display.competencyModel ? (
                            <DetailTextSection title="Competency Model" content={display.competencyModel} />
                        ) : null}
                    </div>
                </BluryCard>
            </div>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="flex! flex-col gap-8 p-8 md:flex-row"
            >
                <div className="flex-1 space-y-4">
                    <DetailTextSection
                        title="Your prospects after graduation"
                        content={display.prospects}
                    />
                    {(display.professionalSkills || display.managementSkills) && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {display.professionalSkills ? (
                                <DetailTextSection
                                    title="Professional Skills"
                                    content={display.professionalSkills}
                                />
                            ) : null}
                            {display.managementSkills ? (
                                <DetailTextSection
                                    title="Management Skills"
                                    content={display.managementSkills}
                                />
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-md md:w-64">
                    <Image
                        src="/assets/optimized/cheerful-team.webp"
                        alt="Career Path"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                    />
                </div>
            </BluryCard>

            <div className="space-y-4 pt-2">
                <Typography as="h3" font="title" className="text-gray-900">
                    {`${course.name} ${display.studyMode} Study`}
                </Typography>
                <Typography as="h4" font="sub-text" className="font-bold text-gray-900">
                    All The Facts About Your Studies
                </Typography>
                <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                    <FactBadge label={`Credit Points: ${display.creditsLabel}`} />
                    <FactBadge label={`Duration: ${display.duration}`} />
                    <FactBadge label={`Start of Studies: ${display.intakeLabel}`} />
                    <FactBadge label={`Location: ${display.location}`} />
                    <FactBadge label={`Tuition Fees: ${display.tuitionFees}`} />
                    <FactBadge label={`Application Deadline: ${display.deadlineLabel}`} />
                </div>
            </div>
        </div>
    )
}
