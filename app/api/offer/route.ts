import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: profile, error: profileError } =
            await supabase
                .from("profile")
                .select("role")
                .eq("id", user.id)
                .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            );
        }

        const { data: offers, error } =
            await supabase
                .from("offer_letter")
                .select(`
                    id,
                    status,
                    created_at,
                    application!inner (
                        id,
                        application_no,
                        profile_id,
                        submitted_by_profile_id,
                        university_id,
                        student:profile_id (
                            id,
                            name,
                            avatar_url,
                            email
                        ),
                        course:course_id (
                            id,
                            name,
                            deadline_date,
                            degree:degree_id (
                                id,
                                name,
                                fees,
                                intake_date,
                                study_mode
                            )
                        ),
                        university:university_id (
                            id,
                            name
                        )
                    )
                `)
                .order("created_at", {
                    ascending: true,
                });

        if (error) {
            console.error(
                "GET /api/offer error:",
                error
            );

            return NextResponse.json(
                {
                    error: "Failed to fetch offers",
                    details: error.message,
                },
                { status: 500 }
            );
        }

        let filtered = offers ?? [];

        switch (profile.role) {
            case "STUDENT":
                filtered = filtered.filter(
                    (offer: any) =>
                        offer.application?.profile_id ===
                        user.id
                );
                break;

            case "AGENT":
                filtered = filtered.filter(
                    (offer: any) =>
                        offer.application
                            ?.submitted_by_profile_id ===
                        user.id
                );
                break;

            case "UNIVERSITY":
                filtered = filtered.filter(
                    (offer: any) =>
                        offer.application
                            ?.university_id === user.id
                );
                break;

            // ADMIN gets all
        }

        return NextResponse.json(
            { data: filtered },
            { status: 200 }
        );
    } catch (e) {
        console.error(
            "GET /api/offer error:",
            e
        );

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}