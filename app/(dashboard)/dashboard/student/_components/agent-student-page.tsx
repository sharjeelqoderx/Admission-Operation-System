"use client"

import Link from "next/link"
import {
    FileText,
    GraduationCap,
    Plus,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { Input } from "@/components/ui/input"
import { StudentTable } from "../../_components/StudentTable"
import { ListPageSkeleton } from "@/components/shared/page-skeleton"
import { BluryCard } from "@/components/shared/blury-card"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useState, useRef, memo } from "react"

const StatsDashboard = memo(({ stats, statsLoading }: { stats: any, statsLoading: boolean }) => {
    const totalStudents = stats?.total_students ?? 0
    const activeApplications = stats?.active_applications ?? 0

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="space-y-12"
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All students
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                    </Typography>
                </div>
                <Link href="/dashboard/student/new">
                    <Button className="px-6 gap-2 font-normal">
                        <Plus size={24} className="text-white" /> New Student
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="flex items-center gap-6">
                    <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                        <GraduationCap className="size-7 text-gray-800" />
                    </div>
                    <div className="flex flex-col">
                        <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Total Students
                        </Typography>
                        <Typography
                            as="span"
                            className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${statsLoading ? 'animate-pulse text-gray-300' : ''}`}
                        >
                            {statsLoading ? '—' : totalStudents.toLocaleString()}
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="size-14 border-x border-white/40 rounded-l-lg rounded-r-lg bg-white/20 flex items-center justify-center">
                        <FileText className="size-7 text-gray-800" />
                    </div>
                    <div className="flex flex-col">
                        <Typography as="span" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Active Applications
                        </Typography>
                        <Typography
                            as="span"
                            className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${statsLoading ? 'animate-pulse text-gray-300' : ''}`}
                        >
                            {statsLoading ? '—' : activeApplications.toLocaleString()}
                        </Typography>
                    </div>
                </div>
            </div>
        </BluryCard>
    )
})

StatsDashboard.displayName = "StatsDashboard"

function StudentListSection() {
    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const q = searchParams.get("q") || ""
    const status = searchParams.get("status") || "all"
    const page = searchParams.get("page") || "1"

    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(window.location.search)
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== "all") {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleSearch = (term: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            updateParams({ q: term, page: "1" }) // Reset to page 1 on search
        }, 400)
    }

    const handleStatusChange = (value: string) => {
        updateParams({ status: value, page: "1" }) // Reset to page 1 on status change
    }

    const handlePageChange = (newPage: number) => {
        updateParams({ page: newPage.toString() })
    }

    const studentsQuery = useQuery({
        queryKey: ["students", q, status, page],
        queryFn: async () => {
            const url = new URL("/api/student", window.location.origin)
            if (q) url.searchParams.set("q", q)
            if (status !== "all") url.searchParams.set("status", status)
            if (page) url.searchParams.set("page", page)
            url.searchParams.set("limit", "10")

            const res = await fetch(url.toString())
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to fetch students")
            }
            const json = await res.json()
            return json // Return { data, pagination }
        },
        retry: false,
    })

    const deleteStudent = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/student/${id}`, { method: "DELETE" })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to delete student")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        },
    })

    const handleDelete = async (id: string, name: string) => {
        setDeletingId(id)
        const toastId = toast.loading(`Deleting ${name}...`)
        try {
            await deleteStudent.mutateAsync(id)
            toast.success(`${name} deleted successfully!`, { id: toastId })
        } catch (e: any) {
            toast.error(e.message || "Failed to delete student", { id: toastId })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-4 pt-8">
            <Typography as="h3" font="text-xl" className="text-brand-secondary">
                Students list
            </Typography>


            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 ps-1">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        key={q}
                        type="text"
                        placeholder="Enter to search"
                        className="w-full backdrop-blur-md ps-8"
                        defaultValue={q}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Status filter — hidden for now
                <div className="relative w-full sm:w-64">
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                */}
            </div>

            {/* Tabs */}
            {/* <div className="flex items-center gap-2 pt-2">
                <button className="px-5 py-1.5 rounded-full bg-brand-secondary text-white text-xs font-medium shadow-sm">
                    All Students
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium hover:bg-brand-secondary">
                    Program
                </button>
                <button className="px-5 py-1.5 rounded-full bg-[#8ba4d5] text-white text-xs font-medium hover:bg-brand-secondary">
                    Country
                </button>
            </div> */}

            <StudentTable
                students={studentsQuery.data?.data || []}
                pagination={studentsQuery.data?.pagination}
                isLoading={studentsQuery.isLoading}
                isError={studentsQuery.isError}
                errorMessage={studentsQuery.error instanceof Error ? studentsQuery.error.message : "Failed to load students"}
                onDelete={handleDelete}
                onRetry={studentsQuery.refetch}
                onPageChange={handlePageChange}
                deletingId={deletingId}
            />
        </div>
    )
}

export function AgentStudentPage() {
    const { me } = useAuth()

    const statsQuery = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/stats")
            if (!res.ok) throw new Error("Failed to fetch stats")
            const json = await res.json()
            return json.data as { total_students: number; active_applications: number; pending_actions: number }
        },
    })

    if (me.isLoading) {
        return <ListPageSkeleton />
    }

    return (
        <main className="relative">
            <div className="max-w-[1400px] mx-auto">
                <StatsDashboard
                    stats={statsQuery.data}
                    statsLoading={statsQuery.isLoading}
                />
            </div>
            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
                <StudentListSection />
            </div>
        </main>
    )
}