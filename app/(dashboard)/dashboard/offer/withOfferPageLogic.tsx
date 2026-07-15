"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
    OfferDashboardPageData,
    OfferListItem,
    OfferListPagination,
    OfferListResponse,
} from "@/types/schemas/offer"

export type OfferPageLogicProps = {
    offers: OfferListItem[]
    pagination?: OfferListPagination
    isLoading: boolean
    isFetching: boolean
    isError: boolean
    q: string
    handleSearch: (term: string) => void
    handlePageChange: (page: number) => void
    handleRetry: () => void
}

async function fetchOffersFromApi(params: {
    q: string
    page: number
    limit: number
}): Promise<OfferListResponse> {
    const url = new URL("/api/offer", window.location.origin)
    if (params.q) url.searchParams.set("q", params.q)
    url.searchParams.set("page", String(params.page))
    url.searchParams.set("limit", String(params.limit))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error("Failed to fetch offers")
    return res.json() as Promise<OfferListResponse>
}

export function withOfferPageLogic(Component: ComponentType<OfferPageLogicProps>) {
    return function OfferPageContainer({
        initialData,
    }: {
        initialData: OfferDashboardPageData
    }) {
        const searchParams = useSearchParams()
        const router = useRouter()
        const pathname = usePathname()
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)
        const pendingPageRef = useRef<number | null>(null)

        const q = searchParams.get("q") || ""
        const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1
        const limit = parseInt(searchParams.get("limit") || "10", 10) || 10
        const [page, setPage] = useState(urlPage)

        useEffect(() => {
            const syncedPage = parseInt(searchParams.get("page") || "1", 10) || 1
            if (pendingPageRef.current !== null) {
                if (syncedPage === pendingPageRef.current) {
                    pendingPageRef.current = null
                }
                return
            }
            setPage(syncedPage)
        }, [searchParams])

        const matchesInitialQuery =
            q === initialData.query.q &&
            String(page) === initialData.query.page &&
            String(limit) === initialData.query.limit

        const replaceParams = useCallback(
            (mutator: (params: URLSearchParams) => void) => {
                const params = new URLSearchParams(searchParams.toString())
                mutator(params)
                const query = params.toString()
                router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
            },
            [pathname, router, searchParams]
        )

        const handleSearch = useCallback(
            (term: string) => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    pendingPageRef.current = 1
                    setPage(1)
                    replaceParams((params) => {
                        if (term) params.set("q", term)
                        else params.delete("q")
                        params.delete("page")
                    })
                }, 400)
            },
            [replaceParams]
        )

        const offersQuery = useQuery({
            queryKey: ["offers", q, page, limit],
            queryFn: () => fetchOffersFromApi({ q, page, limit }),
            initialData: matchesInitialQuery ? initialData.offers : undefined,
            placeholderData: keepPreviousData,
            retry: false,
        })

        const isFetchingRef = useRef(false)
        isFetchingRef.current = offersQuery.isFetching

        const handlePageChange = useCallback(
            (newPage: number) => {
                if (isFetchingRef.current) return
                if (newPage === page) return

                pendingPageRef.current = newPage
                setPage(newPage)
                replaceParams((params) => {
                    if (newPage > 1) params.set("page", String(newPage))
                    else params.delete("page")
                })
            },
            [page, replaceParams]
        )

        const queryPagination = offersQuery.data?.pagination
        const pagination = queryPagination ? { ...queryPagination, page } : undefined

        return (
            <Component
                offers={offersQuery.data?.data ?? []}
                pagination={pagination}
                isLoading={offersQuery.isLoading && !offersQuery.data}
                isFetching={offersQuery.isFetching}
                isError={offersQuery.isError}
                q={q}
                handleSearch={handleSearch}
                handlePageChange={handlePageChange}
                handleRetry={() => {
                    void offersQuery.refetch()
                }}
            />
        )
    }
}
