import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
    SugarCreateRecordResponseSchema,
    SugarLogicInteractionPayloadSchema,
    SugarOAuthTokenResponseSchema,
    type SugarLogicInteractionPayload,
} from "@/types/schemas/sugar"
import { buildSugarRestUrl, getSugarConfig, type SugarConfig } from "@/lib/sugar/config"
import { readSugarApiErrorMessage } from "@/lib/sugar/sugar-api-error"

const SUGAR_PROVIDER = "sugar"
const TOKEN_EXPIRY_BUFFER_MS = 60_000

const SUGAR_JSON_HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
} as const

type AccountRow = Database["public"]["Tables"]["account"]["Row"]

type StoredTokens = {
    accessToken: string
    refreshToken: string | null
    tokenExpiresAt: string | null
}

function tokenIsValid(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) return false
    const expiryMs = new Date(expiresAt).getTime()
    return Number.isFinite(expiryMs) && expiryMs - TOKEN_EXPIRY_BUFFER_MS > Date.now()
}

function resolveTokenExpiry(expiresIn?: number): string | null {
    if (!expiresIn || expiresIn <= 0) return null
    return new Date(Date.now() + expiresIn * 1000).toISOString()
}

async function requestSugarToken(
    payload: Record<string, string>,
    config: SugarConfig
): Promise<StoredTokens> {
    const response = await fetch(buildSugarRestUrl("/oauth2/token", config), {
        method: "POST",
        headers: SUGAR_JSON_HEADERS,
        body: JSON.stringify(payload),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            readSugarApiErrorMessage(body, `Sugar OAuth failed with status ${response.status}`)
        )
    }

    const parsed = SugarOAuthTokenResponseSchema.parse(body)

    return {
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token ?? null,
        tokenExpiresAt: resolveTokenExpiry(parsed.expires_in),
    }
}

async function upsertAccountTokens(
    supabase: SupabaseClient<Database>,
    config: SugarConfig,
    tokens: StoredTokens
) {
    const { error } = await supabase.from("account").upsert(
        {
            provider: SUGAR_PROVIDER,
            username: config.username,
            platform: config.platform,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_expires_at: tokens.tokenExpiresAt,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "provider,username,platform" }
    )

    if (error) {
        throw new Error(`Failed to persist Sugar OAuth tokens: ${error.message}`)
    }
}

async function loadAccountRow(
    supabase: SupabaseClient<Database>,
    config: SugarConfig
): Promise<AccountRow | null> {
    const { data, error } = await supabase
        .from("account")
        .select("*")
        .eq("provider", SUGAR_PROVIDER)
        .eq("username", config.username)
        .eq("platform", config.platform)
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to load Sugar account tokens: ${error.message}`)
    }

    return data
}

export async function getSugarAccessToken(
    supabase: SupabaseClient<Database>,
    config = getSugarConfig()
): Promise<string> {
    const account = await loadAccountRow(supabase, config)

    if (account?.access_token && tokenIsValid(account.token_expires_at)) {
        return account.access_token
    }

    if (account?.refresh_token) {
        try {
            const refreshed = await requestSugarToken(
                {
                    grant_type: "refresh_token",
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: account.refresh_token,
                    platform: config.platform,
                },
                config
            )

            await upsertAccountTokens(supabase, config, refreshed)
            return refreshed.accessToken
        } catch (error) {
            console.warn("Sugar refresh token failed, requesting new password grant:", error)
        }
    }

    const issued = await requestSugarToken(
        {
            grant_type: "password",
            client_id: config.clientId,
            client_secret: config.clientSecret,
            username: config.username,
            password: config.password,
            platform: config.platform,
        },
        config
    )

    await upsertAccountTokens(supabase, config, issued)
    return issued.accessToken
}

/**
 * POST /rest/v{version}/{module} — create Logic_interactions record (Sugar REST module POST).
 * Record: name = AdmissionTool, JSON field = stringified admission payload.
 */
export async function createSugarLogicInteraction(
    accessToken: string,
    payload: SugarLogicInteractionPayload,
    config = getSugarConfig()
): Promise<string> {
    const validated = SugarLogicInteractionPayloadSchema.parse(payload)
    const jsonField = config.logicInteractionJsonField
    const record: Record<string, string> = {
        name: config.logicInteractionName,
        [jsonField]: JSON.stringify(validated),
    }

    const modulePath = `/${config.logicInteractionModule.replace(/^\/+/, "")}`
    const response = await fetch(buildSugarRestUrl(modulePath, config), {
        method: "POST",
        headers: {
            ...SUGAR_JSON_HEADERS,
            "OAuth-Token": accessToken,
        },
        body: JSON.stringify(record),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        throw new Error(
            readSugarApiErrorMessage(
                body,
                `Sugar ${config.logicInteractionModule} create failed with status ${response.status}`
            )
        )
    }

    const parsed = SugarCreateRecordResponseSchema.parse(body)
    return parsed.id
}
