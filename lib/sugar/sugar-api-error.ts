import "server-only"

/** Parse Sugar REST / OAuth error bodies (see Sugar API exceptions docs). */
export function readSugarApiErrorMessage(
    body: unknown,
    fallback: string
): string {
    if (!body || typeof body !== "object") {
        return fallback
    }

    const record = body as Record<string, unknown>

    if (typeof record.error_message === "string" && record.error_message.trim()) {
        return record.error_message
    }

    if (typeof record.message === "string" && record.message.trim()) {
        return record.message
    }

    if (typeof record.error_description === "string" && record.error_description.trim()) {
        return record.error_description
    }

    if (typeof record.error === "string" && record.error.trim()) {
        return record.error
    }

    return fallback
}
