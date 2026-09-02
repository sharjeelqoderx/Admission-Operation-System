export const DEFAULT_IN_CHUNK_SIZE = 75

export function chunkArray<T>(items: readonly T[], chunkSize = DEFAULT_IN_CHUNK_SIZE): T[][] {
    if (chunkSize <= 0) {
        throw new Error("chunkSize must be positive")
    }

    const chunks: T[][] = []
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize))
    }
    return chunks
}

type ChunkQueryResult<T> = {
    data: T[] | null
    error: { message?: string } | null
}

export async function fetchInChunks<T>(
    ids: readonly string[],
    fetchChunk: (chunkIds: string[]) => Promise<ChunkQueryResult<T>>,
    chunkSize = DEFAULT_IN_CHUNK_SIZE
): Promise<{ data: T[]; error: ChunkQueryResult<T>["error"] }> {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (uniqueIds.length === 0) {
        return { data: [], error: null }
    }

    const results: T[] = []

    for (const chunk of chunkArray(uniqueIds, chunkSize)) {
        const { data, error } = await fetchChunk(chunk)
        if (error) {
            return { data: results, error }
        }
        if (data?.length) {
            results.push(...data)
        }
    }

    return { data: results, error: null }
}
