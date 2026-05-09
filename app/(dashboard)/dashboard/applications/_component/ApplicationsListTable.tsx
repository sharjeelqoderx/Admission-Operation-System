import React from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export type ApplicationRow = {
    id: string
    application_no: string | null
    status: string
    created_at: string
    student: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null
    program: { id: string; name: string | null } | null
    agent: { id: string; name: string | null } | null
}

type Props = {
    applications: ApplicationRow[]
    isLoading: boolean
    isError: boolean
    onRetry: () => void
}

export const ApplicationsListTable = React.memo(function ApplicationsListTable({
    applications,
    isLoading,
    isError,
    onRetry,
}: Props) {
    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="size-8 text-[#9B51E0] animate-spin" />
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Loading applications...
                    </Typography>
                </div>
            </BluryCard>
        )
    }

    if (isError) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <div className="text-center">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            Failed to load applications
                        </Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-1">
                            Check your connection and try again.
                        </Typography>
                    </div>
                    <button
                        onClick={onRetry}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#9B51E0] text-white hover:bg-[#8a42cf] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </BluryCard>
        )
    }

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="p-0!"
            className="rounded-lg p-0"
        >
            <div className="overflow-x-auto">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader>
                        <TableRow className="border-b border-white/20 bg-white/10">
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Student Name
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Program
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Agent Name
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Date
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-white/10">
                        {applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-8 py-16 text-center">
                                    <Typography as="p" className="text-sm text-gray-500 font-medium">
                                        No applications found. Create your first application!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app) => {
                                const studentName = app.student?.name ?? "—"
                                const initials = studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                return (
                                    <TableRow key={app.id} className="hover:bg-white/10 transition-colors group">
                                        {/* Student Name */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50">
                                                    <AvatarImage
                                                        src={
                                                            app.student?.avatar_url ??
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`
                                                        }
                                                        alt={studentName}
                                                        className="rounded-xl"
                                                    />
                                                    <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <Typography as="span" className="text-sm font-bold text-gray-900">
                                                        {studentName}
                                                    </Typography>
                                                    {app.application_no && (
                                                        <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                            {app.application_no}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Program */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-bold text-gray-700">
                                                {app.program?.name ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        {/* Agent Name */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-light text-gray-600">
                                                {app.agent?.name ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <StatusBadge status={app.status} />
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {new Date(app.created_at).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </Typography>
                                        </TableCell>

                                        {/* Action */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                                disabled={!app.program?.id}
                                            >
                                                <Link href={app.program?.id ? `/dashboard/program/${app.program.id}` : "#"}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                    <Typography as="span" className="text-[12px] font-light text-gray-500">
                        Showing
                    </Typography>
                    <Typography as="span" className="text-[12px] font-bold text-gray-700 mx-1">
                        {applications.length}
                    </Typography>
                    <Typography as="span" className="text-[12px] font-light text-gray-500">
                        entries
                    </Typography>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button variant="outline" size="icon">
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
        </BluryCard>
    )
})
