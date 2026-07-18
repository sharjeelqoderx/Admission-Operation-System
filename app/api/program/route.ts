import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ProgramListQuerySchema } from "@/types/schemas/program"
import {
    attachLevelsToCourses,
    COURSE_SELECT,
    type CourseRow,
} from "@/lib/api/course-program"

async function getDegreeIdsForFilters(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    filters: { levelId?: string; intakeDate?: string }
): Promise<string[]> {
    let query = supabase.from("degree").select("id")

    if (filters.levelId) {
        query = query.eq("level_id", filters.levelId)
    }

    if (filters.intakeDate) {
        query = query.eq("intake_date", filters.intakeDate)
    }

    const { data, error } = await query

    if (error) {
        throw error
    }

    return (data ?? []).map((row) => row.id)
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { searchParams } = new URL(req.url)

        const parsed = ProgramListQuerySchema.safeParse({
            search: searchParams.get("search") ?? undefined,
            level_id: searchParams.get("level_id") ?? undefined,
            intake_date: searchParams.get("intake_date") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            offset: searchParams.get("offset") ?? undefined,
        })

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid query parameters", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { search, level_id, intake_date, limit, offset } = parsed.data
        const searchTerm = search?.trim()

        let matchingDegreeIds: string[] = []
        let filterDegreeIds: string[] | null = null

        if (level_id || intake_date) {
            try {
                filterDegreeIds = await getDegreeIdsForFilters(supabase, {
                    levelId: level_id,
                    intakeDate: intake_date,
                })
            } catch (filterError) {
                console.error("degree filter error:", filterError)
                return NextResponse.json(
                    { error: "Failed to filter programs", details: filterError },
                    { status: 500 }
                )
            }

            if (filterDegreeIds.length === 0) {
                return NextResponse.json({
                    data: [],
                    pagination: { total: 0, limit, offset, hasMore: false },
                })
            }
        }

        if (searchTerm) {
            const { data: degrees, error: degreeSearchError } = await supabase
                .from("degree")
                .select("id")
                .or(
                    `name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,language_of_study.ilike.%${searchTerm}%`
                )

            if (degreeSearchError) {
                console.error("degree search error:", degreeSearchError)
                return NextResponse.json(
                    { error: "Failed to search programs", details: degreeSearchError },
                    { status: 500 }
                )
            }

            matchingDegreeIds = (degrees ?? []).map((row) => row.id)
        }

        const getBaseQuery = () => {
            let query = supabase
                .from("course")
                .select(COURSE_SELECT, { count: "exact" })
                .eq("is_deleted", false)

            if (filterDegreeIds) {
                query = query.in("degree_id", filterDegreeIds)
            }

            if (searchTerm) {
                if (matchingDegreeIds.length > 0) {
                    query = query.or(
                        `name.ilike.%${searchTerm}%,degree_id.in.(${matchingDegreeIds.join(",")})`
                    )
                } else {
                    query = query.ilike("name", `%${searchTerm}%`)
                }
            }

            return query
        }

        const { count: totalCount, error: countError } = await getBaseQuery().limit(0)

        if (countError) {
            console.error("course count error:", countError)
            return NextResponse.json(
                { error: "Failed to fetch count", details: countError },
                { status: 500 }
            )
        }

        if (totalCount !== null && offset >= totalCount && offset > 0) {
            return NextResponse.json({
                data: [],
                pagination: { total: totalCount, limit, offset, hasMore: false },
            })
        }

        const { data, error } = await getBaseQuery()
            .order("name", { ascending: true })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error("course fetch error:", error)
            return NextResponse.json(
                { error: "Failed to fetch programs", details: error },
                { status: 500 }
            )
        }

        const coursesWithLevels = await attachLevelsToCourses(
            supabase,
            (data ?? []) as unknown as CourseRow[]
        )

        return NextResponse.json({
            data: coursesWithLevels,
            pagination: {
                total: totalCount ?? 0,
                limit,
                offset,
                hasMore: offset + coursesWithLevels.length < (totalCount ?? 0),
            },
        })
    } catch (error) {
        console.error("Internal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

/*
// ─── Legacy: campus_program_junction + program ─────────────────

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search")?.toLowerCase()
        const category = searchParams.get("category")
        const limit = parseInt(searchParams.get("limit") || "10")
        const offset = parseInt(searchParams.get("offset") || "0")

        const selectString = `
            id,
            tuition_fee,
            currency,
            total_seats,
            study_type,
            intake_date,
            application_deadline,
            program:program_id!inner (
                id,
                name,
                category,
                status
            ),
            campus:campus_id!inner (
                id,
                name,
                location,
                university:profile_id (
                    id,
                    name,
                    avatar_url
                )
            )
        `

        const getBaseQuery = () => {
            let q = supabase
                .from("campus_program_junction")
                .select(selectString, { count: "exact" })

            if (search) {
                q = q.or(`name.ilike.%${search}%,category.ilike.%${search}%`, { foreignTable: "program" })
            }

            if (category && category !== "ALL") {
                q = q.eq("program.category", category)
            }
            return q
        }

        const { count: totalCount, error: countError } = await getBaseQuery().limit(0)

        if (countError) {
            console.error("count error:", countError)
            return NextResponse.json({ error: "Failed to fetch count", details: countError }, { status: 500 })
        }

        if (totalCount !== null && offset >= totalCount && offset > 0) {
            return NextResponse.json({
                data: [],
                pagination: { total: totalCount, limit, offset, hasMore: false }
            }, { status: 200 })
        }

        const { data, error } = await getBaseQuery()
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("program fetch error:", error)
            return NextResponse.json({ error: "Failed to fetch programs", details: error }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json({
                data: [],
                pagination: { total: 0, limit, offset, hasMore: false }
            }, { status: 200 })
        }

        let result = data.map((item: any) => ({
            id: item.id,
            program_id: item.program?.id,
            name: item.program?.name,
            category: item.program?.category,
            status: item.program?.status,
            tuition_fee: item.tuition_fee,
            currency: item.currency,
            seats: item.total_seats,
            study_type: item.study_type,
            intake_date: item.intake_date,
            deadline: item.application_deadline,
            campus_name: item.campus?.name,
            location: item.campus?.location,
            university_id: item.campus?.university?.id,
            university_name: item.campus?.university?.name || "FHM University",
            university_logo: item.campus?.university?.avatar_url || null
        }))

        return NextResponse.json({
            data: result,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: (offset + result.length) < (totalCount || 0)
            }
        }, { status: 200 })
    } catch (error) {
        console.error("Internal error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
*/
