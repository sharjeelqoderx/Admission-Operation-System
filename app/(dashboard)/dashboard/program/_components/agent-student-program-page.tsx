"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { Typography } from "@/components/shared/Typography"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, AlertCircle } from "lucide-react"
import { ProgramCard, InfiniteLoader } from "../_component/ProgramCard"
import { useDebounce } from "@/hooks/use-debounce"
import { useLevels } from "@/hooks/useLevels"
import { getLevelPriority, getLevelBadgeStyle } from "@/lib/utils/levels"
import { Button } from "@/components/ui/button"
import { CardsGridSkeleton } from "@/components/shared/page-skeleton"
import type { ProgramListResponse } from "@/types/schemas/program"
import { Role } from "@/types/enums/role"

export function AgentStudentProgramPage() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const observerTarget = useRef<HTMLDivElement>(null)

    const urlSearch = searchParams.get("search") || ""
    const levelId = searchParams.get("level_id") || "ALL"
    const intakeSeason = searchParams.get("intake_date") || "ALL"

    const [localSearch, setLocalSearch] = useState(urlSearch)
    const debouncedSearch = useDebounce(localSearch, 600)

    const { me } = useAuth()
    const user = me.data

    // Fetch student details if user is student
    const { data: studentDetails } = useQuery({
        queryKey: ["student", user?.id],
        queryFn: async () => {
            if (!user?.id) return null
            const res = await fetch(`/api/student/${user.id}`)
            if (!res.ok) throw new Error("Failed to fetch student")
            return res.json()
        },
        enabled: !!user?.id && user?.role === Role.STUDENT,
    })

    const { data: levels = [], isLoading: levelsLoading } = useLevels()

    useEffect(() => {
        setLocalSearch(urlSearch)
    }, [urlSearch])

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
        refetch,
    } = useInfiniteQuery<ProgramListResponse>({
        queryKey: ["programs", urlSearch, levelId, intakeSeason],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams()
            if (urlSearch) params.set("search", urlSearch)
            if (levelId !== "ALL") params.set("level_id", levelId)
            if (intakeSeason !== "ALL") params.set("intake_date", intakeSeason)
            params.set("limit", "10")
            params.set("offset", String(pageParam))

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
        initialPageParam: 0,
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

    const updateLevel = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val && val !== "ALL") params.set("level_id", val)
        else params.delete("level_id")
        router.push(`${pathname}?${params.toString()}`)
    }

    const updateIntakeSeason = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val && val !== "ALL") params.set("intake_date", val)
        else params.delete("intake_date")
        router.push(`${pathname}?${params.toString()}`)
    }

    const allProgramsResult = useMemo(() => {
        let programs = data?.pages.flatMap((page) => page.data) ?? [];
        let highestLevelName: string | null = null;

        if (user?.role === Role.STUDENT) {
            // Find highest level priority from student's education
            let highestLevelPriority = 0;
            if (studentDetails?.data?.education && Array.isArray(studentDetails.data.education)) {
                for (const edu of studentDetails.data.education) {
                    if (edu?.qualification_degree?.level?.name) {
                        const levelPriority = getLevelPriority(edu.qualification_degree.level.name);
                        if (levelPriority > highestLevelPriority) {
                            highestLevelPriority = levelPriority;
                            highestLevelName = edu.qualification_degree.level.name;
                        }
                    }
                }
            }

            if (highestLevelPriority > 0) {
                // Filter courses where course's level is higher than highestLevelPriority
                programs = programs.filter((course) => {
                    const courseLevelName = course?.degree?.level?.name;
                    const courseLevelPriority = getLevelPriority(courseLevelName);
                    return courseLevelPriority > highestLevelPriority;
                });
            }
        }

        return { programs, highestLevelName };
    }, [data, user, studentDetails])

    const allPrograms = allProgramsResult.programs;
    const highestLevelName = allProgramsResult.highestLevelName;

    const isPageLoading = levelsLoading || isLoading || (isFetching && !isFetchingNextPage)

    return (
        <div className="space-y-8">
            <div className="space-y-1 max-w-2xl">
                <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                    Explore Programs
                </Typography>
                <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                    Browse through our extensive academic catalog. Find the right program that fits your career goals across multiple campuses and universities.
                </Typography>
                {user?.role === Role.STUDENT && highestLevelName && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Typography as="span" font="small" className="text-gray-500">Your current qualification:</Typography>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${getLevelBadgeStyle(highestLevelName)}`}>
                            {highestLevelName}
                        </span>
                        <Typography as="span" font="small" className="text-gray-400">— showing eligible programs above this level</Typography>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 sticky top-4 z-10">
                <div className="relative flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                    <Input
                        placeholder="Search program, university or location..."
                        className="border-0 bg-transparent h-14 pl-12 focus-visible:ring-0"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 bg-white px-4 rounded-xl shadow-sm border border-gray-100 min-w-[200px]">
                        <SlidersHorizontal size={18} className="text-gray-400 shrink-0" />
                        <Select value={levelId} onValueChange={updateLevel} disabled={levelsLoading}>
                            <SelectTrigger className="border-0 focus:ring-0 h-14 font-bold text-gray-700 bg-transparent">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem value="ALL">All Levels</SelectItem>
                                {levels.map((level) => (
                                    <SelectItem key={level.id} value={level.id}>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getLevelBadgeStyle(level.name)}`}>
                                            {level.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 rounded-xl shadow-sm border border-gray-100 min-w-[180px]">
                        <Select value={intakeSeason} onValueChange={updateIntakeSeason}>
                            <SelectTrigger className="border-0 focus:ring-0 h-14 font-bold text-gray-700 bg-transparent">
                                <SelectValue placeholder="All Intakes" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem value="ALL">All Intakes</SelectItem>
                                <SelectItem value="summer">SUMMER</SelectItem>
                                <SelectItem value="winter">WINTER</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {isPageLoading ? (
                <CardsGridSkeleton />
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <Typography font="title" className="text-gray-700">Failed to load programs</Typography>
                    <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {allPrograms.map((course) => (
                        <ProgramCard key={course.id} course={course} />
                    ))}

                    <div ref={observerTarget} className="h-10 w-full" />

                    {isFetchingNextPage && <InfiniteLoader />}

                    {!hasNextPage && allPrograms.length > 0 && (
                        <div className="text-center py-10">
                            <Typography font="small" className="text-gray-800 uppercase tracking-widest">
                                You&apos;ve reached the end of the catalog
                            </Typography>
                        </div>
                    )}

                    {allPrograms.length === 0 && !isFetching && (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
                            <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                                <Search className="size-8 text-gray-300" />
                            </div>
                            <Typography font="sub-text" className="text-gray-500">
                                No programs found matching your criteria
                            </Typography>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
