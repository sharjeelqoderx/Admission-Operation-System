import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000002"
const OUTPUT = resolve(ROOT, "supabase/migrations/003_seed_platform_reference_data.sql")

function parseCsv(text) {
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

function readCsv(fileName) {
    const content = readFileSync(resolve(__dirname, fileName), "utf8").replace(/^\uFEFF/, "")
    return parseCsv(content)
}

function stableUuid(seed) {
    const hash = createHash("sha256").update(seed).digest("hex")
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

function sqlString(value) {
    if (value === null || value === undefined || value === "") {
        return "NULL"
    }
    return `'${String(value).replace(/'/g, "''")}'`
}

function cleanText(value) {
    return String(value ?? "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

function normalizeName(value) {
    return cleanText(value)
        .toLowerCase()
        .replace(/[’']/g, "'")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
}

function parseCredits(value) {
    const parsed = Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10)
    return Number.isFinite(parsed) ? parsed : null
}

function parseStudyMode(value) {
    const normalized = cleanText(value).toLowerCase()
    if (normalized.includes("part")) {
        return "part_time"
    }
    if (normalized.includes("full")) {
        return "full_time"
    }
    return null
}

function parseYesNo(value) {
    return String(value ?? "").trim().toLowerCase() === "yes"
}

function splitLevels(value) {
    return String(value ?? "")
        .split(",")
        .map((part) => cleanText(part))
        .filter(Boolean)
}

function loadGlobalDocuments() {
    const preferred = readCsv("../globaldocument - globaldocument.csv")
    const fallback = readCsv("globaldocument.csv")

    const byCode = new Map()
    const byName = new Map()

    for (const row of [...fallback, ...preferred]) {
        const code = cleanText(row["Document Code"] || row.code)
        if (!code) {
            continue
        }

        const record = {
            code,
            name: cleanText(row["Document Name"] || row.name),
            type: cleanText(row["Document Type"] || row.type) || null,
            description: cleanText(row.Description || row.description) || null,
            isActive: parseYesNo(row["Is Active"] ?? row.is_active ?? "Yes"),
            mayExpire: parseYesNo(row["Expiry Applicable?"] ?? row.may_expire ?? "No"),
            applicableLevels: splitLevels(row["Applicable Level"] || row.applicable_level || row["Degree Levels"]),
        }

        byCode.set(code, record)
        byName.set(normalizeName(record.name), record)
    }

    return { byCode, byName, documents: [...byCode.values()] }
}

function resolveDocumentCode(documentName, globalDocuments) {
    const normalized = normalizeName(documentName)
    const direct = globalDocuments.byName.get(normalized)
    if (direct) {
        return direct.code
    }

    for (const [name, record] of globalDocuments.byName.entries()) {
        if (normalized.includes(name) || name.includes(normalized)) {
            return record.code
        }
    }

    throw new Error(`Unable to map document "${documentName}" to a global document code`)
}

function buildLevelRequirements(documentRequirements, globalDocuments) {
    const requirementsByLevel = new Map()

    for (const row of documentRequirements) {
        const levelName = cleanText(row["Degree Level"])
        const documentName = cleanText(row["Global Document Name"])
        if (!levelName || !documentName) {
            continue
        }

        const code = resolveDocumentCode(documentName, globalDocuments)
        if (!requirementsByLevel.has(levelName)) {
            requirementsByLevel.set(levelName, new Set())
        }
        requirementsByLevel.get(levelName).add(code)
    }

    return requirementsByLevel
}

function buildSql() {
    const degreeLevels = readCsv("degreelevels.csv")
    const campuses = readCsv("campuses.csv")
    const programs = readCsv("programs.csv")
    const documentRequirements = readCsv("documentrequirements.csv")
    const globalDocuments = loadGlobalDocuments()
    const requirementsByLevel = buildLevelRequirements(documentRequirements, globalDocuments)

    const lines = [
        "-- ============================================================",
        "-- 003_seed_platform_reference_data.sql",
        "-- Generated from /data CSV exports + globaldocument.csv",
        "-- Run: node data/index.js",
        "-- ============================================================",
        "",
        "BEGIN;",
        "",
        "DELETE FROM public.degree_requirement;",
        "DELETE FROM public.document_type_level;",
        "DELETE FROM public.course;",
        "DELETE FROM public.degree;",
        "DELETE FROM public.document_type",
        "WHERE code IS NULL OR code NOT LIKE 'AGENT_%';",
        "DELETE FROM public.levels;",
        "DELETE FROM public.campus",
        `WHERE profile_id = '${ADMIN_PROFILE_ID}'::uuid;`,
        "",
    ]

    const levelIds = new Map()
    for (const row of degreeLevels) {
        const name = cleanText(row["Study Level"])
        if (!name) {
            continue
        }
        const id = stableUuid(`level:${name}`)
        levelIds.set(name, id)
        lines.push(
            `INSERT INTO public.levels (id, name, university_id) VALUES (${sqlString(id)}::uuid, ${sqlString(name)}, ${sqlString(ADMIN_PROFILE_ID)}::uuid) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, university_id = EXCLUDED.university_id;`
        )
    }

    lines.push("")

    const documentTypeIds = new Map()
    for (const document of globalDocuments.documents) {
        const id = stableUuid(`document_type:${document.code}`)
        documentTypeIds.set(document.code, id)
        lines.push(
            `INSERT INTO public.document_type (id, name, code, type, description, is_active, may_expire, university_id) VALUES (${sqlString(id)}::uuid, ${sqlString(document.name)}, ${sqlString(document.code)}, ${sqlString(document.type)}, ${sqlString(document.description)}, ${document.isActive}, ${document.mayExpire}, ${sqlString(ADMIN_PROFILE_ID)}::uuid) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, description = EXCLUDED.description, is_active = EXCLUDED.is_active, may_expire = EXCLUDED.may_expire, university_id = EXCLUDED.university_id;`
        )
    }

    lines.push("")

    for (const document of globalDocuments.documents) {
        const documentTypeId = documentTypeIds.get(document.code)
        for (const levelName of document.applicableLevels) {
            const levelId = levelIds.get(levelName)
            if (!levelId) {
                continue
            }
            lines.push(
                `INSERT INTO public.document_type_level (document_type_id, level_id) SELECT ${sqlString(documentTypeId)}::uuid, ${sqlString(levelId)}::uuid WHERE NOT EXISTS (SELECT 1 FROM public.document_type_level WHERE document_type_id = ${sqlString(documentTypeId)}::uuid AND level_id = ${sqlString(levelId)}::uuid);`
            )
        }
    }

    lines.push("")

    const campusIds = new Map()
    for (const row of campuses) {
        const name = cleanText(row["Campus Name"])
        if (!name) {
            continue
        }
        const id = stableUuid(`campus:${name}`)
        campusIds.set(name, id)
        const location = cleanText(row.Location)
        const city = cleanText(row["Location : City"])
        const country = cleanText(row["Location : Country"]) || "Germany"
        lines.push(
            `INSERT INTO public.campus (id, profile_id, name, location, status, campus_type) VALUES (${sqlString(id)}::uuid, ${sqlString(ADMIN_PROFILE_ID)}::uuid, ${sqlString(name)}, ${sqlString(location || `${name}, ${city}, ${country}`)}, 'ACTIVE', 'BRANCH') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, status = EXCLUDED.status, campus_type = EXCLUDED.campus_type;`
        )
    }

    lines.push("")

    const degreeIds = new Map()
    for (const row of programs) {
        const recordId = cleanText(row["Record ID"])
        const programName = cleanText(row["Program Name"])
        const levelName = cleanText(row["Degree Level"] || row["Study Level"])
        const campusName = cleanText(row.Campus)
        const awardedDegree = cleanText(row["Awarded Degree "]) || cleanText(row["Awarded Degree"])
        const tuitionFee = cleanText(row["Tuition Fee"])
        const duration = cleanText(row["Duration of studies"] || row["Study Duration Year"])
        const language = cleanText(row["Language of Study"]) || null
        const credits = parseCredits(row.ECTS)
        const studyMode = parseStudyMode(row["Study Type"])
        const programDescription = cleanText(row["Program Description "]) || cleanText(row["Program Description"])
        const academicRequirement = cleanText(row["Academic Requirement"])
        const englishRequirement = cleanText(row["English Requirement"])
        const admissionRequirements = [academicRequirement, englishRequirement].filter(Boolean).join("\n\n") || null

        if (!recordId || !programName || !levelName) {
            continue
        }

        const degreeId = stableUuid(`degree:${recordId}`)
        const courseId = stableUuid(`course:${recordId}`)
        const levelId = levelIds.get(levelName)

        degreeIds.set(recordId, degreeId)

        lines.push(
            `INSERT INTO public.degree (id, name, credits, location, language_of_study, duration, fees, study_mode, level_id) VALUES (${sqlString(degreeId)}::uuid, ${sqlString(awardedDegree || programName)}, ${credits ?? "NULL"}, ${sqlString(campusName)}, ${sqlString(language)}, ${sqlString(duration)}, ${sqlString(tuitionFee)}, ${studyMode ? sqlString(studyMode) : "NULL"}, ${levelId ? `${sqlString(levelId)}::uuid` : "NULL"});`
        )

        lines.push(
            `INSERT INTO public.course (id, name, degree_id, location, program_length, program_detail, admission_requirements, category, status, is_deleted) VALUES (${sqlString(courseId)}::uuid, ${sqlString(programName)}, ${sqlString(degreeId)}::uuid, ${sqlString(campusName)}, ${sqlString(duration)}, ${sqlString(programDescription)}, ${sqlString(admissionRequirements)}, ${sqlString(levelName)}, 'ACTIVE', false);`
        )

        const requiredCodes = requirementsByLevel.get(levelName) ?? new Set()
        for (const code of requiredCodes) {
            const documentTypeId = documentTypeIds.get(code)
            if (!documentTypeId) {
                continue
            }
            lines.push(
                `INSERT INTO public.degree_requirement (degree_id, document_type_id, requirement_type) VALUES (${sqlString(degreeId)}::uuid, ${sqlString(documentTypeId)}::uuid, 'REQUIRED') ON CONFLICT (degree_id, document_type_id) DO NOTHING;`
            )
        }

        lines.push("")
    }

    lines.push(
        `UPDATE public.document_type`,
        `SET university_id = ${sqlString(ADMIN_PROFILE_ID)}::uuid`,
        `WHERE university_id IS NULL;`,
        "",
        "COMMIT;",
        ""
    )
    return lines.join("\n")
}

const sql = buildSql()
writeFileSync(OUTPUT, sql, "utf8")
console.log(`Wrote ${OUTPUT}`)
