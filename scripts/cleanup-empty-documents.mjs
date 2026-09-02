import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env") })

const DRY_RUN = process.argv.includes("--dry-run")

function chunkArray(items, size) {
    const chunks = []
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size))
    }
    return chunks
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

    const documentIdsWithFiles = new Set()
    const pageSize = 1000
    let fileOffset = 0

    while (true) {
        const { data, error } = await supabase
            .from("document_files")
            .select("document_id")
            .range(fileOffset, fileOffset + pageSize - 1)

        if (error) {
            throw error
        }

        for (const row of data ?? []) {
            if (row.document_id) {
                documentIdsWithFiles.add(row.document_id)
            }
        }

        if (!data || data.length < pageSize) {
            break
        }

        fileOffset += pageSize
    }

    const emptyDocumentIds = []
    let documentOffset = 0

    while (true) {
        const { data, error } = await supabase
            .from("document")
            .select("id")
            .range(documentOffset, documentOffset + pageSize - 1)

        if (error) {
            throw error
        }

        for (const row of data ?? []) {
            if (!documentIdsWithFiles.has(row.id)) {
                emptyDocumentIds.push(row.id)
            }
        }

        if (!data || data.length < pageSize) {
            break
        }

        documentOffset += pageSize
    }

    console.log(
        `Found ${emptyDocumentIds.length} documents without files (keeping ${documentIdsWithFiles.size} with files).`
    )

    if (emptyDocumentIds.length === 0) {
        return
    }

    if (DRY_RUN) {
        console.log("Dry run only — no deletes performed.")
        console.log("Sample ids:", emptyDocumentIds.slice(0, 5))
        return
    }

    let deleted = 0
    for (const chunk of chunkArray(emptyDocumentIds, 100)) {
        const { error } = await supabase.from("document").delete().in("id", chunk)
        if (error) {
            throw error
        }
        deleted += chunk.length
        console.log(`Deleted ${deleted}/${emptyDocumentIds.length}...`)
    }

    const { count: remainingDocuments } = await supabase
        .from("document")
        .select("id", { count: "exact", head: true })
    const { count: remainingReviews } = await supabase
        .from("document_review")
        .select("id", { count: "exact", head: true })

    console.log("Cleanup complete:", {
        deleted_documents: deleted,
        remaining_documents: remainingDocuments ?? 0,
        remaining_document_files: documentIdsWithFiles.size,
        remaining_document_reviews: remainingReviews ?? 0,
    })
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
