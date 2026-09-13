"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { UniversityStudentListResponse } from "@/types/schemas/university-student"

export type UniversityStudentPageLogicProps = {
    overview: UniversityStudentListResponse
    searchValue: string
    statusValue: string
    isLoading: boolean
    isFetching: boolean
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onPageChange: (page: number) => void
}

async function fetchUniversityStudents(params: {
    q?: string
    status?: string
    page?: string
}) {
    const url = new URL("/api/university/students", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.status && params.status !== "all") {
        url.searchParams.set("status", params.status)
    }
    if (params.page) url.searchParams.set("page", params.page)
    url.searchParams.set("limit", "10")

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch students")
    }
    return json.data as UniversityStudentListResponse
}

export function withUniversityStudentPageLogic(
    Component: ComponentType<UniversityStudentPageLogicProps>
) {
    return function UniversityStudentPageContainer({
        initialOverview,
    }: {
        initialOverview: UniversityStudentListResponse
    }) {
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()

        const q = searchParams.get("q") ?? ""
        const status = searchParams.get("status") ?? "all"
        const page = searchParams.get("page") ?? "1"
        const [searchInput, setSearchInput] = useState(q)
        const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
        const initialQueryRef = useRef<{ q: string; status: string; page: string } | null>(null)

        if (initialQueryRef.current === null) {
            initialQueryRef.current = { q, status, page }
        }

        useEffect(() => {
            setSearchInput(q)
        }, [q])

        const matchesInitialQuery =
            q === initialQueryRef.current.q &&
            status === initialQueryRef.current.status &&
            page === initialQueryRef.current.page

        const studentsQuery = useQuery({
            queryKey: ["university-students", q, status, page],
            queryFn: () => fetchUniversityStudents({ q, status, page }),
            initialData: initialOverview,
            placeholderData: keepPreviousData,
            staleTime: Infinity, // Cache indefinitely to avoid refetch on navigation
        })

        const updateParams = useCallback(
            (updates: Record<string, string | null>) => {
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

        const handleSearchChange = useCallback(
            (value: string) => {
                setSearchInput(value)
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                }
                searchTimeoutRef.current = setTimeout(() => {
                    updateParams({ q: value || null, page: "1" })
                }, 400)
            },
            [updateParams]
        )

        const currentPage = parseInt(page, 10) || 1

        const overview = useMemo(() => {
            const data = studentsQuery.data ?? {
                stats: initialOverview.stats,
                data: [],
                pagination: initialOverview.pagination,
            }

            return {
                ...data,
                pagination: { ...data.pagination, page: currentPage },
            }
        }, [currentPage, initialOverview.pagination, initialOverview.stats, studentsQuery.data])

        return (
            <Component
                overview={overview}
                searchValue={searchInput}
                statusValue={status}
                isLoading={studentsQuery.isLoading && !studentsQuery.data}
                isFetching={studentsQuery.isFetching}
                onSearchChange={handleSearchChange}
                onStatusChange={(value) => updateParams({ status: value, page: "1" })}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            />
        )
    }
}
