import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  AGENT: "University Partner",
  STUDENT: "Student",
  UNIVERSITY: "University",
  ADMIN: "Admin",
}

export function formatRoleLabel(role: string): string {
  return ROLE_DISPLAY_LABELS[role] ?? role
}
