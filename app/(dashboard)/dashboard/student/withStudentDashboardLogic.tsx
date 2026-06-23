"use client"

import React, { useCallback, useRef, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { StudentDashboardPageData } from "@/lib/student/server"
import type { StudentListItem, StudentsListResult } from "@/lib/student/list"
import type { StudentDashboardStats } from "@/lib/student/list"

export type StudentDashboardViewProps = {
    initialData: StudentDashboardPageData
    stats: StudentDashboardStats
    statsLoading: boolean
    students: StudentListItem[]
    pagination?: StudentsListResult["pagination"]
    isLoading: boolean
    isError: boolean
    errorMessage: string
    handleSearch: (term: string) => void
    handleStatusChange: (value: string) => void
    handlePageChange: (page: number) => void
    handleDelete: (id: string, name: string) => Promise<void>
    deletingId: string | null
    q: string
    status: string
    refetch: () => void
}

export function withStudentDashboardLogic<T extends StudentDashboardViewProps>(
    Component: React.ComponentType<T>
) {
    return function WrappedComponent({
        initialData,
        ...props
    }: Pick<T, "initialData"> & Omit<T, keyof StudentDashboardViewProps | "initialData">) {
        const queryClient = useQueryClient()
        const [deletingId, setDeletingId] = useState<string | null>(null)

        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()
        const q = searchParams.get("q") || ""
        const status = searchParams.get("status") || "all"
        const page = searchParams.get("page") || "1"

        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        const matchesInitialQuery =
            q === initialData.query.q &&
            status === initialData.query.status &&
            page === initialData.query.page

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
                    updateParams({ q: term, page: "1" })
                }, 400)
            },
            [updateParams]
        )

        const handleStatusChange = useCallback(
            (value: string) => {
                updateParams({ status: value, page: "1" })
            },
            [updateParams]
        )

        const handlePageChange = useCallback(
            (newPage: number) => {
                updateParams({ page: newPage.toString() })
            },
            [updateParams]
        )

        const statsQuery = useQuery({
            queryKey: ["dashboard-stats"],
            queryFn: async () => {
                const res = await fetch("/api/dashboard/stats")
                if (!res.ok) throw new Error("Failed to fetch stats")
                const json = await res.json()
                return json.data as StudentDashboardStats
            },
            initialData: initialData.stats,
        })

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
                return res.json() as Promise<StudentsListResult>
            },
            initialData: matchesInitialQuery ? initialData.students : undefined,
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

        const handleDelete = useCallback(
            async (id: string, name: string) => {
                setDeletingId(id)
                const toastId = toast.loading(`Deleting ${name}...`)
                try {
                    await deleteStudent.mutateAsync(id)
                    toast.success(`${name} deleted successfully!`, { id: toastId })
                } catch (e) {
                    const message = e instanceof Error ? e.message : "Failed to delete student"
                    toast.error(message, { id: toastId })
                } finally {
                    setDeletingId(null)
                }
            },
            [deleteStudent]
        )

        const logicProps: StudentDashboardViewProps = {
            initialData,
            stats: statsQuery.data ?? initialData.stats,
            statsLoading: statsQuery.isLoading && !statsQuery.data,
            students: studentsQuery.data?.data ?? [],
            pagination: studentsQuery.data?.pagination,
            isLoading: studentsQuery.isLoading && !studentsQuery.data,
            isError: studentsQuery.isError,
            errorMessage:
                studentsQuery.error instanceof Error
                    ? studentsQuery.error.message
                    : "Failed to load students",
            handleSearch,
            handleStatusChange,
            handlePageChange,
            handleDelete,
            deletingId,
            q,
            status,
            refetch: studentsQuery.refetch,
        }

        return <Component {...(props as T)} {...logicProps} />
    }
}
