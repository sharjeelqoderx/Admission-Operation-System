import { NextRequest } from "next/server"
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { getFileSizeLimitError, isFileWithinSizeLimit } from "@/lib/constants/file-upload"
import { isDocumentTemplateStaffRole } from "@/lib/document-template/server"
import {
    listDocumentTemplateAssets,
    uploadDocumentTemplateAsset,
} from "@/lib/document-template/assets"

export async function GET() {
    try {
        const supabaseAuth = await createSupabaseServerClient()
        const {
            data: { user },
            error: userError,
        } = await supabaseAuth.auth.getUser()

        if (userError || !user) {
            return err("Unauthorized", 401)
        }

        const { data: profile, error: profileError } = await supabaseAuth
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (profileError) {
            return err(profileError.message, 500)
        }

        if (!isDocumentTemplateStaffRole(profile?.role)) {
            return err("Forbidden", 403)
        }

        const supabaseService = createSupabaseServiceClient()
        const assets = await listDocumentTemplateAssets(supabaseService)
        return ok(assets)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load template assets"
        return err(message, 500)
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAuth = await createSupabaseServerClient()
        const {
            data: { user },
            error: userError,
        } = await supabaseAuth.auth.getUser()

        if (userError || !user) {
            return err("Unauthorized", 401)
        }

        const { data: profile, error: profileError } = await supabaseAuth
            .from("profile")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

        if (profileError) {
            return err(profileError.message, 500)
        }

        if (!isDocumentTemplateStaffRole(profile?.role)) {
            return err("Forbidden", 403)
        }

        const form = await req.formData()
        const file = form.get("file")

        if (!(file instanceof File)) {
            return err("Image file is required", 400)
        }

        if (!isFileWithinSizeLimit(file)) {
            return err(getFileSizeLimitError(file.name), 400)
        }

        const supabaseService = createSupabaseServiceClient()
        const asset = await uploadDocumentTemplateAsset(supabaseService, file)
        return ok(asset, 201)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Upload failed"
        if (/row-level security policy/i.test(message)) {
            return err(
                "Storage upload blocked by security policy. Ensure SUPABASE_SERVICE_ROLE_KEY is configured.",
                500
            )
        }
        return err(message, 500)
    }
}
