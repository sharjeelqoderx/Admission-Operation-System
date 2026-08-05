import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Role } from "@/types/enums/role"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  [Role.AGENT]: "University Partner",
  agent: "University Partner",
  partner: "University Partner",
  "university-partner": "University Partner",
  [Role.STUDENT]: "Student",
  student: "Student",
  [Role.ADMIN]: "Admin",
  admin: "Admin",
  [Role.MANAGEMENT]: "Management",
  management: "Management",
  [Role.SUPER_ADMIN]: "Admin",
  super_admin: "Admin",
}

export function formatRoleLabel(role: string): string {
  return ROLE_DISPLAY_LABELS[role] ?? ROLE_DISPLAY_LABELS[role.toLowerCase()] ?? role
}
