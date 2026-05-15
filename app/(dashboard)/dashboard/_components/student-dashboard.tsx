"use client"

import { BluryCard } from '@/components/shared/blury-card';
import { Typography } from '@/components/shared/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { FileText, Award, BookOpen } from 'lucide-react';
import Link from 'next/link';

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

                {/* Container 1: Welcome Message (Large) */}
                <div className="lg:col-span-8">
                    <BluryCard className="h-full min-h-[200px] flex flex-col justify-center">
                        <div className="space-y-3">
                            <Typography as="h2" font="heading" className="font-bold text-3xl">
                                Hello {meData?.fullName || 'Student'}! 👋
                            </Typography>
                            <Typography as="p" font="sub-text" className="text-gray-500 text-lg">
                                Track your application to FHM university germany
                            </Typography>
                        </div>
                    </BluryCard>
                </div>

                {/* Container 2: New Programs */}
                <div className="lg:col-span-4">
                    <BluryCard className="h-full min-h-[200px]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-brand-byzantine/10 p-2 rounded-lg text-brand-byzantine">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <Typography as="h3" font="sub-heading" className="font-bold">
                                New Programs
                            </Typography>
                        </div>
                        
                        {programsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                            </div>
                        ) : programsData?.length > 0 ? (
                            <div className="space-y-3">
                                {programsData.slice(0, 2).map((prog: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/20">
                                        <div className="truncate">
                                            <p className="font-medium text-sm truncate">{prog.name}</p>
                                            <p className="text-xs text-gray-500">{prog.campus_name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Typography as="p" font="sub-text" className="text-gray-400 text-sm">
                                No new programs available.
                            </Typography>
                        )}
                    </BluryCard>
                </div>

                {/* Container 3: Applying For */}
                <div className="lg:col-span-6">
                    <BluryCard className="h-full min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <Typography as="h3" font="sub-heading" className="font-bold">
                                    Applying For
                                </Typography>
                            </div>
                            <Link href="/dashboard/application" className="text-xs text-brand-byzantine font-medium hover:underline">
                                View All
                            </Link>
                        </div>

                        {appsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-12 bg-gray-200 rounded"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        ) : appsData?.length > 0 ? (
                            <div className="space-y-3">
                                {appsData.slice(0, 2).map((app: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/20">
                                        <div className="truncate flex-1 pr-4">
                                            <p className="font-medium text-sm truncate">{app.program_name || 'Application'}</p>
                                            <p className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-xs px-2 py-1 bg-gray-100 rounded-md whitespace-nowrap">
                                            {app.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Typography as="p" font="sub-text" className="text-gray-400 text-sm">
                                No recent applications.
                            </Typography>
                        )}
                    </BluryCard>
                </div>

                {/* Container 4: Offers */}
                <div className="lg:col-span-6">
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
                                View Offers
                            </Link>
                        </div>

                        {appsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        ) : offers.length > 0 ? (
                            <div className="space-y-3">
                                {offers.map((offer: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/20">
                                        <div className="truncate flex-1 pr-4">
                                            <p className="font-medium text-sm truncate">{offer.program_name}</p>
                                            <p className="text-xs text-green-600 font-medium">Offer Received</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                                <Award className="w-8 h-8 text-gray-300" />
                                <Typography as="p" font="sub-text" className="text-gray-400 text-sm">
                                    No offers yet. Keep an eye out!
                                </Typography>
                            </div>
                        )}
                    </BluryCard>
                </div>

            </div>
        </div>
    );
}
