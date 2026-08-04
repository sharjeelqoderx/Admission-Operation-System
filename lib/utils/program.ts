import type { CourseProgram } from "@/types/schemas/program"

export function deriveProgramCategory(degreeName?: string | null): string {
    if (!degreeName) return "General"

    const name = degreeName.toLowerCase()

    if (name.includes("mba")) return "Business & Management"
    if (name.includes("studienkolleg")) return "Foundation"
    if (name.includes("bachelor") || name.includes("b.sc") || name.includes("b.eng")) {
        if (name.includes("physio") || name.includes("occupational") || name.includes("care") || name.includes("physician")) {
            return "Medical & Health"
        }
        return "Engineering & IT"
    }
    if (name.includes("arts") || name.includes(" m.a")) return "Arts & Humanities"
    if (name.includes("master") || name.includes("m.sc") || name.includes(" m.a")) {
        return "Business & IT"
    }

    return "General"
}

export function formatProgramDate(value?: string | null): string {
    if (!value) return "Rolling"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

export function formatIntakeDate(value?: string | null): string {
    if (!value) return "N/A"

    const normalized = value.trim().toLowerCase()
    if (normalized === "summer") return "SUMMER"
    if (normalized === "winter") return "WINTER"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value.toUpperCase()

    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    })
}

export function formatStudyMode(value?: string | null): string {
    if (!value) return "Full Time"
    return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatProgramDuration(value?: string | null): string {
    if (!value?.trim()) return "N/A"

    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) {
        return `${trimmed} months`
    }

    return trimmed
}

export function formatTuitionFees(value?: string | null): string {
    if (!value?.trim()) return "Contact University"

    const trimmed = value.trim()
    if (/^\d+([.,]\d+)?$/.test(trimmed)) {
        return `€${trimmed}`
    }

    return trimmed.toLowerCase().includes("tuition") ? trimmed : `Tuition Fees: ${trimmed}`
}

export function matchesProgramCategory(course: CourseProgram, category: string): boolean {
    if (category === "ALL") return true
    return deriveProgramCategory(course.degree?.name) === category
}
