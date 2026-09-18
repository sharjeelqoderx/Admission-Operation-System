import "server-only"

export type SugarConfig = {
    baseUrl: string
    apiVersion: string
    username: string
    password: string
    platform: string
    clientId: string
    clientSecret: string
}

function requireEnv(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
    }
    return value
}

export function getSugarConfig(): SugarConfig {
    return {
        baseUrl: requireEnv("SUGAR_BASE_URL").replace(/\/+$/, ""),
        apiVersion: process.env.SUGAR_API_VERSION?.trim() || "11_24",
        username: requireEnv("SUGAR_USERNAME"),
        password: requireEnv("SUGAR_PASSWORD"),
        platform: requireEnv("SUGAR_PLATFORM"),
        clientId: process.env.SUGAR_CLIENT_ID?.trim() || "sugar",
        clientSecret: process.env.SUGAR_CLIENT_SECRET?.trim() || "",
    }
}

export function isSugarIntegrationConfigured(): boolean {
    return Boolean(
        process.env.SUGAR_BASE_URL?.trim() &&
            process.env.SUGAR_USERNAME?.trim() &&
            process.env.SUGAR_PASSWORD?.trim() &&
            process.env.SUGAR_PLATFORM?.trim()
    )
}

export function buildSugarRestUrl(path: string, config?: SugarConfig): string {
    const resolved = config ?? getSugarConfig()
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${resolved.baseUrl}/rest/v${resolved.apiVersion}${normalizedPath}`
}
