"use client"

import { useState, useEffect } from 'react';
import { Typography } from '@/components/shared/Typography';
import { BluryCard } from '@/components/shared/blury-card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { cn } from '@/lib/utils';

// Recharts Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white/60 shadow-lg animate-in fade-in duration-200">
                <p className="font-bold text-xs text-gray-800 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-extrabold text-brand-byzantine mt-1">
                    Applications: <span className="text-gray-900">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export function UniversityDashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. KPI Stats Data
    const stats = [
        {
            title: 'Total Applications',
            value: '1,248',
            growth: '+12%',
            badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            title: 'Conversion Rate',
            value: '80%',
            growth: 'Stable',
            badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            title: 'Project Revenue',
            value: '$1240',
            growth: 'Invoiced Q3',
            badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
        },
        {
            title: 'Agent Activity',
            value: '412',
            growth: 'Active global',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
        },
    ];

    // 2. Bar Chart Data (Recruitment Pipeline)
    const pipelineData = [
        { name: 'Created', value: 420, fill: 'url(#colorCreated)' },
        { name: 'Qualified', value: 310, fill: 'url(#colorQualified)' },
        { name: 'Document Review', value: 240, fill: 'url(#colorReview)' },
        { name: 'Completed', value: 180, fill: 'url(#colorCompleted)' },
    ];

    // 3. Recruitment Hubs Data
    const recruitmentHubs = [
        { code: 'DE', name: 'Germany', count: 450, percentage: 100 },
        { code: 'PK', name: 'Pakistan', count: 310, percentage: 68 },
        { code: 'IN', name: 'India', count: 280, percentage: 62 },
        { code: 'CN', name: 'China', count: 208, percentage: 46 },
    ];

    // 4. Agent Partners Data
    const agentPartners = [
        {
            rank: '01',
            name: 'Global Scholars Link',
            region: 'South Asia region',
            revenue: '$840k',
            growth: '+12.2%',
        },
        {
            rank: '02',
            name: 'Apex Edu Advisory',
            region: 'Middle East region',
            revenue: '$620k',
            growth: '+8.5%',
        },
        {
            rank: '03',
            name: 'Stellar Academy',
            region: 'Southeast Asia region',
            revenue: '$410k',
            growth: '+5.1%',
        },
        {
            rank: '04',
            name: 'Bridge Education',
            region: 'East Europe region',
            revenue: '$280k',
            growth: '+3.4%',
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 🔹 Heading & Description */}
            <div className="space-y-2 max-w-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight text-brand-secondary dark:text-white">
                    FHM University Dashboard
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-500 font-medium leading-relaxed dark:text-gray-400">
                    Welcome to the University portal. Track and optimize your recruitment pipeline, agent partners, and student enrollment metrics.
                </Typography>
            </div>

            {/* 🔹 KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                {stats.map((stat, index) => {
                    return (
                        <BluryCard
                            key={index}
                            isCentered={false}
                            blurAmount="backdrop-blur-lg"
                            blendColorClass="bg-white/15 dark:bg-white/5 transition-all duration-300 group-hover:opacity-0"
                            className="p-0! group hover:bg-brand-byzantine transition-all duration-300 border border-white/60 dark:border-white/10 cursor-pointer"
                        >
                            <div className="space-y-3">
                                <Typography font="small" as="p" className="text-gray-400 uppercase tracking-widest font-normal leading-none group-hover:text-white/80 transition-colors duration-300">
                                    {stat.title}
                                </Typography>
                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <Typography
                                        font="sub-heading"
                                        as="p"
                                        className="font-extrabold text-gray-900 dark:text-white leading-none tracking-tight group-hover:text-white transition-colors duration-300"
                                    >
                                        {stat.value}
                                    </Typography>
                                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm border shrink-0 transition-all duration-300", stat.badgeClass, "group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30")}>
                                        {stat.growth}
                                    </Badge>
                                </div>
                            </div>
                        </BluryCard>
                    );
                })}
            </div>

            {/* 🔹 Recruitment Pipeline Section (Bar Chart) */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/15 dark:bg-white/5"
                className="p-0! border border-white/60 dark:border-white/10"
                childClass='space-y-8'
            >
                <Typography font="title" as="h3" className="font-extrabold text-brand-secondary dark:text-white">
                    Recruitment Pipeline
                </Typography>

                <div className="w-full h-[420px]">
                    {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={pipelineData}
                                margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9933FF" stopOpacity={0.85} />
                                        <stop offset="95%" stopColor="#9933FF" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#356CFC" stopOpacity={0.85} />
                                        <stop offset="95%" stopColor="#356CFC" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF33A8" stopOpacity={0.85} />
                                        <stop offset="95%" stopColor="#FF33A8" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34E548" stopOpacity={0.85} />
                                        <stop offset="95%" stopColor="#34E548" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-5}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(153, 51, 255, 0.05)' }} />
                                <Bar
                                    dataKey="value"
                                    radius={[10, 10, 0, 0]}
                                    barSize={60}
                                >
                                    {pipelineData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-pulse bg-gray-200/50 dark:bg-white/5 rounded-2xl w-full h-full" />
                        </div>
                    )}
                </div>
            </BluryCard>

            {/* 🔹 Bottom Section (Two Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Card 1: Top Recruitment Hubs */}
                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-lg"
                    blendColorClass="bg-white/15 dark:bg-white/5"
                    className="p-0! border border-white/60 dark:border-white/10"
                    childClass="space-y-8"
                >
                    <Typography font="title" as="h3" className="font-extrabold text-brand-secondary dark:text-white">
                        Top Recruitment Hubs
                    </Typography>
                    <div className='space-y-6'>
                        {recruitmentHubs.map((hub, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="size-8 rounded-xl bg-brand-secondary/10 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-brand-secondary dark:text-white shadow-sm border border-brand-secondary/5 dark:border-white/5">
                                            {hub.code}
                                        </span>
                                        <Typography font="sub-text" className="font-bold text-gray-800 dark:text-gray-200">
                                            {hub.name}
                                        </Typography>
                                    </div>
                                    <Typography font="small" className="font-extrabold text-brand-secondary dark:text-brand-blue bg-brand-secondary/5 dark:bg-brand-blue/10 px-2 py-0.5 rounded-lg border border-brand-secondary/5 dark:border-brand-blue/5">
                                        {hub.count}
                                    </Typography>
                                </div>

                                {/* Custom modern progress bar */}
                                <div className="w-full bg-gray-200/50 dark:bg-white/5 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-brand-blue dark:bg-brand-byzantine h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${mounted ? hub.percentage : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </BluryCard>

                {/* Card 2: Top Agent Partners */}
                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-lg"
                    blendColorClass="bg-white/15 dark:bg-white/5"
                    className="p-0! border border-white/60 dark:border-white/10"
                    childClass="space-y-8"
                >
                    <Typography font="title" as="h3" className="font-extrabold text-brand-secondary dark:text-white">
                        Top Agent Partners
                    </Typography>
                    <div className='space-y-5'>
                        {agentPartners.map((agent, index) => (
                            <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 border border-white/40 dark:border-white/5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="size-8 rounded-xl bg-brand-byzantine/10 flex items-center justify-center font-bold text-xs text-brand-byzantine shrink-0 border border-brand-byzantine/5">
                                        {agent.rank}
                                    </span>
                                    <div className="min-w-0">
                                        <Typography font="sub-text" className="font-extrabold text-gray-800 dark:text-gray-200 truncate leading-snug">
                                            {agent.name}
                                        </Typography>
                                        <Typography font="small" className="text-gray-400 font-medium text-[11px] leading-tight">
                                            {agent.region}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <Typography font="sub-text" className="font-extrabold text-gray-900 dark:text-white leading-snug">
                                        {agent.revenue}
                                    </Typography>
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 block leading-tight">
                                        {agent.growth}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </BluryCard>

            </div>
        </div>
    );
}
