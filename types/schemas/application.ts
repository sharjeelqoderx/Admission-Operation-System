import { z } from "zod";

export const CreateApplicationSchema = z.object({
  profile_id: z.string().min(1, "Invalid student selected"),
  program_id: z.string().min(1, "Invalid program selected"),
  university_id: z.string().min(1, "Invalid university selected"),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
