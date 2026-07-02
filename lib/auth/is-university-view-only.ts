import type { Enums } from "@/types/supabase"

type RoleEnum = Enums<"role_enum">

export function isUniversityViewOnly(role: RoleEnum | string | null | undefined): boolean {
    return role === "UNIVERSITY"
}
