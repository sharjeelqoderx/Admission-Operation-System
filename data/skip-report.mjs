import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

function parseCsvLine(line) {
    const parts = []
    let current = ""
    let inQuotes = false
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        if (char === '"') {
            inQuotes = !inQuotes
            continue
        }
        if (char === "," && !inQuotes) {
            parts.push(current)
            current = ""
            continue
        }
        current += char
    }
    parts.push(current)
    return parts
}

function summarizeReport(filePath, columns) {
    if (!existsSync(filePath)) {
        return null
    }

    const lines = readFileSync(filePath, "utf8").trim().split(/\r?\n/)
    const headers = parseCsvLine(lines[0])
    const statusIdx = headers.indexOf(columns.status)
    const detailsIdx = headers.indexOf(columns.details)
    const sourceIdx = columns.source ? headers.indexOf(columns.source) : -1
    const entityIdx = columns.entity ? headers.indexOf(columns.entity) : -1

    const byStatus = {}
    const skipReasons = {}
    const failReasons = {}

    for (const line of lines.slice(1)) {
        const parts = parseCsvLine(line)
        const status = parts[statusIdx] ?? "UNKNOWN"
        byStatus[status] = (byStatus[status] ?? 0) + 1

        const details = parts[detailsIdx] ?? ""
        if (status === "SKIPPED" && details) {
            const key = sourceIdx >= 0 ? `${parts[sourceIdx]} | ${details}` : details
            skipReasons[key] = (skipReasons[key] ?? 0) + 1
        }
        if (status === "FAILED" && details) {
            const key = sourceIdx >= 0 ? `${parts[sourceIdx]} | ${details}` : details
            failReasons[key] = (failReasons[key] ?? 0) + 1
        }
    }

    return { total: lines.length - 1, byStatus, skipReasons, failReasons }
}

const core = summarizeReport(resolve("data/migrate-data.csv"), {
    source: "source_file",
    entity: "entity_type",
    status: "status",
    details: "details",
})

const docs = summarizeReport(resolve("data/migrate-documents.csv"), {
    status: "status",
    details: "details",
})

function topEntries(map, limit = 15) {
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([reason, count]) => ({ count, reason }))
}

console.log(JSON.stringify({
    core_migration: core
        ? {
              total_rows: core.total,
              by_status: core.byStatus,
              top_skip_reasons: topEntries(core.skipReasons),
              top_fail_reasons: topEntries(core.failReasons),
          }
        : null,
    document_migration: docs
        ? {
              total_rows: docs.total,
              by_status: docs.byStatus,
              top_skip_reasons: topEntries(docs.skipReasons),
              top_fail_reasons: topEntries(docs.failReasons),
          }
        : null,
}, null, 2))
