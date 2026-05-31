import type { QueryClient } from "@tanstack/react-query"

/** Wipes client query cache so the next user never sees the previous session's data. */
export function clearSessionQueryCache(queryClient: QueryClient) {
    queryClient.clear()
}
