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
    initials: 'AM',
    program: 'MSc Data Science',
    status: 'Contract Sent',
    date: 'Oct 24, 2024',
  },
  {
    name: 'Julian Lee',
    initials: 'JL',
    program: 'BEng Mechanical',
    status: 'Created',
    date: 'Oct 23, 2024',
  },
  {
    name: 'Sofia Kovac',
    initials: 'SK',
    program: 'MBA Global Business',
    status: 'Documents Pending',
    date: 'Oct 22, 2024',
  },
  {
    name: 'Rajesh Thapa',
    initials: 'RT',
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

        <BluryCard
          isCentered={false}
          blurAmount="backdrop-blur-xl"
          blendColorClass="bg-white/10"
          className="border border-white/40 shadow-none p-0 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/20">
                  <th className="px-8 py-6 text-left text-xs font-bold capitalize text-[18px] tracking-wider">Student Name</th>
                  <th className="px-8 py-6 text-left text-xs font-bold capitalize text-[18px] tracking-wider">Program</th>
                  <th className="px-8 py-6 text-left text-xs font-bold capitalize text-[18px] tracking-wider">Status</th>
                  <th className="px-8 py-6 text-left text-xs font-bold capitalize text-[18px] tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/10">
                {applications.map((app, index) => (
                  <tr key={index} className="hover:bg-white/10 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100/50 flex items-center justify-center text-purple-700 font-bold text-xs">
                          {app.initials}
                        </div>
                        <div className="text-sm font-bold text-gray-800">{app.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">{app.program}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-100/30 text-gray-600 border border-white/20">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{app.date}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-6 border-t border-gray-100/20 flex items-center justify-between bg-white/5">
            <p className="text-sm text-gray-500">Showing <span className="font-bold">4</span> of <span className="font-bold">1,284</span> entries</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg bg-white/20 border-white/40 hover:bg-white/40">
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </Button>
              <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg bg-white/20 border-white/40 hover:bg-white/40">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </BluryCard>
      </div>
    </div>
  );
}

