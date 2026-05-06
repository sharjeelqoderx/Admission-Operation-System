import { z } from "zod"

export const DocumentFormSchema = z.object({
    student_id: z.string().min(1, "Please select a student"),
    name: z.string().min(1, "Document name is required"),
    files: z.array(z.instanceof(File)).min(1, "At least one file is required").max(2, "Maximum 2 files allowed"),
    comment: z.string().optional(),
})

export type DocumentInput = z.infer<typeof DocumentFormSchema>
