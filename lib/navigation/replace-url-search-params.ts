export function applyUrlSearchParamUpdates(updates: Record<string, string | null>) {
    if (typeof window === "undefined") {
        return
    }

    const params = new URLSearchParams(window.location.search)

    Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
    })

    const query = params.toString()
    const url = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname

    window.history.replaceState(window.history.state, "", url)
}

export function readUrlSearchParam(key: string) {
    if (typeof window === "undefined") {
        return ""
    }

    return new URLSearchParams(window.location.search).get(key) ?? ""
}
