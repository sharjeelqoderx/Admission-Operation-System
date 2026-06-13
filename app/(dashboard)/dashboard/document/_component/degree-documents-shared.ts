import type { DegreeDocumentBundle } from "@/types/schemas/document"

export type PendingEntry = {
    front: File | null
    note: string
}

export type PendingFilesMap = Record<string, PendingEntry>

export function getPendingKey(documentTypeId: string) {
    return documentTypeId
}

export function getDegreeLevels(
    degree: DegreeDocumentBundle["degree"]
): Array<{ id: string; name: string }> {
    if (degree.levels?.length) return degree.levels

    if (degree.level?.id) {
        return [
            {
                id: degree.level.id,
                name: degree.level.name,
            },
        ]
    }

    return []
}

export function getDocumentStatusBadgeClass(status: string) {
    switch (status.toUpperCase()) {
        case "VERIFIED":
        case "APPROVED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        case "REJECTED":
            return "border-red-200 bg-red-50 text-red-700"
        case "ACTION_REQUIRED":
        case "NEEDS_REVISION":
            return "border-orange-200 bg-orange-50 text-orange-700"
        case "PENDING":
        default:
            return "border-amber-200 bg-amber-50 text-amber-700"
    }
}

export function formatDocumentStatus(status: string) {
    return status.replace(/_/g, " ")
}

export function getPendingEntry(
    map: PendingFilesMap,
    documentTypeId: string
): PendingEntry {
    return (
        map[getPendingKey(documentTypeId)] ?? {
            front: null,
            note: "",
        }
    )
}

export function hasPendingFiles(entry: PendingEntry) {
    return Boolean(entry.front)
}

export function entryToFiles(entry: PendingEntry): File[] {
    const files: File[] = []
    if (entry.front) {
        files.push(entry.front)
    }
    return files
}
