import React from "react"
import Link from "next/link"
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
import { Typography } from "@/components/shared/Typography"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Loader2 } from "lucide-react"

export type ApplicationRow = {
    id: string
    application_no: string | null
    status: string
    created_at: string
    student: { id: string; name: string | null; avatar_url: string | null } | null
    program: { id: string; name: string | null } | null
    agent: { id: string; name: string | null } | null
}

type Props = {
    applications: ApplicationRow[]
    isLoading?: boolean
}

export const ApplicationTable = React.memo(function ApplicationTable({ applications, isLoading }: Props) {
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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-8 py-12 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="size-5 text-[#9B51E0] animate-spin" />
                                        <Typography as="span" className="text-sm text-gray-400">Loading...</Typography>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-8 py-12 text-center">
                                    <Typography as="p" className="text-sm text-gray-500">No recent applications found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app, index) => {
                                const studentName = app.student?.name ?? "—"
                                const initials = studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

                                return (
                                    <TableRow key={app.id} className="hover:bg-white/10 transition-colors group">
                                        {/* Student Name */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50 after:rounded-xl after:border-none">
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
                                                    <Typography font="sub-text" as="span" className="font-bold text-blue-text">{studentName}</Typography>
                                                    <Typography font="small" as="span" className="text-gray-600 font-light">
                                                        {app.application_no ?? `ID: SH-${1000 + index}`}
                                                    </Typography>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Program */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography font="sub-text" as="span" className="font-bold text-blue-text">
                                                {app.program?.name ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        {/* Agent Name */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography font="sub-text" as="span" className="font-light text-gray-600">
                                                {app.agent?.name ?? "—"}
                                            </Typography>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <StatusBadge status={app.status} />
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography font="sub-text" as="span" className="font-medium text-gray-600">
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
                                                className="h-9 px-6"
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

            <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                    <Typography as="span" className="text-[12px] font-light text-gray-500">Showing</Typography>
                    <Typography as="span" className="text-[12px] font-medium text-brand-secondary mx-1">{applications.length}</Typography>
                    <Typography as="span" className="text-[12px] font-light text-gray-500">recent entries</Typography>
                </div>
            </div>
        </BluryCard>
    )
})