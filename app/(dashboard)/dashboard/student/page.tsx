"use client"
import Link from "next/link"
import {
    FileText,
    GraduationCap,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"

import { StudentTable } from "../_component/StudentTable"
import { useAuth } from "@/hooks/useAuth"
import { PageLoader } from "@/components/shared/page-loader"
import { BluryCard } from "@/components/shared/blury-card"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"

export default function Page() {
    const { me } = useAuth()
    const { data, isLoading, status } = me

    if (isLoading || status === "pending") {
        return <PageLoader label="Loading students..." />
    }

    const fullName = data?.fullName || "Benson Ronald"
    const role = data?.role || "AGENT"
    const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()


    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)


    const studentsQuery = useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const res = await fetch("/api/student")
            if (!res.ok) throw new Error("Failed to fetch students")
            const json = await res.json()
            return json.data
        },
    })

    const statsQuery = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/stats")
            if (!res.ok) throw new Error("Failed to fetch stats")
            const json = await res.json()
            return json.data as { total_students: number; active_applications: number; pending_actions: number }
        },
    })

    const totalStudents = useMemo(() => {
        if (Array.isArray(studentsQuery.data)) return studentsQuery.data.length
        return statsQuery.data?.total_students ?? 0
    }, [studentsQuery.data, statsQuery.data])

    const activeApplications = statsQuery.data?.active_applications ?? 0

    const deleteStudent = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/student/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to delete student")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] })
        },
    })

    // ✅ handler
    const handleDelete = async (id: string, name: string) => {
        setDeletingId(id)
        try {
            await deleteStudent.mutateAsync(id)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <main className="relative overflow-x-hidden">

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-12"
            >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1 max-w-2xl">
                        <Typography font='text-xl' as={'h2'}>
                            All students
                        </Typography>
                        <Typography as="p" font="text" className="text-gray-600">
                            Initiate a new student profile and link them to global academic programs. Ensure all mandatory fields are verified before submission.
                        </Typography>
                    </div>
                    <Link href="/dashboard/student/new">
                        <Button className="bg-brand-byzantine hover:bg-brand-byzantine/80 text-white px-6 h-11 rounded-md shrink-0 shadow-md">
                            <Plus className="size-4 mr-2" />
                            <Typography as="span" className="text-inherit font-medium">Add Student</Typography>
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
                                className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${studentsQuery.isLoading ? 'animate-pulse text-gray-300' : ''}`}
                            >
                                {studentsQuery.isLoading ? '—' : totalStudents.toLocaleString()}
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
                                className={`text-[34px] font-extrabold text-gray-900 leading-none mt-1 ${statsQuery.isLoading ? 'animate-pulse text-gray-300' : ''}`}
                            >
                                {statsQuery.isLoading ? '—' : activeApplications.toLocaleString()}
                            </Typography>
                        </div>
                    </div>
                </div>
            </BluryCard>

            <StudentTable
                students={studentsQuery.data || []}
                isLoading={studentsQuery.isLoading}
                isError={studentsQuery.isError}
                onDelete={handleDelete}
                onRetry={studentsQuery.refetch}
                deletingId={deletingId}
            />

        </main>
    )
}