"use client"

import { useCallback, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { GraduationCap, FileText, RotateCcw, Search, CheckCircle2 } from "lucide-react"
import { ApplicationsListTable } from "@/app/(dashboard)/dashboard/application/_component/ApplicationsListTable"
import { BluryCard } from "@/components/shared/blury-card"
import { DatePicker } from "@/components/shared/date-picker"
import { useAuth } from "@/hooks/useAuth"
import { useDegrees, formatDegreeLabel } from "@/hooks/useDegrees"
import type { ApplicationListStats } from "@/types/schemas/application"

export default function AllApplicationViewPage() {
    const { me } = useAuth()
    const role = me.data?.role

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "all"
    const degreeId = searchParams.get("degree_id") || "all"
    const dateFrom = searchParams.get("date_from") || ""
    const dateTo = searchParams.get("date_to") || ""

    const { data: degrees = [], isLoading: degreesLoading } = useDegrees()

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString())
            Object.entries(updates).forEach(([key, value]) => {
                if (value && value !== "all") {
                    params.set(key, value)
                } else {
                    params.delete(key)
                }
            })
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        },
        [pathname, router, searchParams]
    )

    const handleSearch = useCallback(
        (term: string) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                updateParams({ q: term })
            }, 400)
        },
        [updateParams]
    )

    const { data: response, isLoading, isError, refetch } = useQuery({
        queryKey: ["applications", "all", q, status, degreeId, dateFrom, dateTo],
        queryFn: async () => {
            const url = new URL("/api/application", window.location.origin)
            url.searchParams.set("scope", "all")
            if (q) url.searchParams.set("q", q)
            if (status !== "all") url.searchParams.set("status", status)
            if (degreeId !== "all") url.searchParams.set("degree_id", degreeId)
            if (dateFrom) url.searchParams.set("date_from", dateFrom)
            if (dateTo) url.searchParams.set("date_to", dateTo)

            const res = await fetch(url.toString())
            if (!res.ok) throw new Error("Failed to fetch applications")
            const json = await res.json()
            return json
        },
    })

    const applications = useMemo(() => {
        const rows = Array.isArray(response?.data) ? response.data : []
        return [...rows].sort((a, b) => {
            const nameA = (a.student?.name ?? "").trim().toLowerCase()
            const nameB = (b.student?.name ?? "").trim().toLowerCase()
            return nameA.localeCompare(nameB)
        })
    }, [response])

    const stats = useMemo<ApplicationListStats>(
        () =>
            response?.stats ?? {
                total: 0,
                pending: 0,
                accepted: 0,
            },
        [response]
    )

    const hasActiveFilters = useMemo(
        () =>
            Boolean(q) ||
            status !== "all" ||
            degreeId !== "all" ||
            Boolean(dateFrom) ||
            Boolean(dateTo),
        [q, status, degreeId, dateFrom, dateTo]
    )

    const handleResetFilters = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        router.replace(pathname, { scroll: false })
    }, [pathname, router])

    const handleRetry = useCallback(() => {
        refetch()
    }, [refetch])

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All Application View
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Browse every student application in the system and create offers from your saved templates.
                    </Typography>
                </div>
            </div>

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
                            {isLoading ? "—" : stats.total}
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
                            {isLoading ? "—" : stats.pending}
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
                        <CheckCircle2 className="size-6 text-gray-700" />
                    </BluryCard>
                    <div>
                        <Typography as="p" className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                            Accepted
                        </Typography>
                        <Typography as="p" className="text-[28px] font-extrabold text-gray-900 leading-none">
                            {isLoading ? "—" : stats.accepted}
                        </Typography>
                    </div>
                </div>
            </div>

            <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-1">
                {role !== "STUDENT" && (
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            key={q}
                            type="text"
                            placeholder="Search student name or email"
                            className="w-full backdrop-blur-md ps-9"
                            defaultValue={q}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                )}

                <Select value={status} onValueChange={(value) => updateParams({ status: value })}>
                    <SelectTrigger className="w-[160px] shrink-0">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="NEEDS_REVISION">Needs revision</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={degreeId}
                    onValueChange={(value) => updateParams({ degree_id: value })}
                    disabled={degreesLoading}
                >
                    <SelectTrigger className="w-[200px] shrink-0">
                        <SelectValue placeholder={degreesLoading ? "Loading..." : "Degree"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All degrees</SelectItem>
                        {degrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                                {formatDegreeLabel(degree)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DatePicker
                    value={dateFrom}
                    onChange={(value) => updateParams({ date_from: value })}
                    placeholder="From date"
                    className="w-[160px] shrink-0 h-10 text-xs"
                />

                <DatePicker
                    value={dateTo}
                    onChange={(value) => updateParams({ date_to: value })}
                    placeholder="To date"
                    className="w-[160px] shrink-0 h-10 text-xs"
                />

                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="shrink-0 h-10 gap-2 border-white/40 bg-white/20 hover:bg-white/40"
                    >
                        <RotateCcw className="size-4" />
                        Reset
                    </Button>
                )}
            </div>

            <ApplicationsListTable
                applications={applications}
                role={role ?? response?.role}
                isLoading={isLoading}
                isError={isError}
                onRetry={handleRetry}
                viewBasePath="/dashboard/all-application-view"
            />
        </div>
    )
}
