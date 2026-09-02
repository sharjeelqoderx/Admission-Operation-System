import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { readCsv } from "./lib/csv-utils.mjs"

config({ path: resolve(process.cwd(), ".env") })

function parseReportCsv(path) {
    if (!existsSync(path)) {
        return null
    }
    const lines = readFileSync(path, "utf8").trim().split(/\r?\n/)
    const headers = lines[0].split(",")
    const statusIndex = headers.indexOf("status")
    const counts = {}

    for (const line of lines.slice(1)) {
        const cols = line.split(",")
        const status = cols[statusIndex]
        if (status) {
            counts[status] = (counts[status] ?? 0) + 1
        }
    }

    return counts
}

function parseDocumentReport(path) {
    if (!existsSync(path)) {
        return null
    }
    const lines = readFileSync(path, "utf8").trim().split(/\r?\n/)
    const counts = { INSERTED: 0, FAILED: 0, SKIPPED: 0, withFile: 0, withoutFile: 0 }

    for (const line of lines.slice(1)) {
        if (line.includes(",INSERTED,")) {
            counts.INSERTED += 1
            if (line.includes(":uploaded")) {
                counts.withFile += 1
            } else if (line.includes(":no-file")) {
                counts.withoutFile += 1
            }
        } else if (line.includes(",FAILED,")) {
            counts.FAILED += 1
        } else if (line.includes(",SKIPPED,")) {
            counts.SKIPPED += 1
        }
    }

    return counts
}

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY in .env")
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    const tables = [
        "profile",
        "student",
        "application",
        "document",
        "document_files",
        "document_review",
        "course",
        "degree",
        "campus",
        "levels",
        "document_type",
        "agent",
    ]

    const dbCounts = {}
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })
        if (error) {
            dbCounts[table] = `error: ${error.message}`
        } else {
            dbCounts[table] = count ?? 0
        }
    }

    const { count: studentProfiles } = await supabase
        .from("profile")
        .select("*", { count: "exact", head: true })
        .eq("role", "STUDENT")

    const studentsCsv = readCsv("students.csv").length
    const applicationsCsv = readCsv("applications.csv").length
    const documentsCsv = readCsv("studentdocumentsstatus.csv").length
    const accountsCsv = readCsv("accounts.csv").length
    const programsCsv = readCsv("programs.csv").length
    const campusesCsv = readCsv("campuses.csv").length

    const migrateDataReport = parseReportCsv(resolve("data/migrate-data.csv"))
    const documentReport = parseDocumentReport(resolve("data/migrate-documents.csv"))

    const { data: filesWithoutUrl } = await supabase
        .from("document_files")
        .select("id, file_url")
        .or("file_url.is.null,file_url.eq.")
        .limit(5)

    const { data: knackUrls } = await supabase
        .from("document_files")
        .select("id")
        .like("file_url", "%api.knack.com%")
        .limit(1)

    console.log("=== CSV Source Counts ===")
    console.log({
        students: studentsCsv,
        applications: applicationsCsv,
        student_documents: documentsCsv,
        accounts: accountsCsv,
        programs: programsCsv,
        campuses: campusesCsv,
    })

    console.log("\n=== Database Row Counts ===")
    console.log({ ...dbCounts, student_profiles: studentProfiles ?? 0 })

    console.log("\n=== migrate-data.csv Report ===")
    console.log(migrateDataReport ?? "not found")

    console.log("\n=== migrate-documents.csv Report ===")
    console.log(documentReport ?? "not found")

    console.log("\n=== Data Quality Checks ===")
    console.log({
        document_files_with_knack_url_remaining: knackUrls?.length ?? 0,
        document_files_missing_url_sample: filesWithoutUrl?.length ?? 0,
        documents_without_files:
            typeof dbCounts.document === "number" && typeof dbCounts.document_files === "number"
                ? Math.max(0, dbCounts.document - dbCounts.document_files)
                : "n/a",
    })

    const issues = []
    if ((studentProfiles ?? 0) < 100) {
        issues.push(`Low student profile count: ${studentProfiles}`)
    }
    if (typeof dbCounts.document_files === "number" && dbCounts.document_files < 500) {
        issues.push(`document_files still low: ${dbCounts.document_files}`)
    }
    if (knackUrls && knackUrls.length > 0) {
        issues.push("Some document_files still point to knack.com URLs")
    }

    if (issues.length > 0) {
        console.log("\n=== Issues ===")
        for (const issue of issues) {
            console.log(`- ${issue}`)
        }
    } else {
        console.log("\n=== Status ===")
        console.log("No critical issues detected in spot checks.")
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
