let sessionActive =
    typeof document !== "undefined" &&
    document.cookie.split(";").some((part) => {
        const name = part.trim().split("=")[0] ?? ""
        return name.includes("-auth-token")
    })

export function isSessionActive() {
    return sessionActive
}

export function setSessionActive(active: boolean) {
    sessionActive = active
}

export function syncSessionActiveFromCookie() {
    if (typeof document === "undefined") {
        sessionActive = false
        return false
    }

    sessionActive = document.cookie.split(";").some((part) => {
        const name = part.trim().split("=")[0] ?? ""
        return name.includes("-auth-token")
    })

    return sessionActive
}
