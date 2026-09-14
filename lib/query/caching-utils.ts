/**
 * Caching utilities for consistent data fetching across the app
 */

/**
 * Default stale time for queries (5 minutes)
 * Ensures smooth navigation while keeping data fresh
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000

/**
 * Default gcTime for queries (15 minutes)
 * Keeps data in cache longer to avoid refetch on back navigation
 */
export const DEFAULT_GC_TIME = 15 * 60 * 1000

/**
 * Default stale time for mutations (5 minutes)
 * Keeps mutation results cached
 */
export const DEFAULT_MUTATION_GC_TIME = 5 * 60 * 1000

/**
 * Configuration for React Query default options
 */
export const queryClientConfig = {
    defaultOptions: {
        queries: {
            staleTime: DEFAULT_STALE_TIME,
            gcTime: DEFAULT_GC_TIME,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
        },
        mutations: {
            gcTime: DEFAULT_MUTATION_GC_TIME,
        },
    },
}

/**
 * Check if a query matches initial data for optimistic rendering
 */
export function matchesInitialQuery<T extends Record<string, string | number>>({
    params,
    initialQuery,
}: {
    params: T
    initialQuery: Partial<T>
}): boolean {
    return Object.entries(params).every(([key, value]) => {
        const initialValue = initialQuery[key as keyof typeof initialQuery]
        return String(value) === String(initialValue)
    })
}
