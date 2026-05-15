"use client"

import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { GraduationCap, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { ApplicationsListTable, type ApplicationRow } from "./_component/ApplicationsListTable"
import { BluryCard } from "@/components/shared/blury-card"

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
        <div className="space-y-12">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All Applications
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Track and manage all student applications submitted through your agency.
                    </Typography>
                </div>
                <Link href="/dashboard/application/new">
                    <Button className="px-6 gap-2 font-normal">
                        <Plus size={24} className="text-white" /> New Application
                    </Button>
                </Link>
            </div>


            {/* ── Stats ── */}
            <div className="flex flex-col sm:flex-row gap-12 py-2">
                <div className="flex items-center gap-4">
                    <BluryCard
                        isCentered={false}
                        sharpCorners={[]}
                        blurAmount="backdrop-blur-2xl"
                        className="p-4"
                        childClass="md:p-0"
                    >
                        <GraduationCap className="size-6 text-gray-700" />
                    </BluryCard>
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
                    <BluryCard
                        isCentered={false}
                        sharpCorners={[]}
                        blurAmount="backdrop-blur-2xl"
                        className="p-4"
                        childClass="md:p-0"
                    >
                        <FileText className="size-6 text-gray-700" />
                    </BluryCard>
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
