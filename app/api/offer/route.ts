import { NextRequest, NextResponse } from "next/server";
import {
    createSupabaseServerClient,
    tryCreateSupabaseServiceClient,
} from "@/lib/supabase/server";
import { CreateOfferSchema, OfferListQuerySchema } from "@/types/schemas/offer";
import { mapTemplateRow } from "@/lib/document-template/server";
import { renderTemplateHtml } from "@/lib/document-template/variables";
import { buildOfferTemplateVariables } from "@/lib/offer/build-offer-variables";
import { fetchAdmissionRequirementsContext } from "@/lib/offer/admission-requirements-context";
import { buildChecklistProofsSnapshot } from "@/lib/document-template/checklist-items";
import { resolveTemplateChecklistItems } from "@/lib/document-template/resolve-checklist-items";
import { fetchOffersList } from "@/lib/offer/list";
import { isMissingOfferTemplateColumnError } from "@/lib/offer/select-fields";
import { withProfileDisplayName } from "@/lib/utils/profile";
import { isUniversityStaffRole } from "@/lib/auth/university-role"
import { Role } from "@/types/enums/role";

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

        const { searchParams } = new URL(req.url)
        const queryParse = OfferListQuerySchema.safeParse({
            q: searchParams.get("q") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
        })

        if (!queryParse.success) {
            return NextResponse.json(
                {
                    error: "Invalid query parameters",
                    details: queryParse.error.flatten(),
                },
                { status: 400 }
            )
        }

        const result = await fetchOffersList({
            ...queryParse.data,
            userId: user.id,
            role: profile.role,
        })

        return NextResponse.json(result, { status: 200 })
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

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (profile.role !== Role.AGENT && !isUniversityStaffRole(profile.role)) {
            return NextResponse.json(
                { error: "Only university or university partner profiles can create offers" },
                { status: 403 }
            );
        }

        const json = await req.json();
        const validated = CreateOfferSchema.parse(json);

        const { data: application, error: applicationError } = await supabase
            .from("application")
            .select(`
                id,
                application_no,
                profile_id,
                submitted_by_profile_id,
                university_id,
                student:profile!profile_id ( first_name, last_name, title, date_of_birth ),
                course:course_id (
                    name,
                    degree:degree_id ( name, fees, intake_date, duration )
                ),
                university:profile!university_id ( first_name, last_name )
            `)
            .eq("id", validated.application_id)
            .single();

        if (applicationError || !application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const { data: templateRow, error: templateError } = await supabase
            .from("document_template")
            .select("*")
            .eq("id", validated.document_template_id)
            .eq("is_deleted", false)
            .single();

        if (templateError || !templateRow) {
            return NextResponse.json({ error: "Document template not found" }, { status: 404 });
        }

        const template = mapTemplateRow(templateRow);

        type StudentProfileRelation = {
            first_name?: string | null
            last_name?: string | null
            title?: string | null
            date_of_birth?: string | null
        } | null

        const pickProfile = (
            value: StudentProfileRelation | StudentProfileRelation[] | null | undefined
        ): StudentProfileRelation =>
            Array.isArray(value) ? value[0] ?? null : value ?? null

        const studentProfile = pickProfile(
            application.student as StudentProfileRelation | StudentProfileRelation[] | null
        )

        const student = withProfileDisplayName(studentProfile);

        const { data: studentRecord } = await supabase
            .from("student")
            .select("address, city, state, country, zip_code")
            .eq("profile_id", application.profile_id)
            .maybeSingle();

        const university = withProfileDisplayName(
            application.university as { first_name?: string | null; last_name?: string | null } | null
        );

        const checklistItems = resolveTemplateChecklistItems({
            checklistItems: templateRow.checklist_items,
            checklistProfile:
                typeof templateRow.checklist_profile === "string"
                    ? templateRow.checklist_profile
                    : null,
        });
        const requirementsContext = await fetchAdmissionRequirementsContext(supabase, {
            applicationId: application.id,
            profileId: application.profile_id,
        });
        const checklistProofs =
            checklistItems.length > 0
                ? buildChecklistProofsSnapshot(requirementsContext, checklistItems)
                : null;

        const variables = buildOfferTemplateVariables(
            {
                application_no: application.application_no,
                student: {
                    ...student,
                    title: studentProfile?.title ?? null,
                    date_of_birth: studentProfile?.date_of_birth ?? null,
                    address: studentRecord?.address ?? null,
                    city: studentRecord?.city ?? null,
                    state: studentRecord?.state ?? null,
                    country: studentRecord?.country ?? null,
                    zip_code: studentRecord?.zip_code ?? null,
                },
                course: application.course as OfferApplicationCourse,
                university,
            },
            requirementsContext,
            {
                itemIds: checklistItems,
                proofs: checklistProofs,
            }
        );

        const renderedBodyHtml = renderTemplateHtml(template.body_html, variables);

        const insertPayload = {
            application_id: validated.application_id,
            document_template_id: validated.document_template_id,
            body_html: renderedBodyHtml,
            checklist_items: checklistItems.length > 0 ? checklistItems : null,
            checklist_proofs: checklistProofs,
            issued_by_profile_id: user.id,
            status: "PENDING" as const,
        };

        const insertSelect =
            "id, status, created_at, body_html, document_template_id, application_id, checklist_items, checklist_proofs";

        let insertResult = await supabase
            .from("offer_letter")
            .insert(insertPayload)
            .select(insertSelect)
            .single();

        if (insertResult.error && isMissingOfferTemplateColumnError(insertResult.error.message)) {
            insertResult = await supabase
                .from("offer_letter")
                .insert({
                    application_id: validated.application_id,
                    issued_by_profile_id: user.id,
                    status: "PENDING",
                })
                .select("id, status, created_at, application_id")
                .single();
        }

        if (insertResult.error && isOfferInsertRlsError(insertResult.error)) {
            const serviceClient = tryCreateSupabaseServiceClient()

            if (serviceClient) {
                insertResult = await serviceClient
                    .from("offer_letter")
                    .insert(insertPayload)
                    .select(insertSelect)
                    .single()

                if (
                    insertResult.error &&
                    isMissingOfferTemplateColumnError(insertResult.error.message)
                ) {
                    insertResult = await serviceClient
                        .from("offer_letter")
                        .insert({
                            application_id: validated.application_id,
                            issued_by_profile_id: user.id,
                            status: "PENDING",
                        })
                        .select("id, status, created_at, application_id")
                        .single()
                }
            } else {
                console.error("POST /api/offer RLS error:", insertResult.error)
                return NextResponse.json(
                    {
                        error: "Failed to create offer",
                        details: insertResult.error.message,
                        hint: OFFER_INSERT_POLICY_HINT,
                    },
                    { status: 500 }
                )
            }
        }

        const { data: offer, error: insertError } = insertResult

        if (insertError || !offer) {
            console.error("POST /api/offer error:", insertError)
            return NextResponse.json(
                {
                    error: "Failed to create offer",
                    details: insertError?.message ?? "Could not insert offer.",
                    hint: isOfferInsertRlsError(insertError) ? OFFER_INSERT_POLICY_HINT : undefined,
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { data: offer, message: "Offer created successfully" },
            { status: 201 }
        );
    } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
            return NextResponse.json({ error: "Validation failed", details: e }, { status: 400 });
        }

        console.error("POST /api/offer error:", e);
        const message = e instanceof Error ? e.message : "Internal Server Error";
        return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
    }
}

type OfferApplicationCourse = {
    name?: string | null
    degree?: {
        name?: string | null
        fees?: string | null
        intake_date?: string | null
        duration?: string | null
    } | null
} | null

const OFFER_INSERT_POLICY_HINT =
    "Run supabase/migrations/047_offer_insert_staff_all_applications.sql in Supabase SQL Editor."

function isOfferInsertRlsError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false
    return (
        error.code === "42501" ||
        (error.message ?? "").toLowerCase().includes("row-level security")
    )
}