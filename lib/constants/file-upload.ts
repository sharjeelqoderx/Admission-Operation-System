/** Maximum allowed upload size for documents, images, and attachments. */
export const MAX_FILE_SIZE_MB = 20

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_MB}MB`

export const MAX_FILE_SIZE_ERROR_MESSAGE = `File is too large (Max ${MAX_FILE_SIZE_LABEL})`

export function isFileWithinSizeLimit(file: File): boolean {
    return file.size <= MAX_FILE_SIZE_BYTES
}

export function getFileSizeLimitError(fileName?: string): string {
    if (fileName) {
        return `"${fileName}" exceeds ${MAX_FILE_SIZE_LABEL} limit`
    }
    return MAX_FILE_SIZE_ERROR_MESSAGE
}

/** Zod refine predicate for File fields (skips non-File values). */
export function fileWithinSizeLimit(val: unknown): boolean {
    return !(val instanceof File) || isFileWithinSizeLimit(val)
}

export function findOversizedFile(files: File[]): File | undefined {
    return files.find((f) => !isFileWithinSizeLimit(f))
}

export function assertFilesWithinSizeLimit(...files: (File | null | undefined)[]): void {
    const oversized = findOversizedFile(
        files.filter((f): f is File => f instanceof File)
    )
    if (oversized) {
        throw new Error(getFileSizeLimitError(oversized.name))
    }
}
