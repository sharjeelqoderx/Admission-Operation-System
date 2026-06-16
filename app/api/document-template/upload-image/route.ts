import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"
import { getFileSizeLimitError, isFileWithinSizeLimit } from "@/lib/constants/file-upload"

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return err("Unauthorized", 401)
        }

        const form = await req.formData()
        const file = form.get("file")

        if (!(file instanceof File)) {
            return err("Image file is required", 400)
        }

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            return err("Only JPEG, PNG, WebP, and GIF images are allowed", 400)
        }

        if (!isFileWithinSizeLimit(file)) {
            return err(getFileSizeLimitError(file.name), 400)
        }

        const { publicUrl } = await uploadPublicImage({
            supabase,
            bucket: "student-admission",
            userId: `${user.id}/document-templates`,
            file,
        })

        return ok({ url: publicUrl })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Upload failed"
        return err(message, 500)
    }
}
