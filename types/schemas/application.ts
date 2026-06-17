import { z } from "zod";

export const ApplicationStatusFilterSchema = z.enum([
  "all",
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
  "PENDING",
]);

export const ApplicationListQuerySchema = z.object({
  student_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: ApplicationStatusFilterSchema.optional(),
  degree_id: z.string().uuid().optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date_from must be YYYY-MM-DD")
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date_to must be YYYY-MM-DD")
    .optional(),
  q: z.string().trim().min(1).optional(),
  scope: z.enum(["all"]).optional(),
});

export type ApplicationListQuery = z.infer<typeof ApplicationListQuerySchema>;

export type ApplicationListStats = {
  total: number
  pending: number
  accepted: number
}

export const CreateApplicationSchema = z.object({
  profile_id: z.string().min(1, "Please select a student"),
  course_id: z.string().uuid("Please select a course"),
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
