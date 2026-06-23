import { useSyncExternalStore } from "react"

function subscribe() {
    return () => {}
}

function getClientSnapshot() {
    return true
}

function getServerSnapshot() {
    return false
}

/** True only after hydration — keeps SSR and the first client render in sync. */
export function useClientReady() {
    return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
