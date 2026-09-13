"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import type { UniversityProgramListResponse } from "@/types/schemas/university-program"

export type UniversityProgramPageLogicProps = {
    overview: UniversityProgramListResponse
    canManagePrograms: boolean
    searchValue: string
    levelId: string
    isLoading: boolean
    isFetching: boolean
    deletingId: string | null
    onSearchChange: (value: string) => void
    onLevelChange: (value: string) => void
    onPageChange: (page: number) => void
    onDelete: (id: string) => void
}

async function fetchUniversityPrograms(params: {
    q?: string
    level_id?: string
    page?: string
}) {
    const url = new URL("/api/university/programs", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    if (params.level_id) url.searchParams.set("level_id", params.level_id)
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
        canManagePrograms,
    }: {
        initialOverview: UniversityProgramListResponse
        canManagePrograms: boolean
    }) {
        const queryClient = useQueryClient()
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()

        const q = searchParams.get("q") ?? ""
        const levelId = searchParams.get("level_id") ?? "all"
        const page = searchParams.get("page") ?? "1"
        const [searchInput, setSearchInput] = useState(q)
        const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
        const initialQueryRef = useRef<{ q: string; level_id: string; page: string } | null>(null)

        if (initialQueryRef.current === null) {
            initialQueryRef.current = { q, level_id: levelId, page }
        }

        useEffect(() => {
            setSearchInput(q)
        }, [q])

        useEffect(() => {
            return () => {
                if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                }
            }
        }, [])

        const matchesInitialQuery =
            q === initialQueryRef.current.q &&
            levelId === initialQueryRef.current.level_id &&
            page === initialQueryRef.current.page

        const programsQuery = useQuery({
            queryKey: ["university-programs", q, levelId, page],
            queryFn: () =>
                fetchUniversityPrograms({
                    q,
                    level_id: levelId === "all" ? undefined : levelId,
                    page,
                }),
            initialData: matchesInitialQuery ? initialOverview : undefined,
            placeholderData: keepPreviousData,
            staleTime: Infinity,
        })

        const deleteMutation = useMutation({
            mutationFn: async (id: string) => {
                const res = await fetch(`/api/university/programs/${id}`, {
                    method: "DELETE",
                })
                const json = await res.json()

                if (!res.ok) {
                    throw new Error(json?.error ?? "Failed to delete program")
                }

                return json
            },
            onSuccess: () => {
                toast.success("Program deleted successfully")
                queryClient.invalidateQueries({ queryKey: ["university-programs"] })
                router.refresh()
            },
            onError: (error: Error) => {
                toast.error(error.message)
            },
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

        const handleLevelChange = useCallback(
            (value: string) => {
                updateParams({
                    level_id: value === "all" ? null : value,
                    page: "1",
                })
            },
            [updateParams]
        )

        const currentPage = parseInt(page, 10) || 1

        const overview = useMemo(() => {
            const data = programsQuery.data ?? {
                data: [],
                pagination: initialOverview.pagination,
            }

            return {
                ...data,
                pagination: { ...data.pagination, page: currentPage },
            }
        }, [currentPage, initialOverview.pagination, programsQuery.data])

        return (
            <Component
                overview={overview}
                canManagePrograms={canManagePrograms}
                searchValue={searchInput}
                levelId={levelId}
                isLoading={programsQuery.isLoading && !programsQuery.data}
                isFetching={programsQuery.isFetching}
                deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
                onSearchChange={handleSearchChange}
                onLevelChange={handleLevelChange}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
                onDelete={(id) => deleteMutation.mutate(id)}
            />
        )
    }
}
