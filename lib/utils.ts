import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Role } from "@/types/enums/role"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  [Role.AGENT]: "University Partner",
  [Role.STUDENT]: "Student",
  [Role.ADMIN]: "University",
  [Role.SUPER_ADMIN]: "Admin",
}

export function formatRoleLabel(role: string): string {
  return ROLE_DISPLAY_LABELS[role] ?? role
}
