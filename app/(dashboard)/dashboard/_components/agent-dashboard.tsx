"use client"

import Link from 'next/link';
import { GraduationCap, FileText, ClipboardCheck, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BluryCard } from '@/components/shared/blury-card';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/shared/Typography';
import { ApplicationTable, type ApplicationRow } from '../_component/ApplicationTable';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type DashboardStats = {
    total_students: number
    active_applications: number
    pending_actions: number
}

export function AgentDashboard() {
    const { data, isLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats')
            if (!res.ok) throw new Error('Failed to fetch dashboard stats')
            const json = await res.json()
            return json.data as DashboardStats
        },
    })

    const { data: recentAppsData, isLoading: appsLoading } = useQuery<ApplicationRow[]>({
        queryKey: ['applications', 'recent'],
        queryFn: async () => {
            const res = await fetch('/api/application?limit=10')
            if (!res.ok) throw new Error('Failed to fetch recent applications')
            const json = await res.json()
            return json.data as ApplicationRow[]
        },
    })

    const recentApplications = useMemo(
        () => (Array.isArray(recentAppsData) ? recentAppsData : []),
        [recentAppsData]
    )

    const stats = useMemo(() => [
        {
            title: 'Total Students',
            value: isLoading ? '—' : (data?.total_students ?? 0).toLocaleString(),
            icon: GraduationCap,
            color: 'text-black',
        },
        {
            title: 'Active Applications',
            value: isLoading ? '—' : (data?.active_applications ?? 0).toLocaleString(),
            icon: FileText,
            color: 'text-black',
        },
        {
            title: 'Documents Signed',
            value: '—',
            icon: ClipboardCheck,
            color: 'text-black',
        },
        {
            title: 'Pending Actions',
            value: isLoading ? '—' : (data?.pending_actions ?? 0).toLocaleString(),
            icon: Clock,
            color: 'text-black',
        },
    ], [data, isLoading])

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="space-y-1 max-w-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    Agent Dashboard
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                    Here is a summary of your global student recruitment performance and pending administrative tasks.
                </Typography>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                {stats.map((stat, index) => (
                    <BluryCard
                        key={index}
                        isCentered={false}
                        blurAmount="backdrop-blur-lg"
                        blendColorClass="bg-white/10"
                    >
                        <div className="space-y-6">
                            <div className={cn(stat.color, "border-x border-white/40 p-2 w-fit rounded-l-lg rounded-r-lg")}>
                                <stat.icon className="w-8 h-8 opacity-80" />
                            </div>
                            <div className="space-y-1">
                                <Typography font='sub-text' as={'p'}>
                                    {stat.title}
                                </Typography>
                                <Typography
                                    font='title'
                                    as={'p'}
                                    className={cn('font-bold', isLoading && 'animate-pulse text-gray-400')}
                                >
                                    {stat.value}
                                </Typography>

                            </div>
                        </div>
                    </BluryCard>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Typography font='text-xl' as={'h2'} className='font-bold'>
                        Recent Applications
                    </Typography>
                    <Button variant="link" className="text-brand-byzantine font-bold flex items-center gap-2 hover:gap-3 transition-all" asChild>
                        <Link href="/dashboard/application">
                            View All Applications <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>

                <ApplicationTable applications={recentApplications} isLoading={appsLoading} />
            </div>
        </div>
    );
}
