import { z } from "zod";

export const CreateApplicationSchema = z.object({
  profile_id: z.string().min(1, "Please select a student"),
  program_id: z.string().min(1, "Please select a program"),
  university_id: z.string().min(1, "Invalid university"),
  document_ids: z.array(z.string()).min(1, "Please attach at least one document"),
  intake_date: z.string().min(1, "Please select an academic session"),
  tuition_fee: z.number().optional(),
  currency: z.string().optional(),
  declarations: z.array(z.boolean()).refine((arr) => arr.every(Boolean), {
    message: "You must accept all declarations",
  }),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
