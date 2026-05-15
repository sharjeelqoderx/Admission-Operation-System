"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { PageLoader } from "@/components/shared/page-loader"
import { BluryCard } from "@/components/shared/blury-card"

export default function DynamicProgramDetailsPage() {
    const params = useParams()
    const programId = params?.["program-id"] as string

    const { data: program, isLoading, isError } = useQuery({
        queryKey: ["program", programId],
        queryFn: async () => {
            const res = await fetch(`/api/program/${programId}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            return json.data
        },
        enabled: !!programId
    })

    if (isLoading) return <PageLoader label="Loading program details..." />

    if (isError) {
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

    // Junction data (taking the first one for campus-specific facts)
    const junction = program?.campus_program_junction?.[0]

    return (
        <div className="space-y-12">

            {/* Header */}
            <div className="space-y-2">
                <Typography as="h1" font="heading" className="text-[#0a1e42] tracking-tight leading-tight">
                    {program?.name || "AI & Data Science Management (M.Sc.)"}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">{program?.category || "AI Management Study"}</Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">{program?.program_length?.split(' ')?.[0] || "Master"}</Typography>
                    <span className="text-[#a855f7]">•</span>
                    <Typography font="small" className="text-gray-900 font-bold uppercase tracking-widest">{junction?.study_type?.replace('_', ' ') || "Full-Time Study"}</Typography>
                </div>
            </div>


            {/* Intro Card */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="p-8 flex! flex-wrap gap-8"
            >
                <div className="flex-1 flex justify-start items-end flex-col space-y-6">
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed font-medium">
                        {program?.program_detail || `The Master's programme in ${program?.name || 'AI & Data Science Management (M.Sc.)'} combines business, management and artificial intelligence into a practical, interdisciplinary programme. It equips you to develop data-driven strategies, solve complex problems analytically and actively guide organisations through digital transformation.`}
                    </Typography>
                    {program?.status === "INACTIVE" && (
                        <Typography as="p" font="small" className="text-gray-500 italic">
                            *The degree programme is currently undergoing accreditation.
                        </Typography>
                    )}

                    <div>
                        <Link href="/dashboard/application/new">
                            <Button className="bg-brand-secondary hover:bg-brand-secondary/90 text-white h-12 px-12 text-[14px] font-bold rounded-xl shadow-lg">
                                Apply now
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="w-full md:w-72 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md bg-gray-100">
                    <img
                        src={junction?.campus?.university?.avatar_url || "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400"}
                        alt="Program"
                        className="w-full h-full object-cover"
                    />
                </div>
            </BluryCard>

            {/* Admission Requirements */}
            <div className="space-y-4">
                <Typography as="h2" font="title" className="text-gray-900">Admission Requirements</Typography>

                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-xl"
                    blendColorClass="bg-white/20"
                    childClass="p-8 space-y-4"
                >
                    <Typography as="h3" font="sub-text" className="font-bold text-gray-900">
                        Admission requirements {program?.name || "AI & Data Science Management (M.Sc.)"}*
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                        {program?.admission_requirements || "The formal entry requirement for the postgraduate programme is a relevant university degree with a foundation in business administration or an equivalent academic qualification (e.g. a Master's or Diplom degree) comprising at least 180 ECTS credits."}
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed mt-4">
                        The following documents are required for your application:
                    </Typography>
                    <ul className="space-y-1 pl-4 list-none">
                        <li><Typography font="sub-text" className="text-gray-700">CV</Typography></li>
                        <li><Typography font="sub-text" className="text-gray-700">Proof of university entrance qualification (General Higher Education Entrance Qualification, etc.)</Typography></li>
                        <li><Typography font="sub-text" className="text-gray-700">Proof of a university degree</Typography></li>
                        <li><Typography font="sub-text" className="text-gray-700">1 year of professional experience</Typography></li>
                    </ul>
                </BluryCard>

            </div>

            {/* Perspectives */}
            <div className="space-y-4">
                <Typography as="h2" font="title" className="text-gray-900">Perspectives</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Typography as="h3" font="sub-text" className="font-bold text-gray-900">What to expect during your studies</Typography>
                        <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                            {program?.perspectives || "In this Master's programme, you will develop skills in data analysis, artificial intelligence and management. You will learn to make data-driven decisions, optimise business processes and develop innovative solutions for organisations."}
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                            The programme combines technical, analytical and business management knowledge whilst strengthening leadership, communication and intercultural skills – ideal for actively guiding organisations through digital transformation.
                        </Typography>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: "Our Competency Model", value: program?.competency_model },
                            { label: "Professional Skills", value: program?.professional_skills },
                            { label: "Management Skills", value: program?.management_skills },
                            { label: "Smart Skills", value: "Available soon" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/80 transition-colors shadow-sm">
                                <div className="space-y-1">
                                    <Typography as="span" font="sub-text" className="font-bold text-gray-900">{item.label}</Typography>
                                    {item.value && <Typography font="small" className="text-gray-500 line-clamp-1">{item.value}</Typography>}
                                </div>
                                <Plus className="size-5 text-gray-600" />
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Prospects */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-xl"
                blendColorClass="bg-white/20"
                className="overflow-hidden"
                childClass="p-8 flex! flex-col md:flex-row gap-8"
            >
                <div className="flex-1 space-y-4">
                    <Typography as="h3" font="sub-text" className="font-bold text-gray-900">Your prospects after graduation</Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 leading-relaxed">
                        {program?.prospects_after_graduation || `As a graduate of the ${program?.name || 'AI & Data Science Management'} programme, you will play an active role in shaping data-driven business models and developing innovative solutions at the intersection of management, artificial intelligence and data science.`}
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-700 mt-2">
                        Typical career paths and fields of activity include:
                    </Typography>
                    <ul className="space-y-1.5 pl-5 list-disc marker:text-gray-400">
                        <li><Typography font="small" className="text-gray-700">"AI & Data Science Manager", who develops and implements data-driven strategies</Typography></li>
                        <li><Typography font="small" className="text-gray-700">"Data Analyst" or "Data Scientist", who analyses data and provides the basis for decision-making</Typography></li>
                        <li><Typography font="small" className="text-gray-700">"Chief Data Officer" (CDO) or "Business Intelligence Manager"</Typography></li>
                        <li><Typography font="small" className="text-gray-700">Specialist and management roles in data-driven business units</Typography></li>
                        <li><Typography font="small" className="text-gray-700">Management consultancies, international companies and public sector organisations</Typography></li>
                    </ul>
                </div>

                <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-md">
                    <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=400" alt="Career Path" className="w-full h-full object-cover" />
                </div>
            </BluryCard>

            {/* Footer Facts */}
            <div className="space-y-4 pt-4">
                <Typography as="h3" font="title" className="text-gray-900">{program?.name || "AI & Data Science Management (M.Sc.)"} {junction?.study_type?.replace('_', ' ') || "Full-Time Study"}</Typography>
                <Typography as="h4" font="sub-text" className="font-bold text-gray-900">All The Facts About Your Studies</Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography font="sub-text" className="font-bold text-gray-900">Creditpoints: 120 ECTS</Typography>
                    </div>
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography font="sub-text" className="font-bold text-gray-900">Duration: {program?.program_length || "24 Months"}</Typography>
                    </div>
                    <div className="bg-[#1e1e2d]/10 backdrop-blur-md rounded-xl py-4 px-6 text-center border border-gray-200/50">
                        <Typography font="sub-text" className="font-bold text-gray-900">Start of studies: {junction?.intake_date ? new Date(junction.intake_date).toLocaleDateString('en-US', { month: 'long' }) : "October"}</Typography>
                    </div>
                </div>
            </div>


        </div>
    )
}
