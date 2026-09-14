export type DocumentListPagination = {
    total: number
    page: number
    limit: number
    totalPages: number
}

export function parseDocumentPageLimit(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10))
    return { page, limit }
}

export function paginateDocumentRows<T>(items: T[], page: number, limit: number) {
    const total = items.length
    const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / limit))
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const start = (safePage - 1) * limit

    return {
        data: items.slice(start, start + limit),
        pagination: {
            total,
            page: safePage,
            limit,
            totalPages,
        } satisfies DocumentListPagination,
    }
}
