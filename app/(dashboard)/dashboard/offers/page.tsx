'use client';

import React from 'react';
import { Search, Eye, BookOpen, Globe, GraduationCap, Building2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge, DocStatus } from '@/components/shared/StatusBadge';
import { Typography } from '@/components/shared/Typography';
import { BluryCard } from '@/components/shared/blury-card';
import Link from 'next/link';

const offersData = [
  {
    id: 'ADM-2024-0089',
    name: 'Julianne Sterling',
    initials: 'JS',
    program: 'Masters in English',
    campus: 'Nexus Academy',
    status: DocStatus.VERIFIED,
    icon: FileText,
  },
  {
    id: 'ADM-2024-0104',
    name: 'Arjun Kapoor',
    initials: 'AK',
    program: 'Bachelors Software',
    campus: 'Brainstorm',
    status: DocStatus.PENDING,
    icon: Globe,
  },
  {
    id: 'ADM-2024-0072',
    name: 'Elena Sorokin',
    initials: 'ES',
    program: 'MBA Global Business',
    campus: 'Horizon',
    status: DocStatus.ACTION_REQUIRED,
    icon: Globe,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    id: 'ADM-2024-0112',
    name: 'Marcus Chen',
    initials: 'MC',
    program: 'BSc Business Administration',
    campus: 'Innovate',
    status: DocStatus.VERIFIED,
    icon: FileText,
  },
];

export default function OffersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <BluryCard isCentered={false} className="bg-white/40 border-white/60">
        <div className="text-left space-y-2">
          <Typography font="heading" className="text-slate-900">All Offer</Typography>
          <Typography font="sub-text" className="text-slate-600 max-w-2xl">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s
          </Typography>
        </div>
      </BluryCard>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          placeholder="Search student"
          className="pl-12 py-6 bg-white/80 border-none rounded-xl shadow-sm focus-visible:ring-brand-primary/20"
        />
      </div>

      {/* Table Section */}
      <BluryCard isCentered={false} className="bg-white/40 border-white/60 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Student Name</th>
                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Program</th>
                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Campus</th>
                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {offersData.map((student) => (
                <tr key={student.id} className="hover:bg-white/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white/50 shadow-sm">
                        <AvatarImage src={student.image} />
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-bold">
                          {student.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Typography className="font-bold text-slate-900 leading-tight">
                          {student.name}
                        </Typography>
                        <Typography className="text-[11px] text-slate-500 font-medium">
                          ID: {student.id}
                        </Typography>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <student.icon className="h-4 w-4 text-slate-700" />
                      <Typography className="text-[14px] font-semibold text-slate-800">
                        {student.program}
                      </Typography>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Typography className="text-[14px] font-medium text-slate-500">
                      {student.campus}
                    </Typography>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/offers/${student.id}`}>
                      <Button variant="outline" className="bg-white/50 border-none hover:bg-white/80 text-slate-700 font-bold px-6 h-9 rounded-lg shadow-sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-8 py-6 flex items-center justify-between border-t border-white/20 bg-white/10">
          <div className="text-[13px] text-slate-500">
            Showing <span className="font-bold text-slate-900">5</span> of <span className="font-bold text-slate-900">1,284</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/40 hover:bg-white/60">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/40 hover:bg-white/60">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </BluryCard>
    </div>
  );
}
