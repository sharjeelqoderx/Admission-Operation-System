import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "csv-parse/sync"
import { createClient } from "@supabase/supabase-js"

function loadEnv(filePath) {
    const env = {}
    const content = readFileSync(filePath, "utf8")

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue

        const eqIndex = trimmed.indexOf("=")
        if (eqIndex === -1) continue

        const key = trimmed.slice(0, eqIndex).trim()
        let value = trimmed.slice(eqIndex + 1).trim()
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }
        env[key] = value
    }

    return env
}

function parseJson(value, fallback) {
    if (value == null || value === "") return fallback
    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

function parseBoolean(value) {
    if (typeof value === "boolean") return value
    return String(value).toLowerCase() === "true"
}

async function resolveCreatedByProfileId(supabase) {
    const preferredRoles = ["SUPER_ADMIN", "ADMIN", "AGENT"]

    for (const role of preferredRoles) {
        const { data, error } = await supabase
            .from("profile")
            .select("id, role, email")
            .eq("role", role)
            .limit(1)
            .maybeSingle()

        if (error) {
            throw new Error(`Failed to fetch ${role} profile: ${error.message}`)
        }

        if (data?.id) {
            return data
        }
    }

    const { data, error } = await supabase
        .from("profile")
        .select("id, role, email")
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(`Failed to fetch fallback profile: ${error.message}`)
    }

    if (!data?.id) {
        throw new Error("No profile found in target database. Create a user first.")
    }

    return data
}

async function main() {
    const rootDir = resolve(import.meta.dirname, "..")
    const env = loadEnv(resolve(rootDir, ".env"))
    const csvPath = resolve(rootDir, "node/document_template_rows.csv")

    const supabaseUrl = env.SUPABASE_URL
    const serviceKey = env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceKey) {
        throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env")
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })

    const csvContent = readFileSync(csvPath, "utf8")
    const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
    })

    if (rows.length === 0) {
        console.log("No rows found in CSV.")
        return
    }

    const ownerProfile = await resolveCreatedByProfileId(supabase)
    console.log(
        `Using created_by_profile_id=${ownerProfile.id} (${ownerProfile.role}${ownerProfile.email ? `, ${ownerProfile.email}` : ""})`
    )

    const payload = rows.map((row) => ({
        id: row.id,
        title: row.title,
        body_html: row.body_html ?? "",
        variables: parseJson(row.variables, []),
        checklist_items: parseJson(row.checklist_items, []),
        checklist_profile: row.checklist_profile || null,
        created_by_profile_id: ownerProfile.id,
        is_deleted: parseBoolean(row.is_deleted),
        created_at: row.created_at || undefined,
        updated_at: row.updated_at || undefined,
    }))

    const { data, error } = await supabase
        .from("document_template")
        .upsert(payload, { onConflict: "id" })
        .select("id, title, is_deleted")

    if (error) {
        throw new Error(`Import failed: ${error.message}`)
    }

    console.log(`Imported ${data?.length ?? 0} document templates successfully.`)
    for (const row of data ?? []) {
        console.log(`- ${row.id} | ${row.title} | deleted=${row.is_deleted}`)
    }
}

main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
})
