import { Database } from "./supabase";

export const AppStatus = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    NEEDS_REVISION: "NEEDS_REVISION",
    PENDING: "PENDING"
} as const satisfies Record<string, Database["public"]["Enums"]["app_status_enum"]>;

export const OfferStatus = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED"
} as const satisfies Record<string, Database["public"]["Enums"]["offer_status_enum"]>;

export const Role = {
    STUDENT: "STUDENT",
    AGENT: "AGENT",
    UNIVERSITY: "UNIVERSITY",
    ADMIN: "ADMIN"
} as const satisfies Record<string, Database["public"]["Enums"]["role_enum"]>;
