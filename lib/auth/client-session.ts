const SESSION_FLAG = "aos_session"

let sessionActive = false

function hasSessionCookie() {
    if (typeof document === "undefined") return false

    return document.cookie.split(";").some((part) => {
        const name = part.trim().split("=")[0] ?? ""
        return name === SESSION_FLAG
    })
}

export function isSessionActive() {
    return sessionActive
}

export function setSessionActive(active: boolean) {
    sessionActive = active

    if (typeof document === "undefined") return

    if (active) {
        document.cookie = `${SESSION_FLAG}=1; Path=/; SameSite=Lax`
        return
    }

    document.cookie = `${SESSION_FLAG}=; Path=/; Max-Age=0`
}

export function syncSessionActiveFromCookie() {
    sessionActive = hasSessionCookie()
    return sessionActive
}
