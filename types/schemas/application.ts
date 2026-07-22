import { z } from "zod";
import type { ReactFormExtendedApi } from "@tanstack/react-form";
import type { Tables, Database } from "@/types/supabase";
import type { StudentListItem } from "@/lib/student/list";

export type ApplicationProfileRole = Database["public"]["Enums"]["role_enum"];

export const ApplicationStatusFilterSchema = z.enum([
  "all",
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
  "PENDING",
]);

export const ApplicationListQuerySchema = z.object({
  // Profile IDs may be UUID-shaped but not always RFC-compliant (version/variant).
  student_id: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
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

export const applicationListPaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
})

export type ApplicationListPagination = z.infer<typeof applicationListPaginationSchema>

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

export const ResubmitApplicationSchema = z.object({
  document_ids: z.array(z.string()).min(1, "Please attach at least one document"),
});

export type ResubmitApplicationInput = z.infer<typeof ResubmitApplicationSchema>;

export type ApplicationDocumentTypeSummary = Pick<Tables<"document_type">, "id" | "name">;

export type ApplicationStudentDocument = Pick<
  Tables<"document">,
  "id" | "document_type_id" | "created_at"
> & {
  document_type: ApplicationDocumentTypeSummary | null;
  document_files: Pick<Tables<"document_files">, "file_url">[];
};

export type ApplicationStudentListItem = StudentListItem & {
  profile: NonNullable<StudentListItem["profile"]>;
};

export type ApplicationStudentDetail = Pick<
  Tables<"profile">,
  "id" | "email" | "avatar_url" | "gender" | "date_of_birth"
> & {
  name: string;
  student: Pick<
    Tables<"student">,
    "student_code" | "nationality" | "country" | "state" | "city"
  > | null;
  education?: Array<{
    qualification_degree: {
      level: Pick<Tables<"levels">, "name"> | null;
    } | null;
  }>;
};

export type ApplicationMe = {
  id: string;
  role: ApplicationProfileRole;
};

export type ApplicationDuplicateRow = {
  course?: Pick<Tables<"course">, "id"> | null;
  status: Tables<"application">["status"];
};

export type ApplicationDetailProfile = Pick<
  Tables<"profile">,
  "id" | "first_name" | "last_name" | "avatar_url" | "email" | "gender" | "date_of_birth"
>;

export type ApplicationDetailAgent = Pick<
  Tables<"profile">,
  "id" | "first_name" | "last_name"
>;

export type ApplicationDetailDegree = Pick<
  Tables<"degree">,
  | "id"
  | "name"
  | "fees"
  | "intake_date"
  | "duration"
  | "location"
  | "language_of_study"
  | "study_mode"
>;

export type ApplicationDetailCourse = Pick<
  Tables<"course">,
  "id" | "name" | "deadline_date"
> & {
  degree: ApplicationDetailDegree | null;
};

export type ApplicationDetailUniversity = Pick<
  Tables<"profile">,
  "id" | "first_name" | "last_name"
>;

export type ApplicationDetailDocument = Tables<"application_document"> & {
  document:
    | (Pick<Tables<"document">, "id" | "created_at"> & {
        document_type: Pick<Tables<"document_type">, "id" | "name"> | null;
        document_files: Pick<Tables<"document_files">, "file_url" | "type">[];
        document_review: Pick<Tables<"document_review">, "status" | "feedback">[];
      })
    | null;
};

export type ApplicationDetailOfferLetter = Pick<Tables<"offer_letter">, "status">;

export type ApplicationDetail = Tables<"application"> & {
  offer_letter: ApplicationDetailOfferLetter | null;
  student: ApplicationDetailProfile | null;
  agent: ApplicationDetailAgent | null;
  course: ApplicationDetailCourse | null;
  university: ApplicationDetailUniversity | null;
  documents: ApplicationDetailDocument[];
} & ApplicationDetailReviewMeta;

export type ApplicationListProfile = Pick<
  Tables<"profile">,
  "id" | "first_name" | "last_name" | "avatar_url" | "email"
>;

export type ApplicationListAgent = Pick<
  Tables<"profile">,
  "id" | "first_name" | "last_name"
>;

export type ApplicationListDegree = Pick<
  Tables<"degree">,
  "id" | "name" | "fees" | "intake_date"
>;

export type ApplicationListCourse = Pick<
  Tables<"course">,
  "id" | "name" | "deadline_date"
> & {
  degree: ApplicationListDegree | null;
};

export type ApplicationListItem = Pick<
  Tables<"application">,
  "id" | "application_no" | "status" | "created_at"
> & {
  offer_letter: ApplicationDetailOfferLetter | null;
  documents_uploaded_count: number;
  total_required_documents: number;
  document_vault_percentage: number;
  student:
    | (ApplicationListProfile & {
        student_code: Tables<"student">["student_code"] | null;
      })
    | null;
  agent: ApplicationListAgent | null;
  course: ApplicationListCourse | null;
  rejection_history: ApplicationReviewHistoryEntry[];
};

export type ApplicationListResponse = {
  data: ApplicationListItem[];
  stats: ApplicationListStats;
  role: ApplicationProfileRole;
  pagination?: ApplicationListPagination;
};

export type ApplicationDashboardPageQuery = {
  q: string;
  status: string;
  degree_id: string;
  date_from: string;
  date_to: string;
  page: string;
  limit: string;
};

export type ApplicationDashboardPageData = {
  applications: ApplicationListResponse;
  query: ApplicationDashboardPageQuery;
};

export type ApplicationDetailPageData = {
  detail: ApplicationDetail | null;
  error: string | null;
};

export const ApplicationReviewActionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
    feedback: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.status === "REJECTED" || data.status === "NEEDS_REVISION") &&
      !data.feedback?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejection reason is required",
        path: ["feedback"],
      });
    }
  });

export type ApplicationReviewActionInput = z.infer<typeof ApplicationReviewActionSchema>;

export type ApplicationReviewHistoryEntry = {
  status: string;
  feedback: string | null;
  created_at: string;
  reviewed_by_profile_id: string | null;
  reviewed_by_name: string | null;
};

export type ApplicationDetailReviewMeta = {
  review_history: ApplicationReviewHistoryEntry[];
  rejection_history: ApplicationReviewHistoryEntry[];
  can_reject: boolean;
  can_resubmit: boolean;
};

export type CreateApplicationFormApi = Pick<
  ReactFormExtendedApi<
    CreateApplicationInput,
    undefined,
    typeof CreateApplicationSchema,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    unknown
  >,
  "setFieldValue" | "getFieldValue" | "store" | "Field" | "handleSubmit"
>;

export type ApplicationFormFieldRenderProps<TValue> = {
  state: {
    value: TValue;
    meta: {
      isValid: boolean;
      errors?: unknown[];
    };
  };
  form: {
    state: {
      isSubmitted: boolean;
    };
    getFieldValue: <TField extends keyof CreateApplicationInput>(
      field: TField
    ) => CreateApplicationInput[TField];
  };
  handleChange: (value: TValue) => void;
};

export function getApplicationFieldError(error: unknown): string | undefined {
  if (error == null) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}
