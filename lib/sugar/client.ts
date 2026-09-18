import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
    SugarCreateRecordResponseSchema,
    SugarOAuthTokenResponseSchema,
    type SugarLogicInteractionPayload,
} from "@/types/schemas/sugar"
import { buildSugarRestUrl, getSugarConfig, type SugarConfig } from "@/lib/sugar/config"

const SUGAR_PROVIDER = "sugar"
const TOKEN_EXPIRY_BUFFER_MS = 60_000

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        const message =
            body && typeof body === "object" && "error_message" in body
                ? String(body.error_message)
                : `Sugar OAuth failed with status ${response.status}`
        throw new Error(message)
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

export async function createSugarLogicInteraction(
    accessToken: string,
    payload: SugarLogicInteractionPayload,
    config = getSugarConfig()
): Promise<string> {
    const response = await fetch(buildSugarRestUrl("/Logic_interactions", config), {
        method: "POST",
        headers: {
            "OAuth-Token": accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
        const message =
            body && typeof body === "object" && "error_message" in body
                ? String(body.error_message)
                : `Sugar Logic_interactions create failed with status ${response.status}`
        throw new Error(message)
    }

    const parsed = SugarCreateRecordResponseSchema.parse(body)
    return parsed.id
}
