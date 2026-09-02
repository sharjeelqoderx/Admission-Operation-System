import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { uploadDocumentToStorage } from "./lib/knack-storage.mjs"
import {
    buildStudentMapsFromCsv,
    extractKnackFileUrl,
    formatError,
    hydrateProfilesFromDb,
    loadGlobalDocumentMap,
    mapDocumentStatus,
    resolveDocumentType,
    resolveProfileByName,
} from "./lib/migration-helpers.mjs"
import { cleanText, escapeCsv, readCsv, stableUuid, DATA_DIR } from "./lib/csv-utils.mjs"

config({ path: resolve(process.cwd(), ".env") })

const ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000002"
const REPORT_PATH = resolve(DATA_DIR, "migrate-documents.csv")
const DRY_RUN = process.argv.includes("--dry-run")
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))
const LIMIT = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : null

/** @type {Array<{record_id:string,student:string,status:string,details:string,file_url:string,document_id:string}>} */
const report = []

function logRow(recordId, student, status, details = "", fileUrl = "", documentId = "") {
    report.push({
        record_id: recordId,
        student,
        status,
        details,
        file_url: fileUrl,
        document_id: documentId,
    })
}

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!DRY_RUN && (!supabaseUrl || !serviceRoleKey)) {
        throw new Error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY in .env")
    }

    const supabase = DRY_RUN
        ? null
        : createClient(supabaseUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false },
          })

    const documentMaps = loadGlobalDocumentMap()
    const students = readCsv("students.csv")
    const { profileByName, profileByEmail } = buildStudentMapsFromCsv(students)

    if (!DRY_RUN) {
        await hydrateProfilesFromDb(supabase, profileByName, profileByEmail)
    }

    const documents = readCsv("studentdocumentsstatus.csv")
    let processed = 0

    for (const row of documents) {
        if (LIMIT !== null && processed >= LIMIT) {
            break
        }

        const recordId = cleanText(row["Record ID"])
        const studentName = cleanText(row.Student)
        const documentName =
            cleanText(row["Document Name"]) ||
            cleanText(row["Global Document"]) ||
            cleanText(row["Document Type"])
        const profileId = resolveProfileByName(studentName, profileByName)
        const knackUrl = extractKnackFileUrl(row)

        if (!studentName || !documentName) {
            logRow(recordId, studentName, "SKIPPED", "Missing student or document name")
            continue
        }

        if (!profileId) {
            logRow(recordId, studentName, "SKIPPED", "Student profile not found")
            continue
        }

        const docType = resolveDocumentType(row, documentMaps)
        if (!docType) {
            logRow(recordId, studentName, "SKIPPED", `Unknown document type: ${documentName}`)
            continue
        }

        if (!knackUrl) {
            logRow(recordId, studentName, "SKIPPED", "No file URL in CSV")
            continue
        }

        const documentId = stableUuid(`csv:document:${recordId}`)
        const reviewStatus = mapDocumentStatus(row["Document Status"])

        try {
            const storedFileUrl = await uploadDocumentToStorage(supabase, supabaseUrl, {
                profileId,
                documentTypeId: docType.id,
                recordId,
                knackUrl,
                dryRun: DRY_RUN,
            })

            if (!DRY_RUN) {
                const { error: documentError } = await supabase.from("document").upsert(
                    {
                        id: documentId,
                        profile_id: profileId,
                        document_type_id: docType.id,
                        note: cleanText(row["Rejection Note"]) || null,
                        uploaded_by_profile_id: profileId,
                    },
                    { onConflict: "id" }
                )
                if (documentError) {
                    throw documentError
                }

                const { error: fileError } = await supabase.from("document_files").upsert(
                    {
                        id: stableUuid(`csv:document_file:${recordId}`),
                        document_id: documentId,
                        file_url: storedFileUrl,
                        type: "FRONT",
                    },
                    { onConflict: "id" }
                )
                if (fileError) {
                    throw fileError
                }

                const { error: reviewError } = await supabase.from("document_review").upsert(
                    {
                        id: stableUuid(`csv:document_review:${recordId}`),
                        document_id: documentId,
                        status: reviewStatus,
                        feedback: cleanText(row["Rejection Note"]) || null,
                        reviewed_by_profile_id: ADMIN_PROFILE_ID,
                    },
                    { onConflict: "id" }
                )
                if (reviewError) {
                    throw reviewError
                }
            }

            logRow(
                recordId,
                studentName,
                "INSERTED",
                `${docType.code}:${reviewStatus}:uploaded`,
                storedFileUrl ?? "",
                documentId
            )
            processed += 1

            if (processed % 25 === 0) {
                console.log(`Processed ${processed} documents...`)
            }
        } catch (error) {
            logRow(recordId, studentName, "FAILED", formatError(error))
        }
    }

    const header = ["record_id", "student", "status", "details", "file_url", "document_id"]
    const csvBody = [
        header.join(","),
        ...report.map((row) =>
            [
                escapeCsv(row.record_id),
                escapeCsv(row.student),
                escapeCsv(row.status),
                escapeCsv(row.details),
                escapeCsv(row.file_url),
                escapeCsv(row.document_id),
            ].join(",")
        ),
    ].join("\n")

    writeFileSync(REPORT_PATH, `${csvBody}\n`, "utf8")

    const summary = report.reduce((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1
        return acc
    }, {})

    console.log(`Wrote ${REPORT_PATH}`)
    console.log("Document migration summary:", summary)

    if (!DRY_RUN && supabase) {
        const { count: documentCount } = await supabase
            .from("document")
            .select("id", { count: "exact", head: true })
        const { count: fileCount } = await supabase
            .from("document_files")
            .select("id", { count: "exact", head: true })
        const { count: reviewCount } = await supabase
            .from("document_review")
            .select("id", { count: "exact", head: true })

        console.log("Database totals:", {
            documents: documentCount ?? 0,
            document_files: fileCount ?? 0,
            document_reviews: reviewCount ?? 0,
        })
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
