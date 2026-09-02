import { cleanText, extractUrl, normalizeKey, readCsv, stableUuid } from "./csv-utils.mjs"

const DOCUMENT_TYPE_CATEGORY_ALIASES = {
    identity: "PASSPORT",
    passport: "PASSPORT",
    cv: "CV",
    professional: "CV",
    "language proficiency": "LANGUAGE_SCORE",
    "language proficiency document": "LANGUAGE_SCORE",
    "work experience": "WORK_EXP_LETTER",
    "academic recognition": "APS",
    "secondary school education document": "SSC_MARKSHEET",
    "higher secondary ug diploma document": "HSC_UGD_MARKSHEET",
    "undergraduate degree document": "BD_AD_DEGREE",
}

export function formatError(error) {
    if (!error) {
        return "Unknown error"
    }
    if (typeof error === "string") {
        return error
    }
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error.message === "string") {
        return error.message
    }
    if (typeof error.error_description === "string") {
        return error.error_description
    }
    if (typeof error.details === "string") {
        return error.details
    }
    try {
        return JSON.stringify(error)
    } catch {
        return String(error)
    }
}

export function stripHonorific(name) {
    return cleanText(name).replace(/^(mr|ms|mrs|dr)\.?\s+/i, "").trim()
}

export function buildStudentMapsFromCsv(students) {
    const profileByName = new Map()
    const profileByEmail = new Map()
    const profileByRecordId = new Map()

    for (const row of students) {
        const recordId = cleanText(row["Record ID"])
        const email = cleanText(row.Email).toLowerCase()
        const fullName = cleanText(row["Full Name"])
        const profileId = stableUuid(`csv:student:${recordId}`)

        if (!recordId) {
            continue
        }

        profileByRecordId.set(recordId, profileId)
        if (email) {
            profileByEmail.set(email, profileId)
        }
        if (fullName) {
            profileByName.set(normalizeKey(fullName), profileId)
            profileByName.set(normalizeKey(stripHonorific(fullName)), profileId)
        }
    }

    return { profileByName, profileByEmail, profileByRecordId }
}

export function resolveProfileByName(studentName, profileByName) {
    const normalized = normalizeKey(studentName)
    if (!normalized) {
        return null
    }

    const direct = profileByName.get(normalized)
    if (direct) {
        return direct
    }

    const withoutTitle = normalizeKey(stripHonorific(studentName))
    if (profileByName.has(withoutTitle)) {
        return profileByName.get(withoutTitle)
    }

    let best = null
    for (const [key, profileId] of profileByName.entries()) {
        if (normalized.includes(key) || key.includes(normalized)) {
            if (!best || key.length > best.key.length) {
                best = { key, profileId }
            }
        }
    }

    return best?.profileId ?? null
}

export async function hydrateProfilesFromDb(supabase, profileByName, profileByEmail) {
    const { data, error } = await supabase
        .from("profile")
        .select("id, email, first_name, last_name, title, role")
        .eq("role", "STUDENT")

    if (error) {
        throw error
    }

    for (const profile of data ?? []) {
        if (profile.email) {
            profileByEmail.set(profile.email.toLowerCase(), profile.id)
        }

        const fullName = [profile.title, profile.first_name, profile.last_name].filter(Boolean).join(" ")
        if (fullName) {
            profileByName.set(normalizeKey(fullName), profile.id)
            profileByName.set(normalizeKey(stripHonorific(fullName)), profile.id)
        }

        const plainName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
        if (plainName) {
            profileByName.set(normalizeKey(plainName), profile.id)
        }
    }
}

export function loadGlobalDocumentMap() {
    const preferred = readCsv("globaldocument - globaldocument.csv")
    const fallback = readCsv("globaldocument.csv")
    const byName = new Map()
    const byCode = new Map()

    for (const row of [...fallback, ...preferred]) {
        const code = cleanText(row["Document Code"] || row.code)
        const name = cleanText(row["Document Name"] || row.name)
        if (!code || !name) {
            continue
        }
        const entry = { code, id: stableUuid(`document_type:${code}`) }
        byName.set(normalizeKey(name), entry)
        byCode.set(code, entry)
    }

    const aliases = [
        ["a valid passport copy", "PASSPORT"],
        ["curriculum vitae", "CV"],
        ["curriculum vitae cv", "CV"],
        ["english proficiency test", "LANGUAGE_SCORE"],
        ["aps certificate", "APS"],
        ["s s c marksheet", "SSC_MARKSHEET"],
        ["s s c passing certificate", "SSC_CERTIFICATE"],
        ["h s c ug diploma marksheet s", "HSC_UGD_MARKSHEET"],
        ["h s c ug diploma passing certificate", "HSC_UGD_CERTIFICATE"],
        ["bachelor advanced diploma all semester marksheets", "BD_AD_MARKSHEET"],
        ["bachelor s degree advanced diploma certificate", "BD_AD_DEGREE"],
        ["bachelor s degree advanced diploma transcript", "BD_AD_TRANSCRIPT"],
        ["work experience certificate", "WORK_EXP_LETTER"],
        ["bachelor s degree transcript", "BD_AD_TRANSCRIPT"],
        ["bachelor s degree certificate", "BD_AD_DEGREE"],
        ["bachelor advanced diploma marksheet for all semesters years", "BD_AD_MARKSHEET"],
        ["h s c passing certificate ug diploma certificate", "HSC_UGD_CERTIFICATE"],
        ["h s c ug diploma marksheet s", "HSC_UGD_MARKSHEET"],
        ["internship report", "WORK_EXP_LETTER"],
    ]

    for (const [alias, code] of aliases) {
        const entry = byCode.get(code) ?? { code, id: stableUuid(`document_type:${code}`) }
        byName.set(alias, entry)
        byCode.set(code, entry)
    }

    return { byName, byCode }
}

export function resolveDocumentType(row, documentMaps) {
    const candidates = [
        cleanText(row["Global Document"]),
        cleanText(row["Document Name"]),
        cleanText(row["Document Type for Admission Team"]),
    ].filter(Boolean)

    for (const candidate of candidates) {
        const direct = documentMaps.byName.get(normalizeKey(candidate))
        if (direct) {
            return direct
        }

        for (const [name, entry] of documentMaps.byName.entries()) {
            const normalized = normalizeKey(candidate)
            if (normalized.includes(name) || name.includes(normalized)) {
                return entry
            }
        }
    }

    const category = normalizeKey(row["Document Type"])
    const code = DOCUMENT_TYPE_CATEGORY_ALIASES[category]
    if (code) {
        return documentMaps.byCode.get(code) ?? null
    }

    return null
}

export function mapDocumentStatus(status) {
    const value = cleanText(status).toLowerCase()
    if (!value) {
        return "PENDING"
    }
    if (value.includes("reject")) {
        return "REJECTED"
    }
    if (value.includes("verified")) {
        return "VERIFIED"
    }
    if (value.includes("approv")) {
        return "APPROVED"
    }
    if (value.includes("review") || value.includes("pending")) {
        return "PENDING"
    }
    if (value.includes("revision") || value.includes("action")) {
        return "NEEDS_REVISION"
    }
    return "PENDING"
}

export function extractKnackFileUrl(row) {
    return (
        extractUrl(row["Upload Document : URL"]) ||
        extractUrl(row["Upload Document"]) ||
        null
    )
}
