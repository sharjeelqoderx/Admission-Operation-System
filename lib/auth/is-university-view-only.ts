import type { Enums } from "@/types/supabase"
import { Role } from "@/types/enums/role"
import { isUniversityRole } from "@/lib/auth/university-role"

type RoleEnum = Enums<"role_enum">

export function isUniversityViewOnly(role: RoleEnum | string | null | undefined): boolean {
    return isUniversityRole(role)
}
