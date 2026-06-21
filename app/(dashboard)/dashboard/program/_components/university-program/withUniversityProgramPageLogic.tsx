"use client"

import type { ComponentType } from "react"
import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { UniversityProgramListResponse } from "@/types/schemas/university-program"

export type UniversityProgramPageLogicProps = {
    overview: UniversityProgramListResponse
    searchValue: string
    isFetching: boolean
    onSearchChange: (value: string) => void
    onPageChange: (page: number) => void
}

async function fetchUniversityPrograms(params: { q?: string; page?: string }) {
    const url = new URL("/api/university/programs", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.page) url.searchParams.set("page", params.page)
    url.searchParams.set("limit", "10")

    const res = await fetch(url.toString())
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch programs")
    }
    return json.data as UniversityProgramListResponse
}

export function withUniversityProgramPageLogic(
    Component: ComponentType<UniversityProgramPageLogicProps>
) {
    return function UniversityProgramPageContainer({
        initialOverview,
    }: {
        initialOverview: UniversityProgramListResponse
    }) {
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()

        const q = searchParams.get("q") ?? ""
        const page = searchParams.get("page") ?? "1"

        const programsQuery = useQuery({
            queryKey: ["university-programs", q, page],
            queryFn: () => fetchUniversityPrograms({ q, page }),
            initialData: initialOverview,
        })

        const updateParams = useCallback(
            (updates: Record<string, string | null>) => {
                const params = new URLSearchParams(searchParams.toString())
                Object.entries(updates).forEach(([key, value]) => {
                    if (value) params.set(key, value)
                    else params.delete(key)
                })
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            },
            [pathname, router, searchParams]
        )

        const overview = useMemo(
            () =>
                programsQuery.data ?? {
                    data: [],
                    pagination: initialOverview.pagination,
                },
            [initialOverview.pagination, programsQuery.data]
        )

        return (
            <Component
                overview={overview}
                searchValue={q}
                isFetching={programsQuery.isFetching}
                onSearchChange={(value) => updateParams({ q: value || null, page: "1" })}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
            />
        )
    }
}
