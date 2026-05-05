import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { StatusBadge } from "@/components/shared/StatusBadge"

export const ApplicationTable = ({ applications }: any) => {
    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass='p-0!'
            className='rounded-lg p-0'
        >
            <div className="overflow-x-auto">
                <Table className="w-full text-left border-collapse min-w-[900px]">

                    <TableHeader>
                        <TableRow className="border-b border-white/20 bg-white/10">
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Student Name</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Program</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Agent Name</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Status</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Date</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-white/10">
                        {applications.map((app: any, index: any) => (
                            <TableRow key={index} className="hover:bg-white/10 transition-colors group">
                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-4">

                                        <Avatar className="size-10 rounded-xl border-2 border-white/50 after:rounded-xl after:border-none">
                                            <AvatarImage
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random`}
                                                alt={app.name}
                                                className="rounded-xl"
                                            />
                                            <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                {app.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col">
                                            <Typography font="sub-text" as={'span'} className="font-bold text-blue-text">{app.name}</Typography>
                                            <Typography font="small" as={'span'} className="text-gray-600 font-light">ID: SH-2024-{1000 + index}</Typography>
                                        </div>

                                    </div>
                                </TableCell>

                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <Typography font="sub-text" as={'span'} className="font-bold text-blue-text">{app.program}</Typography>
                                        <Typography font="small" as={'span'} className="text-gray-600 font-light">Fall 2024 Intake</Typography>
                                    </div>
                                </TableCell>

                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <Typography font="sub-text" as={'span'} className="font-light text-gray-600">Horizon Global Education</Typography>
                                </TableCell>

                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <StatusBadge status={app.status} />
                                </TableCell>

                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <Typography font="sub-text" as={'span'} className="font-medium text-gray-600">{app.date}</Typography>
                                </TableCell>

                                <TableCell className="px-8 py-6 whitespace-nowrap">
                                    <Button
                                        variant="outline"
                                        className="h-9 px-6"
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                    <span>Showing</span>
                    <span className="text-brand-secondary font-medium">4</span>
                    <span>of</span>
                    <span className="text-brand-secondary font-medium">1,284</span>
                    <span>entries</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant={'outline'} size={'icon'}>
                        <ChevronLeft size={24} />
                    </Button>
                    <Button variant={'outline'} size={'icon'}>
                        <ChevronRight size={24} />
                    </Button>
                </div>
            </div>
        </BluryCard>
    )
}