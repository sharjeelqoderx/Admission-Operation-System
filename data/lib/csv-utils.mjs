import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = resolve(__dirname, "..")

export function parseCsv(text) {
    const rows = []
    let row = []
    let field = ""
    let inQuotes = false

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index]
        const next = text[index + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                field += '"'
                index += 1
            } else if (char === '"') {
                inQuotes = false
            } else {
                field += char
            }
            continue
        }

        if (char === '"') {
            inQuotes = true
        } else if (char === ",") {
            row.push(field)
            field = ""
        } else if (char === "\n" || (char === "\r" && next === "\n")) {
            row.push(field)
            field = ""
            if (row.some((value) => value.length > 0)) {
                rows.push(row)
            }
            row = []
            if (char === "\r") {
                index += 1
            }
        } else if (char !== "\r") {
            field += char
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    const headers = rows[0]
    return rows.slice(1).map((values) =>
        Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]))
    )
}

export function readCsv(fileName) {
    const content = readFileSync(resolve(DATA_DIR, fileName), "utf8").replace(/^\uFEFF/, "")
    return parseCsv(content)
}

export function stableUuid(seed) {
    const hash = createHash("sha256").update(seed).digest("hex")
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

export function cleanText(value) {
    return String(value ?? "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
}

export function normalizeKey(value) {
    return cleanText(value)
        .toLowerCase()
        .replace(/[’']/g, "'")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
}

export function parseDate(value) {
    const text = cleanText(value)
    if (!text) {
        return null
    }

    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (slashMatch) {
        const [, day, month, year] = slashMatch
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    return null
}

export function extractUrl(value) {
    const text = String(value ?? "")
    const direct = text.match(/https?:\/\/[^\s"'<>]+/i)
    return direct?.[0] ?? null
}

export function parseMoney(value) {
    const digits = String(value ?? "").replace(/[^\d.,-]/g, "").replace(/,/g, "")
    const parsed = Number.parseFloat(digits)
    return Number.isFinite(parsed) ? parsed : null
}

export function escapeCsv(value) {
    const text = String(value ?? "")
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`
    }
    return text
}
