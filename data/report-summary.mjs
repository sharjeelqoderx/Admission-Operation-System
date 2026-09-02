import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const path = resolve("data/migrate-data.csv")
const lines = readFileSync(path, "utf8").trim().split(/\r?\n/)

function parseLine(line) {
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

function countBy(file, entity) {
    const counts = {}
    for (const line of lines.slice(1)) {
        if (!line.startsWith(file)) {
            continue
        }
        const parts = parseLine(line)
        if (parts[2] !== entity) {
            continue
        }
        const status = parts[4]
        counts[status] = (counts[status] ?? 0) + 1
    }
    return counts
}

console.log(JSON.stringify({
    students: countBy("students.csv", "student_user"),
    applications: countBy("applications.csv", "application"),
    accounts: countBy("accounts.csv", "staff_user"),
}, null, 2))
