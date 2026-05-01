import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import { uploadPublicImage } from "@/lib/supabase/upload-public-image"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) return err("Unauthorized", 401)

        const form = await req.formData()
        const file = form.get("file")
        if (!(file instanceof File)) return err("File is required", 400)

        const { publicUrl } = await uploadPublicImage({
            supabase,
            bucket: "student-admission",
            userId: user.id,
            file,
        })

        return ok({ url: publicUrl })
    } catch (e: any) {
        return err(e?.message ?? "Upload failed", 500)
    }
}

