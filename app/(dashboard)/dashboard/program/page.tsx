"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, AlertCircle } from "lucide-react"
import { ProgramCard, ProgramSkeleton, InfiniteLoader } from "./_component/ProgramCard"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"

import { PageLoader } from "@/components/shared/page-loader"

export default function ProgramDashboard() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const observerTarget = useRef<HTMLDivElement>(null)

    const urlSearch = searchParams.get("search") || ""
    const category = searchParams.get("category") || "ALL"

    const [localSearch, setLocalSearch] = useState(urlSearch)
    const debouncedSearch = useDebounce(localSearch, 600)

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (debouncedSearch) params.set("search", debouncedSearch)
        else params.delete("search")
        router.push(`${pathname}?${params.toString()}`)
    }, [debouncedSearch])

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery({
        queryKey: ["programs", urlSearch, category],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams()
            if (urlSearch) params.set("search", urlSearch)
            if (category !== "ALL") params.set("category", category)
            params.set("limit", "10")
            params.set("offset", pageParam.toString())

            const res = await fetch(`/api/program?${params.toString()}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch")
            return json
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.hasMore) {
                return (lastPage.pagination.offset || 0) + (lastPage.pagination.limit || 10)
            }
            return undefined
        },
        initialPageParam: 0
    })

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            { threshold: 0.1 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const updateCategory = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val && val !== "ALL") params.set("category", val)
        else params.delete("category")
        router.push(`${pathname}?${params.toString()}`)
    }

    const categories = ["Engineering & IT", "Business & Management", "Media & Design", "Medical & Health", "Arts & Humanities", "Business & IT"]
    const allPrograms = data?.pages?.flatMap((page) => page?.data || []) || []

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="space-y-3">
                <Typography as="h1" className="text-[32px] font-extrabold text-gray-900 tracking-tight">
                    Explore Programs
                </Typography>
                <Typography as="p" className="text-[14px] font-medium text-gray-500 leading-relaxed">
                    Browse through our extensive academic catalog. Find the right program that fits your career goals across multiple campuses and universities.
                </Typography>
            </div>

            {/* ── Search & Filter Bar ── */}
            <div className="flex flex-col md:flex-row gap-4 sticky top-4 z-10">
                <div className="relative flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <Input
                        placeholder="Search program, university or location..."
                        className="border-0 bg-transparent h-14 pl-12 text-[15px] focus-visible:ring-0"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-white px-4 rounded-xl shadow-sm border border-gray-100 min-w-[240px]">
                    <SlidersHorizontal size={18} className="text-gray-400 shrink-0" />
                    <Select value={category} onValueChange={updateCategory}>
                        <SelectTrigger className="border-0 focus:ring-0 h-14 text-[14px] font-bold text-gray-700 bg-transparent">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {(isLoading || (isFetching && !isFetchingNextPage)) ? (
                <PageLoader label={isLoading ? "Loading programs..." : "Searching programs..."} />
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <Typography font="text-lg" className="text-gray-700 font-bold">Failed to load programs</Typography>
                    <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">Try Again</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {allPrograms.map((program) => (
                        <ProgramCard key={program.id} program={program} />
                    ))}

                    <div ref={observerTarget} className="h-10 w-full" />

                    {isFetchingNextPage && <InfiniteLoader />}

                    {!hasNextPage && allPrograms.length > 0 && (
                        <div className="text-center py-10">
                            <Typography as="span" className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                                You've reached the end of the catalog
                            </Typography>
                        </div>
                    )}

                    {allPrograms.length === 0 && !isFetching && (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
                            <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                                <Search className="size-8 text-gray-300" />
                            </div>
                            <Typography className="text-gray-500 font-medium">No programs found matching your criteria</Typography>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
