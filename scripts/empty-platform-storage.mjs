import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env") })

const BUCKETS = ["student-admission"]

async function listAllObjectPaths(supabase, bucket, prefix = "") {
    const paths = []
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
    })

    if (error) {
        throw new Error(`Failed to list "${bucket}/${prefix}": ${error.message}`)
    }

    for (const entry of data ?? []) {
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name

        if (entry.id === null) {
            paths.push(...(await listAllObjectPaths(supabase, bucket, fullPath)))
            continue
        }

        paths.push(fullPath)
    }

    return paths
}

async function removePathsInBatches(supabase, bucket, paths) {
    const batchSize = 1000

    for (let index = 0; index < paths.length; index += batchSize) {
        const batch = paths.slice(index, index + batchSize)
        const { error } = await supabase.storage.from(bucket).remove(batch)

        if (error) {
            throw new Error(`Failed to delete objects from "${bucket}": ${error.message}`)
        }

        console.log(`Deleted ${Math.min(index + batchSize, paths.length)}/${paths.length} from ${bucket}`)
    }
}

async function emptyBucket(supabase, bucket) {
    const { error: emptyError } = await supabase.storage.emptyBucket(bucket)

    if (!emptyError) {
        console.log(`Emptied bucket: ${bucket}`)
        return
    }

    console.warn(`emptyBucket failed for ${bucket}: ${emptyError.message}. Falling back to batched remove.`)

    const paths = await listAllObjectPaths(supabase, bucket)

    if (paths.length === 0) {
        console.log(`Bucket already empty: ${bucket}`)
        return
    }

    await removePathsInBatches(supabase, bucket, paths)
    console.log(`Emptied bucket: ${bucket}`)
}

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
        throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env")
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    for (const bucket of BUCKETS) {
        await emptyBucket(supabase, bucket)
    }

    console.log("Storage reset complete.")
}

main().catch((error) => {
    console.error(error.message)
    process.exit(1)
})
