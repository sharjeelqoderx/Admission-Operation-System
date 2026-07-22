import { Role } from "@/types/enums/role"

export function isUniversityRole(role: string | null | undefined): role is Role.ADMIN | Role.MANAGEMENT {
    return role === Role.ADMIN || role === Role.MANAGEMENT
}

export function isUniversityStaffRole(role: string | null | undefined): boolean {
    return isUniversityRole(role) || role === Role.SUPER_ADMIN
}

export function isDocumentStaffRole(role: string | null | undefined): boolean {
    return role === Role.AGENT || isUniversityStaffRole(role)
}

export function resolveUniversityScopeId(
    role: string | null | undefined,
    userId: string
): string | null {
    return isUniversityRole(role) ? userId : null
}
