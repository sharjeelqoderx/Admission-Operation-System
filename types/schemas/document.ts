import { z } from "zod"

export const DocumentFormSchema = z.object({
    student_id: z.string().min(1, "Please select a student"),
    name: z.string().min(1, "Document name is required"),
    file: z.instanceof(File, { message: "File is required" }),
    comment: z.string().optional(),
})

export type DocumentInput = z.infer<typeof DocumentFormSchema>
