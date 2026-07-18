import type { Enums } from "@/types/supabase"
import { Role } from "@/types/enums/role"

type RoleEnum = Enums<"role_enum">

export function isUniversityViewOnly(role: RoleEnum | string | null | undefined): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN
}
