"use client"

import { BluryCard } from '@/components/shared/blury-card';
import { Typography } from '@/components/shared/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { FileText, Award, BookOpen, Calendar, ChevronRight, GraduationCap, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StudentDashboard() {
    const { me } = useAuth()
    const { data: meData } = me

    const { data: programsData, isLoading: programsLoading } = useQuery({
        queryKey: ['programs', 'recent'],
        queryFn: async () => {
            const res = await fetch('/api/program?limit=2')
            if (!res.ok) throw new Error('Failed to fetch recent programs')
            const json = await res.json()
            return json.data || []
        },
    })

    const { data: appsData, isLoading: appsLoading } = useQuery({
        queryKey: ['applications', 'recent'],
        queryFn: async () => {
            const res = await fetch('/api/application?limit=2')
            if (!res.ok) throw new Error('Failed to fetch recent applications')
            const json = await res.json()
            return json.data || []
        },
    })

    // Filter offers (assuming status indicates an offer, or just fallback to empty array)
    const offers = (appsData || []).filter((app: any) => app.status === 'OFFER_RECEIVED' || app.status?.toLowerCase().includes('offer')).slice(0, 4)

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Mosaic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

                {/* Container 1: Welcome Message (Small) */}
                <div className="md:col-span-1 lg:col-span-5">
                    <BluryCard className="h-full min-h-[200px] flex flex-col justify-center bg-gradient-to-br from-brand-byzantine/5 to-transparent border-brand-byzantine/10">
                        <div className="space-y-3">
                            <Typography as="h2" font="heading" className="font-bold text-2xl sm:text-3xl">
                                Hello {meData?.fullName || 'Student'}! 👋
                            </Typography>
                            <Typography as="p" font="sub-text" className="text-gray-500 text-sm sm:text-base leading-relaxed">
                                Track your application to FHM university germany and explore your future opportunities.
                            </Typography>
                        </div>
                    </BluryCard>
                </div>

                {/* Container 2: Offers (Now beside welcome) */}
                <div className="md:col-span-1 lg:col-span-7">
                    <BluryCard className="h-full min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                                    <Award className="w-5 h-5" />
                                </div>
                                <Typography as="h3" font="sub-heading" className="font-bold">
                                    Your Offers
                                </Typography>
                            </div>
                            <Link href="/dashboard/application" className="text-xs text-brand-byzantine font-medium hover:underline">
                                View All
                            </Link>
                        </div>

                        {appsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        ) : offers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {offers.map((offer: any, i: number) => (
                                    <div key={i} className="dashboard-panel flex justify-between items-center p-3">
                                        <div className="truncate flex-1 pr-4">
                                            <p className="font-bold text-xs truncate text-gray-800">{offer.program_name}</p>
                                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-0.5">Offer Received</p>
                                        </div>
                                    </div>
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

                {/* Container 3: Applying For (Full Width) */}
                <div className="md:col-span-2 lg:col-span-12">
                    <BluryCard 
                        className="h-full min-h-[220px] relative overflow-hidden"
                        childClass="p-0"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-white shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Typography as="h3" font="title" className="font-bold text-xl leading-tight">
                                            Current Applications
                                        </Typography>
                                        <Typography className="text-xs text-gray-500 font-medium">Track and manage your ongoing submissions</Typography>
                                    </div>
                                </div>
                                <Link href="/dashboard/application" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold text-xs bg-white/50 border-white h-10">
                                        View All Applications
                                    </Button>
                                </Link>
                            </div>

                            {appsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                                </div>
                            ) : appsData?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {appsData.slice(0, 3).map((app: any, i: number) => (
                                        <Link href={`/dashboard/application/${app.id}`} key={i}>
                                            <div className="dashboard-panel group hover:shadow-md transition-shadow p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1 truncate flex-1 pr-4">
                                                        <Typography className="font-bold text-sm text-gray-900 truncate group-hover:text-brand-byzantine transition-colors">
                                                            {app.course?.name || 'Application'}
                                                        </Typography>
                                                        <Typography className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <Calendar className="size-3" />
                                                            {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </Typography>
                                                    </div>
                                                    <div className={cn(
                                                        "text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm",
                                                        app.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                                    )}>
                                                        {app.status}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <Typography className="text-[10px] font-bold text-gray-400">View Details</Typography>
                                                    <ChevronRight className="size-4 text-gray-300 group-hover:text-brand-byzantine transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                    <Typography className="text-sm text-gray-400 font-medium italic">You haven't submitted any applications yet.</Typography>
                                </div>
                            )}
                        </div>
                    </BluryCard>
                </div>

                {/* Container 4: New Programs (Full Width) */}
                <div className="md:col-span-2 lg:col-span-12">
                    <BluryCard 
                        className="h-full min-h-[220px] relative overflow-hidden"
                        childClass="p-0"
                    >
                        {/* Background Decor */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-byzantine/5 to-transparent pointer-events-none" />
                        <div className="absolute top-0 right-0 w-80 h-full bg-[url('/bg-pattern.png')] opacity-[0.03] pointer-events-none" />
                        
                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="bg-brand-byzantine p-3 rounded-2xl shadow-lg shadow-brand-byzantine/20 text-white shrink-0">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Typography as="h3" font="title" className="font-bold text-xl leading-tight">
                                            Explore Programs
                                        </Typography>
                                        <Typography className="text-xs text-gray-500 font-medium">Discover top-rated courses at FHM Germany</Typography>
                                    </div>
                                </div>
                                <Link href="/dashboard/program" className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold text-xs bg-white/50 border-white h-10">
                                        Browse Catalog
                                    </Button>
                                </Link>
                            </div>

                            {programsLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                                </div>
                            ) : programsData?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {programsData.map((prog: any, i: number) => (
                                        <Link href={`/dashboard/program/${prog.program_id}`} key={i}>
                                            <div className="dashboard-panel group h-full hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col justify-between">
                                                <div className="space-y-3">
                                                    <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-brand-byzantine/10 transition-colors">
                                                        <GraduationCap className="size-5 text-gray-400 group-hover:text-brand-byzantine transition-colors" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Typography className="text-left font-bold text-sm text-gray-900 leading-tight line-clamp-2">
                                                            {prog.name}
                                                        </Typography>
                                                        <Typography className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                            <Building2 className="size-3" />
                                                            {prog.campus_name}
                                                        </Typography>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[color:var(--dashboard-card-border)]">
                                                    <Typography className="text-[10px] font-extrabold text-brand-byzantine">{prog.currency || "€"}{prog.tuition_fee}</Typography>
                                                    <ArrowRight className="size-3 text-gray-300 group-hover:text-brand-byzantine transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Typography className="text-sm text-gray-400 font-medium italic">No programs found at the moment.</Typography>
                                </div>
                            )}
                        </div>
                    </BluryCard>
                </div>

            </div>
        </div>
    );
}
