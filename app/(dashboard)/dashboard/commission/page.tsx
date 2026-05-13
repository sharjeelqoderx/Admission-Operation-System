"use client"

import React from "react"
import { Eye, FileText, Download, Filter, Search, TrendingUp } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BluryCard } from "@/components/shared/blury-card"
import { cn } from "@/lib/utils"

const MOCK_COMMISSIONS = [
    { id: "COM-001", program: "Computer Science (B.Sc)", amount: "$1,250", status: "PAID", date: "May 12, 2024" },
    { id: "COM-002", program: "Business Administration", amount: "$820", status: "PENDING", date: "May 10, 2024" },
    { id: "COM-003", program: "Mechanical Engineering", amount: "$1,500", status: "PAID", date: "May 08, 2024" },
    { id: "COM-004", program: "Digital Marketing", amount: "$450", status: "PAID", date: "May 05, 2024" },
    { id: "COM-005", program: "Data Science Masters", amount: "$1,800", status: "PENDING", date: "May 01, 2024" },
]

export default function CommissionsPage() {
    return (
        <main className="space-y-8">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-12"
            >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1 max-w-2xl">
                        <Typography font='text-xl' as={'h2'}>
                            Commission History
                        </Typography>
                        <Typography as="p" font="text" className="text-gray-600">
                            Track and manage your earned commissions from student enrollments. All projections are subject to final university verification.
                        </Typography>
                    </div>
                    {/* <Button variant="outline" className="rounded-xl border-white/40 bg-white/20 hover:bg-white/30 gap-2 h-11 px-6 shadow-md backdrop-blur-md transition-all">
                        <Download size={18} />
                        Report
                    </Button> */}
                </div>

                {/* <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="flex items-center gap-6">
                        <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                            <TrendingUp className="size-7 text-gray-800" />
                        </div>
                        <div className="flex flex-col">
                            <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                Paid Commission
                            </Typography>
                            <Typography as="span" className="text-[34px] font-extrabold text-gray-900 leading-none mt-1">
                                $3,200
                            </Typography>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                            <FileText className="size-7 text-gray-800" />
                        </div>
                        <div className="flex flex-col">
                            <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                Pending
                            </Typography>
                            <Typography as="span" className="text-[34px] font-extrabold text-gray-900 leading-none mt-1">
                                $2,620
                            </Typography>
                        </div>
                    </div>
                </div> */}
            </BluryCard>

            <div className="space-y-4">
                {/* <Typography as="h3" className="text-xl font-bold text-brand-secondary">
                    Commission list
                </Typography> */}

                {/* Search + Filters */}
                {/* <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by invoice or program..."
                            className="w-full backdrop-blur-md ps-8 h-11 bg-white/50 border-white/20"
                        />
                    </div>

                    <Button variant="outline" className="h-11 px-6 rounded-md gap-2 font-medium backdrop-blur-md bg-white/50 border-white/20">
                        <Filter size={18} />
                        Filters
                    </Button>
                </div> */}

                {/* Table Section */}
                <BluryCard
                    isCentered={false}
                    blurAmount="backdrop-blur-lg"
                    blendColorClass="bg-white/10"
                    childClass='p-0!'
                    className='rounded-lg p-0'
                >
                    <Table className="w-full text-left border-collapse min-w-[900px]">
                        <TableHeader>
                            <TableRow className="border-b border-white/20 bg-white/30 hover:bg-white/30">
                                <TableHead className="px-6 py-5 font-bold text-gray-900">Invoice</TableHead>
                                <TableHead className="px-6 py-5 font-bold text-gray-900">Program</TableHead>
                                <TableHead className="px-6 py-5 font-bold text-gray-900">Amount</TableHead>
                                <TableHead className="px-6 py-5 font-bold text-gray-900">Status</TableHead>
                                <TableHead className="px-6 py-5 font-bold text-gray-900">Payment Date</TableHead>
                                <TableHead className="px-6 py-5 font-bold text-gray-900 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_COMMISSIONS.map((comm) => (
                                <TableRow key={comm.id} className="hover:bg-white/10 transition-colors border-white/5">
                                    <TableCell className="px-6 py-5 font-medium text-brand-byzantine">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            {comm.id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-gray-600 font-medium">{comm.program}</TableCell>
                                    <TableCell className="px-6 py-5 text-gray-900 font-bold">{comm.amount}</TableCell>
                                    <TableCell className="px-6 py-5">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-lg px-3 py-1 font-bold border-none",
                                                comm.status === "PAID" ? "bg-green-500/10 text-green-700" :
                                                    "bg-amber-500/10 text-amber-700"
                                            )}
                                        >
                                            {comm.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-gray-500 font-medium">{comm.date}</TableCell>
                                    <TableCell className="px-6 py-5 text-right">
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-brand-byzantine hover:bg-white/20 rounded-xl transition-all">
                                            <Eye size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </BluryCard>
            </div>
        </main>
    )
}
