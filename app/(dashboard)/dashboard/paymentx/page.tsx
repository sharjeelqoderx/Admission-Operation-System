"use client"

import React from "react"
import { Eye, FileText, Download, Filter, Search } from "lucide-react"
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

const MOCK_PAYMENTS = [
    { id: "INV-001", program: "Computer Science (B.Sc)", amount: "$12,500", status: "PAID", date: "May 12, 2024" },
    { id: "INV-002", program: "Business Administration", amount: "$8,200", status: "PENDING", date: "May 10, 2024" },
    { id: "INV-003", program: "Mechanical Engineering", amount: "$15,000", status: "PAID", date: "May 08, 2024" },
    { id: "INV-004", program: "Digital Marketing", amount: "$4,500", status: "FAILED", date: "May 05, 2024" },
    { id: "INV-005", program: "Data Science Masters", amount: "$18,000", status: "PAID", date: "May 01, 2024" },
]

export default function PaymentsPage() {
    return (
        <main className="space-y-8">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1 max-w-2xl">
                        <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                            Payments & Invoices
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                            View and manage your student payment history and invoices. Ensure all financial records are up to date for smooth application processing.
                        </Typography>
                    </div>
                    {/* <Button variant="outline" className="rounded-xl border-white/40 bg-white/20 hover:bg-white/30 gap-2 h-11 px-6 shadow-md backdrop-blur-md transition-all">
                        <Download size={18} />
                        Export PDF
                    </Button> */}
                </div>

                {/* <div className="flex flex-col md:flex-row items-center gap-16 pt-4">
                    <div className="flex items-center gap-6">
                        <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                            <FileText className="size-7 text-gray-800" />
                        </div>
                        <div className="flex flex-col">
                            <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                Total Paid
                            </Typography>
                            <Typography as="span" className="text-[34px] font-extrabold text-gray-900 leading-none mt-1">
                                $45,500
                            </Typography>
                        </div>
                    </div>
                </div> */}
            </BluryCard>

            <div className="space-y-4">
                {/* <Typography as="h3" className="text-xl font-bold text-brand-secondary">
                    Transaction History
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
                            {MOCK_PAYMENTS.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-white/10 transition-colors border-white/5">
                                    <TableCell className="px-6 py-5 font-medium text-brand-byzantine">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            {payment.id}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-gray-600 font-medium">{payment.program}</TableCell>
                                    <TableCell className="px-6 py-5 text-gray-900 font-bold">{payment.amount}</TableCell>
                                    <TableCell className="px-6 py-5">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-lg px-3 py-1 font-bold border-none",
                                                payment.status === "PAID" ? "bg-green-500/10 text-green-700" :
                                                    payment.status === "PENDING" ? "bg-amber-500/10 text-amber-700" :
                                                        "bg-red-500/10 text-red-700"
                                            )}
                                        >
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-gray-500 font-medium">{payment.date}</TableCell>
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
