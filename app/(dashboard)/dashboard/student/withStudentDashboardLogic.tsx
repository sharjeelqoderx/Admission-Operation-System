"use client"

import React, { useState, useMemo, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"

export interface StudentDashboardProps {
    students: any[]
    isLoading: boolean
    isError: boolean
    stats: {
        total_students: number
        active_applications: number
        pending_actions: number
    } | null
    statsLoading: boolean
    handleSearch: (term: string) => void
    handleDelete: (id: string, name: string) => Promise<void>
    deletingId: string | null
    q: string
    refetch: () => void
    me: any
}

export function withStudentDashboardLogic<T extends StudentDashboardProps>(
    Component: React.ComponentType<T>
) {
    return function WrappedComponent(props: any) {
        const { me } = useAuth()
        const queryClient = useQueryClient()
        const [deletingId, setDeletingId] = useState<string | null>(null)

        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()
        const q = searchParams.get("q") || ""

        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        const handleSearch = (term: string) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                const params = new URLSearchParams(searchParams.toString())
                if (term) {
                    params.set("q", term)
                } else {
                    params.delete("q")
                }
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }, 400)
        }

        const studentsQuery = useQuery({
            queryKey: ["students", q],
            queryFn: async () => {
                const url = new URL("/api/student", window.location.origin)
                if (q) url.searchParams.set("q", q)
                const res = await fetch(url.toString())
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
                return json.data
            },
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
            try {
                await deleteStudent.mutateAsync(id)
            } finally {
                setDeletingId(null)
            }
        }

        const logicProps: StudentDashboardProps = {
            students: studentsQuery.data || [],
            isLoading: studentsQuery.isLoading,
            isError: studentsQuery.isError,
            stats: statsQuery.data || null,
            statsLoading: statsQuery.isLoading,
            handleSearch,
            handleDelete,
            deletingId,
            q,
            refetch: studentsQuery.refetch,
            me: me.data
        }

        return <Component {...(props as any)} {...logicProps} />
    }
}
