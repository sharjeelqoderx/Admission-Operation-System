import { GraduationCap, FileText, ClipboardCheck, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BluryCard } from '@/components/shared/blury-card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const stats = [
  {
    title: 'Total Students',
    value: '1,284',
    icon: GraduationCap,
    color: 'text-black',
  },
  {
    title: 'Active Applications',
    value: '422',
    icon: FileText,
    color: 'text-black',
  },
  {
    title: 'Documents Signed',
    value: '3,102',
    icon: ClipboardCheck,
    color: 'text-black',
  },
  {
    title: 'Pending Actions',
    value: '18',
    icon: Clock,
    color: 'text-black',
  },
];

const applications = [
  {
    name: 'Aisha Mohammed',
    program: 'MSc Data Science',
    status: 'Contract Sent',
    date: 'Oct 24, 2024',
  },
  {
    name: 'Julian Lee',
    program: 'BEng Mechanical',
    status: 'Created',
    date: 'Oct 23, 2024',
  },
  {
    name: 'Sofia Kovac',
    program: 'MBA Global Business',
    status: 'Documents Pending',
    date: 'Oct 22, 2024',
  },
  {
    name: 'Rajesh Thapa',
    program: 'BSc Psychology',
    status: 'Contract Sent',
    date: 'Oct 21, 2024',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Agent Dashboard</h2>
        <p className="text-lg  max-w-2xl">
          Here is a summary of your global student recruitment performance and pending administrative tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <BluryCard
            key={index}
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            className="border-x border-white/40 p-2  shadow-none transition-all duration-300"
          >
            <div className="space-y-4">
              <div className={cn(stat.color, "border-x border-white/40 p-2 w-fit rounded-l-lg rounded-r-lg")}>
                <stat.icon className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium  capitalize tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          </BluryCard>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">Recent Applications</h3>
          <Button variant="link" className="text-purple-600 font-bold flex items-center gap-2 hover:gap-3 transition-all" asChild>
            <Link href="/dashboard/applications">
                View All Applications <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/30 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/20 bg-white/10">
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Student Name</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Program</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Agent Name</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Status</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Date</th>
                  <th className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {applications.map((app, index) => (
                  <tr key={index} className="hover:bg-white/10 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random`} alt={app.name} className="size-10 rounded-xl object-cover border-2 border-white/50 shadow-sm" />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1e3a8a]">{app.name}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">ID: SH-2024-{1000 + index}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-gray-900 leading-snug">{app.program}</span>
                        <span className="text-[11px] font-medium text-gray-500 mt-0.5">Fall 2024 Intake</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-[13px] font-medium text-gray-600">Horizon Global Education</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[9px] font-extrabold text-white tracking-widest min-w-[100px]",
                        app.status === 'Contract Sent' ? 'bg-[#eb4335]' : app.status === 'Created' ? 'bg-blue-500' : app.status === 'Documents Pending' ? 'bg-yellow-500' : 'bg-[#34a853]'
                      )}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-[13px] font-medium text-gray-600">{app.date}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <Button variant="outline" className="h-9 px-6 bg-white/20 border-white/40 text-[#1e3a8a] hover:bg-white/40 hover:text-[#1e3a8a] rounded-lg font-bold text-[12px] transition-all shadow-sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
            <div className="flex items-center text-[12px] font-medium text-gray-500 space-x-1">
              <span>Showing</span>
              <span className="font-bold text-[#1e3a8a]">4</span>
              <span>of</span>
              <span className="font-bold text-[#1e3a8a]">1,284</span>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="size-8 rounded-lg bg-white/40 hover:bg-white/60 flex items-center justify-center border border-white/40 transition-all text-gray-600 shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="size-8 rounded-lg bg-white/40 hover:bg-white/60 flex items-center justify-center border border-white/40 transition-all text-gray-600 shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

