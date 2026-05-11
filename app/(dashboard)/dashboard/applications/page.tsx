"use client"

import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { GraduationCap, FileText } from "lucide-react"
import Link from "next/link"
import { ApplicationsListTable, type ApplicationRow } from "./_component/ApplicationsListTable"

export default function ApplicationsPage() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["applications"],
        queryFn: async () => {
            const res = await fetch("/api/application")
            if (!res.ok) throw new Error("Failed to fetch applications")
            const json = await res.json()
            return json.data as ApplicationRow[]
        },
    })

    const applications = useMemo(
        () => (Array.isArray(data) ? data : []),
        [data]
    )

    const handleRetry = useCallback(() => { refetch() }, [refetch])

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 px-6 lg:px-12 pt-4">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                    <Typography as="h1" className="text-[32px] font-extrabold text-gray-900 tracking-tight">
                        All Applications
                    </Typography>
                    <Typography as="p" className="text-[14px] font-medium text-gray-500 leading-relaxed">
                        Track and manage all student applications submitted through your agency.
                    </Typography>
                </div>
                <Link href="/dashboard/applications/new">
                    <Button className="px-8">
                        + New Application
                    </Button>
                </Link>
            </div>

            <div className="h-px bg-gray-200/60 w-full" />

            {/* ── Stats ── */}
            <div className="flex flex-col sm:flex-row gap-12 py-2">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-sm">
                        <GraduationCap className="size-6 text-gray-700" />
                    </div>
                    <div>
                        <Typography as="p" className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            Total Applications
                        </Typography>
                        <Typography as="p" className="text-[28px] font-extrabold text-gray-900 leading-none">
                            {isLoading ? "—" : applications.length}
                        </Typography>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/40 flex items-center justify-center border border-white/60 shadow-sm">
                        <FileText className="size-6 text-gray-700" />
                    </div>
                    <div>
                        <Typography as="p" className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            Pending
                        </Typography>
                        <Typography as="p" className="text-[28px] font-extrabold text-gray-900 leading-none">
                            {isLoading ? "—" : applications.filter((a) => a.status === "PENDING").length}
                        </Typography>
                    </div>
                </div>
            </div>

            <ApplicationsListTable
                applications={applications}
                isLoading={isLoading}
                isError={isError}
                onRetry={handleRetry}
            />
        </div>
    )
}
