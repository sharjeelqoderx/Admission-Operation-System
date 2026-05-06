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

        // Get total count matching filters (using limit(0) to get count without data)
        const { count: totalCount, error: countError } = await getBaseQuery().limit(0)

        if (countError) {
            console.error("count error:", countError)
            return NextResponse.json({ error: "Failed to fetch count", details: countError }, { status: 500 })
        }

        // Return empty if offset is beyond count
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
