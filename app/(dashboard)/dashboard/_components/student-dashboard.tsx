"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
    FileText,
    Award,
    BookOpen,
    Calendar,
    ChevronRight,
    GraduationCap,
    Building2,
    ArrowRight,
} from "lucide-react"
import { BluryCard } from "@/components/shared/blury-card"
import { Typography } from "@/components/shared/Typography"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import {
    ApplicationsListTable,
    DocumentVaultCell,
    type ApplicationRow,
} from "@/app/(dashboard)/dashboard/application/_components/applications-list-table"
import { ApplicationStatus } from "@/components/shared/StatusBadge"
import type { OfferListItem } from "@/types/schemas/offer"
import type { CourseProgram } from "@/types/schemas/program"
import { deriveProgramCategory } from "@/lib/utils/program"

const RECENT_OFFERS = 2
const RECENT_APPLICATIONS = 3
const RECENT_PROGRAMS = 4

export function StudentDashboard() {
    const { me } = useAuth()
    const meData = me.data

    const { data: offersData, isLoading: offersLoading } = useQuery<OfferListItem[]>({
        queryKey: ["offers", "recent", RECENT_OFFERS],
        queryFn: async () => {
            const res = await fetch(`/api/offer?limit=${RECENT_OFFERS}&page=1`)
            if (!res.ok) throw new Error("Failed to fetch offers")
            const json = await res.json()
            return (json.data ?? []) as OfferListItem[]
        },
        staleTime: 2 * 60 * 1000,
    })

    const { data: appsData, isLoading: appsLoading } = useQuery<ApplicationRow[]>({
        queryKey: ["applications", "recent", RECENT_APPLICATIONS],
        queryFn: async () => {
            const res = await fetch(`/api/application?limit=${RECENT_APPLICATIONS}`)
            if (!res.ok) throw new Error("Failed to fetch recent applications")
            const json = await res.json()
            return (json.data ?? []) as ApplicationRow[]
        },
        staleTime: 1 * 60 * 1000,
    })

    const { data: programsData, isLoading: programsLoading } = useQuery<CourseProgram[]>({
        queryKey: ["programs", "recent", RECENT_PROGRAMS],
        queryFn: async () => {
            const res = await fetch(`/api/program?limit=${RECENT_PROGRAMS}`)
            if (!res.ok) throw new Error("Failed to fetch recent programs")
            const json = await res.json()
            return (json.data ?? []) as CourseProgram[]
        },
        staleTime: 5 * 60 * 1000,
    })

    const recentOffers = useMemo(() => offersData ?? [], [offersData])
    const recentApplications = useMemo(() => appsData ?? [], [appsData])
    const recentPrograms = useMemo(() => programsData ?? [], [programsData])

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

                <div className="md:col-span-1 lg:col-span-5">
                    <BluryCard
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        blendColorClass="bg-white/10"
                        className="h-full min-h-[200px] flex flex-col justify-center border-brand-secondary/15"
                    >
                        <div className="space-y-3">
                            <Typography as="h2" font="heading" className="font-bold text-2xl sm:text-3xl text-brand-blue-text">
                                Hello {meData?.fullName || "Student"}!
                            </Typography>
                            <Typography as="p" font="sub-text" className="text-gray-500 text-sm sm:text-base leading-relaxed">
                                Track your applications to FHM University Germany and explore your future opportunities.
                            </Typography>
                        </div>
                    </BluryCard>
                </div>

                <div className="md:col-span-1 lg:col-span-7">
                    <BluryCard
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        blendColorClass="bg-white/10"
                        className="h-full min-h-[200px] border-brand-secondary/15"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-secondary/10 p-2 rounded-lg text-brand-secondary">
                                    <Award className="w-5 h-5" />
                                </div>
                                <Typography as="h3" font="sub-heading" className="font-bold text-brand-blue-text">
                                    Your Offers
                                </Typography>
                            </div>
                            <Link href="/dashboard/offer" className="text-xs text-brand-byzantine font-medium hover:underline">
                                View All
                            </Link>
                        </div>

                        {offersLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-12 bg-brand-secondary/10 rounded" />
                            </div>
                        ) : recentOffers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {recentOffers.map((offer) => (
                                    <Link
                                        key={offer.id}
                                        href={`/dashboard/offer/${offer.id}`}
                                        className="dashboard-panel flex justify-between items-center p-3 hover:bg-brand-secondary/5 transition-colors"
                                    >
                                        <div className="truncate flex-1 pr-4 space-y-1">
                                            <Typography as="span" font="sub-text" className="font-bold text-xs truncate text-gray-800 block">
                                                {offer.application?.course?.name ?? "Offer"}
                                            </Typography>
                                            {offer.application?.course?.degree?.name && (
                                                <Typography as="span" font="small" className="text-[10px] text-gray-500 truncate block">
                                                    {offer.application.course.degree.name}
                                                </Typography>
                                            )}
                                            <StatusBadge status={offer.status} />
                                        </div>
                                        <ChevronRight className="size-4 text-gray-300 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 opacity-60">
                                <Award className="w-8 h-8 text-gray-300" />
                                <Typography as="p" font="sub-text" className="text-gray-400 text-sm italic">
                                    No offers yet. Stay tuned!
                                </Typography>
                            </div>
                        )}
                    </BluryCard>
                </div>

                {/* Current Applications */}
                <div className="md:col-span-2 lg:col-span-12">
                    <BluryCard
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        blendColorClass="bg-white/10"
                        className="p-0 h-full min-h-[220px] relative overflow-hidden border-brand-secondary/15"
                        childClass="p-0"
                    >
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-secondary/10 to-transparent pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="bg-brand-secondary p-3 rounded-2xl shadow-lg shadow-brand-secondary/20 text-white shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Typography as="h3" font="title" className="font-bold text-xl leading-tight text-brand-blue-text">
                                            Current Applications
                                        </Typography>
                                        <Typography as="p" className="text-xs text-gray-500 font-medium">
                                            Track and manage your ongoing submissions
                                        </Typography>
                                    </div>
                                </div>
                                <Link href="/dashboard/application" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold text-xs bg-white/50 border-white/40 h-10">
                                        View All Applications
                                    </Button>
                                </Link>
                            </div>

                            {appsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                                    <div className="h-24 bg-brand-secondary/10 rounded-2xl" />
                                    <div className="h-24 bg-brand-secondary/10 rounded-2xl" />
                                    <div className="h-24 bg-brand-secondary/10 rounded-2xl" />
                                </div>
                            ) : recentApplications.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentApplications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="dashboard-panel group hover:shadow-md hover:bg-brand-secondary/5 transition-all p-5"
                                        >
                                            <div className="flex justify-between items-start mb-4 gap-3">
                                                <Link
                                                    href={`/dashboard/application/${app.id}`}
                                                    className="space-y-1 truncate flex-1 min-w-0"
                                                >
                                                    <Typography as="span" className="font-bold text-sm text-gray-900 truncate block group-hover:text-brand-byzantine transition-colors">
                                                        {app.course?.name ?? "Application"}
                                                    </Typography>
                                                    {app.course?.degree?.name && (
                                                        <Typography as="span" className="text-[10px] text-gray-500 font-medium truncate block">
                                                            {app.course.degree.name}
                                                        </Typography>
                                                    )}
                                                    <Typography as="span" className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar className="size-3" />
                                                        {new Date(app.created_at).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Typography>
                                                </Link>
                                                <div className="flex flex-col gap-1.5 shrink-0">
                                                    <StatusBadge status={app.status} />
                                                    {app.offer_letter && (
                                                        <StatusBadge
                                                            status={ApplicationStatus.CONDITIONAL_LETTER_ISSUED}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-4 pt-3 border-t border-brand-secondary/15">
                                                <Typography as="p" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                    Document Vault
                                                </Typography>
                                                <DocumentVaultCell
                                                    app={app}
                                                    variant="student"
                                                    fallbackStudentId={meData?.id}
                                                />
                                            </div>

                                            <Link
                                                href={`/dashboard/application/${app.id}`}
                                                className="flex items-center justify-between pt-2 border-t border-brand-secondary/15 group/link"
                                            >
                                                <Typography as="span" className="text-[10px] font-bold text-gray-400 group-hover/link:text-brand-byzantine transition-colors">
                                                    View Details
                                                </Typography>
                                                <ChevronRight className="size-4 text-gray-300 group-hover/link:text-brand-byzantine transition-colors" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-brand-secondary/5 rounded-3xl border border-dashed border-brand-secondary/20">
                                    <Typography as="p" className="text-sm text-gray-400 font-medium italic">
                                        You haven&apos;t submitted any applications yet.
                                    </Typography>
                                </div>
                            )}
                        </div>
                    </BluryCard>
                </div>

                {/* Explore Programs */}
                <div className="md:col-span-2 lg:col-span-12">
                    <BluryCard
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        blendColorClass="bg-white/10"
                        className="p-0 h-full min-h-[220px] relative overflow-hidden border-brand-secondary/15"
                        childClass="p-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-byzantine/5 to-transparent pointer-events-none" />
                        <div className="absolute top-0 right-0 w-80 h-full bg-[url('/bg-pattern.png')] opacity-[0.03] pointer-events-none" />

                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="bg-brand-byzantine p-3 rounded-2xl shadow-lg shadow-brand-byzantine/20 text-white shrink-0">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Typography as="h3" font="title" className="font-bold text-xl leading-tight text-brand-blue-text">
                                            Explore Programs
                                        </Typography>
                                        <Typography as="p" className="text-xs text-gray-500 font-medium">
                                            Discover top-rated courses at FHM Germany
                                        </Typography>
                                    </div>
                                </div>
                                <Link href="/dashboard/program" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold text-xs bg-white/50 border-white/40 h-10">
                                        Browse Catalog
                                    </Button>
                                </Link>
                            </div>

                            {programsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                                    <div className="h-40 bg-brand-secondary/10 rounded-2xl" />
                                    <div className="h-40 bg-brand-secondary/10 rounded-2xl" />
                                    <div className="h-40 bg-brand-secondary/10 rounded-2xl" />
                                    <div className="h-40 bg-brand-secondary/10 rounded-2xl" />
                                </div>
                            ) : recentPrograms.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {recentPrograms.map((prog) => (
                                        <Link href={`/dashboard/program/${prog.id}`} key={prog.id}>
                                            <div className="dashboard-panel group h-full hover:shadow-md hover:bg-brand-secondary/5 transition-all p-4 sm:p-5 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="size-10 bg-brand-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-byzantine/10 transition-colors">
                                                        <GraduationCap className="size-5 text-brand-secondary group-hover:text-brand-byzantine transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Typography as="span" className="text-left font-bold text-sm text-gray-900 leading-tight line-clamp-2 block">
                                                            {prog.name}
                                                        </Typography>
                                                        <Typography as="span" className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                            <Building2 className="size-3 shrink-0" />
                                                            {prog.degree?.location ?? deriveProgramCategory(prog.degree?.name)}
                                                        </Typography>
                                                        {prog.degree?.name && (
                                                            <Typography as="span" className="text-[10px] text-gray-400 line-clamp-1 block">
                                                                {prog.degree.name}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-brand-secondary/15">
                                                    <Typography as="span" className="text-[10px] font-extrabold text-brand-byzantine">
                                                        {prog.degree?.fees ?? "Contact University"}
                                                    </Typography>
                                                    <ArrowRight className="size-3 text-gray-300 group-hover:text-brand-byzantine transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Typography as="p" className="text-sm text-gray-400 font-medium italic">
                                        No programs found at the moment.
                                    </Typography>
                                </div>
                            )}
                        </div>
                    </BluryCard>
                </div>

            </div>
        </div>
    )
}
