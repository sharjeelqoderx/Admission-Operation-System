"use client"

import { memo } from "react"
import Link from "next/link"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Typography } from "@/components/shared/Typography"
import { AgentKycBadge } from "@/components/shared/agent-kyc-badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { UniversityAgentListItem } from "@/types/schemas/university-agent"

type UniversityAgentListTableProps = {
    agents: UniversityAgentListItem[]
    pagination?: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    isLoading?: boolean
    statusValue: string
    activeTab: string
    onStatusChange: (value: string) => void
    onTabChange: (value: string) => void
    onPageChange: (page: number) => void
}

const tabs = ["University Partners", "Country", "KYC Status", "Students Count"]

export const UniversityAgentListTable = memo(function UniversityAgentListTable({
    agents,
    pagination,
    isLoading = false,
    statusValue,
    activeTab,
    onStatusChange,
    onTabChange,
    onPageChange,
}: UniversityAgentListTableProps) {
    const showingCount = agents.length
    const totalCount = pagination?.total ?? showingCount

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => onTabChange(tab)}
                                className={
                                    isActive
                                        ? "rounded-full bg-brand-secondary px-5 py-2 text-xs font-semibold text-white"
                                        : "rounded-full bg-[#8ba4d5]/35 px-5 py-2 text-xs font-semibold text-brand-primary"
                                }
                            >
                                {tab}
                            </button>
                        )
                    })}
                </div>

                <Select value={statusValue} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-11 w-full border-none bg-white shadow-sm ring-1 ring-black/5 lg:w-56">
                        <SelectValue placeholder="KYC Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under-review">Under Review</SelectItem>
                        <SelectItem value="resubmission">Resubmission</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-black/5">
                <div className="overflow-x-auto">
                    <Table className="min-w-[980px]">
                        <TableHeader>
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                {[
                                    "Agency Name",
                                    "Country",
                                    "KYC Status",
                                    "Students Count",
                                    "Action",
                                ].map((heading) => (
                                    <TableHead key={heading} className="px-6 py-5">
                                        <Typography
                                            as="span"
                                            font="small"
                                            className="uppercase tracking-[0.12em] text-gray-500"
                                        >
                                            {heading}
                                        </Typography>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-6 py-12 text-center">
                                        <Typography as="span" font="sub-text" className="text-gray-500">
                                            Loading university partners...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : agents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-6 py-12 text-center">
                                        <Typography as="span" font="sub-text" className="text-gray-500">
                                            No university partners found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                agents.map((agent) => (
                                    <TableRow key={agent.profile_id} className="border-b border-gray-50">
                                        <TableCell className="px-6 py-5">
                                            <Typography as="p" font="text" className="font-semibold text-brand-primary">
                                                {agent.agency_name}
                                            </Typography>
                                            <Typography as="p" font="sub-text" className="text-gray-500">
                                                ID: {agent.display_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Typography as="span" font="sub-text" className="text-gray-700">
                                                {agent.country ?? "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <AgentKycBadge status={agent.kyc_status} />
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Typography as="span" font="sub-text" className="font-semibold text-brand-primary">
                                                {agent.students_count.toString().padStart(2, "0")}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <Link
                                                    href={`/dashboard/agent/${agent.profile_id}`}
                                                    className="hover:text-brand-blue"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <button type="button" className="cursor-not-allowed opacity-40">
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button type="button" className="cursor-not-allowed opacity-40">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                    <Typography as="span" font="sub-text" className="text-gray-500">
                        Showing {showingCount} of {totalCount.toLocaleString()} entries
                    </Typography>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!pagination || pagination.page <= 1}
                            onClick={() => pagination && onPageChange(pagination.page - 1)}
                            className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            disabled={!pagination || pagination.page >= pagination.totalPages}
                            onClick={() => pagination && onPageChange(pagination.page + 1)}
                            className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    )
})
