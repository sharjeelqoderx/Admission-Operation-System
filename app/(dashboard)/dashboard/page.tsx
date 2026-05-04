import Link from 'next/link';
import { GraduationCap, FileText, ClipboardCheck, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BluryCard } from '@/components/shared/blury-card';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/shared/Typography';
import { ApplicationTable } from './_component/ApplicationTable';

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
        <Typography font='text-xl' as={'h2'}>
          Agent Dashboard
        </Typography>

        <Typography font='text' as={'p'} className='max-w-[660] text-gray-600 size-full'>
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
                <Typography font='sub-heading' as={'p'} className='font-bold'>
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
            <Link href="/dashboard/applications">
              View All Applications <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <ApplicationTable applications={applications} />
      </div>
    </div >
  );
}

