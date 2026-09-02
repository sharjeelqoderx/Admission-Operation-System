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
import {
    cleanText,
    escapeCsv,
    extractUrl,
    normalizeKey,
    parseDate,
    parseMoney,
    readCsv,
    stableUuid,
    DATA_DIR,
} from "./lib/csv-utils.mjs"

config({ path: resolve(process.cwd(), ".env") })

const PASSWORD = "Fhm@1234"
const ADMIN_PROFILE_ID = "00000000-0000-0000-0000-000000000002"
const DEFAULT_AGENT_PROFILE_ID = "00000000-0000-0000-0000-000000000003"
const RESERVED_EMAILS = new Set([
    "developer@gmail.com",
    "admin@gmail.com",
    "agent@gmail.com",
    "management@gmail.com",
    "student@gmail.com",
    "student+agent@gmail.com",
])

const REPORT_PATH = resolve(DATA_DIR, "migrate-data.csv")
const DRY_RUN = process.argv.includes("--dry-run")
const SKIP_DOCUMENTS = process.argv.includes("--skip-documents")

/** @type {Array<{source_file:string,record_id:string,entity_type:string,email:string,status:string,details:string,new_id:string}>} */
const report = []

function logRow(sourceFile, recordId, entityType, email, status, details = "", newId = "") {
    report.push({
        source_file: sourceFile,
        record_id: recordId,
        entity_type: entityType,
        email,
        status,
        details,
        new_id: newId,
    })
}

function buildCourseMap() {
    const programs = readCsv("programs.csv")
    const byName = new Map()

    for (const row of programs) {
        const recordId = cleanText(row["Record ID"])
        const name = cleanText(row["Program Name"])
        if (!recordId || !name) {
            continue
        }
        const courseId = stableUuid(`course:${recordId}`)
        byName.set(normalizeKey(name), { courseId, recordId, name })
    }

    return byName
}

function resolveCourse(programName, courseByName) {
    const normalized = normalizeKey(programName)
    const direct = courseByName.get(normalized)
    if (direct) {
        return direct
    }

    let best = null
    for (const [key, value] of courseByName.entries()) {
        if (normalized.includes(key) || key.includes(normalized)) {
            if (!best || key.length > best.key.length) {
                best = { key, value }
            }
        }
    }

    return best?.value ?? null
}

function mapAccountRole(userRole) {
    const role = cleanText(userRole).toLowerCase()
    if (role.includes("administrator")) {
        return "SUPER_ADMIN"
    }
    if (role.includes("university partner")) {
        return "AGENT"
    }
    if (
        role.includes("campus admin") ||
        role.includes("admission officer") ||
        role.includes("finance")
    ) {
        return "MANAGEMENT"
    }
    return "MANAGEMENT"
}

function mapApplicationStatus(status) {
    const value = cleanText(status).toLowerCase()
    if (!value || value.includes("draft")) {
        return "PENDING"
    }
    if (value.includes("reject")) {
        return "REJECTED"
    }
    if (value.includes("approv") || value.includes("complet") || value.includes("enrol")) {
        return "APPROVED"
    }
    if (value.includes("revision")) {
        return "NEEDS_REVISION"
    }
    return "PENDING"
}

function mapQualification(value) {
    const normalized = normalizeKey(value)
    if (!normalized) {
        return "higher_secondary"
    }
    if (
        normalized.includes("higher secondary") ||
        normalized.includes("12th") ||
        normalized.includes("matric") ||
        normalized.includes("intermediate")
    ) {
        return "higher_secondary"
    }
    if (normalized.includes("undergraduate diploma") || normalized.includes("advanced diploma")) {
        return "bachelor_ongoing"
    }
    if (normalized.includes("bachelor") && normalized.includes("ongoing")) {
        return "bachelor_ongoing"
    }
    if (normalized.includes("bachelor")) {
        return "bachelor_completed"
    }
    if (
        normalized.includes("master") ||
        normalized.includes("mba") ||
        normalized.includes("mphil") ||
        normalized.includes("phd")
    ) {
        return "master"
    }
    if (normalized.includes("diploma") || normalized.includes("foundation")) {
        return "higher_secondary"
    }
    return "higher_secondary"
}

function mapGenderFromTitle(title) {
    const value = cleanText(title).toLowerCase()
    if (value.startsWith("mr")) {
        return "MALE"
    }
    if (value.startsWith("ms") || value.startsWith("mrs")) {
        return "FEMALE"
    }
    return null
}

function requiresAps(country) {
    const normalized = cleanText(country).toLowerCase()
    return ["india", "china", "pakistan", "vietnam"].includes(normalized)
}

function resolveAgentId(partnerName, agentByPartnerName, defaultAgentId) {
    const key = normalizeKey(partnerName)
    if (!key) {
        return defaultAgentId
    }
    if (agentByPartnerName.has(key)) {
        return agentByPartnerName.get(key)
    }
    if (key.includes("welcome center")) {
        return defaultAgentId
    }
    return defaultAgentId
}

async function findUserByEmail(supabase, email) {
    const normalizedEmail = email.toLowerCase()
    let page = 1

    while (page <= 20) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage: 1000,
        })
        if (error) {
            throw error
        }

        const found = (data.users ?? []).find(
            (user) => user.email?.toLowerCase() === normalizedEmail
        )
        if (found) {
            return found
        }

        if ((data.users ?? []).length < 1000) {
            break
        }
        page += 1
    }

    return null
}

async function ensureAuthUser(supabase, {
    id,
    email,
    role,
    firstName,
    lastName,
    title,
    phone,
}) {
    if (!email) {
        throw new Error("Missing email")
    }

    if (DRY_RUN) {
        return { id, email }
    }

    const payload = {
        id,
        email: email.toLowerCase(),
        password: PASSWORD,
        email_confirm: true,
        app_metadata: {
            provider: "email",
            providers: ["email"],
            role,
        },
        user_metadata: {
            first_name: firstName || null,
            last_name: lastName || null,
            title: title || null,
            phone: phone || null,
            role,
        },
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser(payload)
    if (!createError) {
        return created.user
    }

    if (!String(createError.message).toLowerCase().includes("already") && createError.code !== "email_exists") {
        throw createError
    }

    const existing = await findUserByEmail(supabase, email)
    if (!existing) {
        throw createError
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
        email_confirm: true,
        app_metadata: payload.app_metadata,
        user_metadata: payload.user_metadata,
    })
    if (updateError) {
        throw updateError
    }

    return existing
}

async function upsertProfile(supabase, profile) {
    if (DRY_RUN) {
        return
    }
    const { error } = await supabase.from("profile").upsert(profile, { onConflict: "id" })
    if (error) {
        throw error
    }
}

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!DRY_RUN && (!supabaseUrl || !serviceRoleKey)) {
        throw new Error(
            "Missing SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env"
        )
    }

    const supabase = DRY_RUN
        ? null
        : createClient(supabaseUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false },
          })

    const documentMaps = loadGlobalDocumentMap()
    const courseByName = buildCourseMap()

    const seededReferenceFiles = [
        "campuses.csv",
        "degreelevels.csv",
        "documentrequirements.csv",
        "programs.csv",
        "globaldocument.csv",
        "globaldocument - globaldocument.csv",
    ]
    for (const fileName of seededReferenceFiles) {
        const rows = readCsv(fileName)
        for (const row of rows) {
            const recordId = cleanText(row["Record ID"]) || cleanText(row["Document Code"]) || cleanText(row["Campus Name"]) || cleanText(row["Study Level"])
            logRow(fileName, recordId, "reference_data", "", "ALREADY_SEEDED", "Handled by migration 003")
        }
    }

    const agentByPartnerName = new Map()
    const profileByEmail = new Map()
    const profileByName = new Map()
    const studentProfileByOldId = new Map()

    const students = readCsv("students.csv")
    const studentMaps = buildStudentMapsFromCsv(students)
    for (const [key, value] of studentMaps.profileByEmail.entries()) {
        profileByEmail.set(key, value)
    }
    for (const [key, value] of studentMaps.profileByName.entries()) {
        profileByName.set(key, value)
    }
    for (const [key, value] of studentMaps.profileByRecordId.entries()) {
        studentProfileByOldId.set(key, value)
    }

    const accounts = readCsv("accounts.csv")
    for (const row of accounts) {
        const recordId = cleanText(row["Record ID"])
        const email = cleanText(row.Email).toLowerCase()
        const firstName = cleanText(row["Name : First"]) || cleanText(row.Name)
        const lastName = cleanText(row["Name : Last"])
        const title = cleanText(row["Name : Title"])
        const role = mapAccountRole(row["User Roles"])
        const profileId = stableUuid(`csv:account:${recordId}`)

        if (!email) {
            logRow("accounts.csv", recordId, "staff_user", "", "SKIPPED", "Missing email")
            continue
        }

        if (RESERVED_EMAILS.has(email)) {
            logRow("accounts.csv", recordId, "staff_user", email, "SKIPPED", "Reserved dev seed email")
            continue
        }

        try {
            const user = await ensureAuthUser(supabase, {
                id: profileId,
                email,
                role,
                firstName,
                lastName,
                title,
                phone: null,
            })
            const actualProfileId = user.id

            await upsertProfile(supabase, {
                id: actualProfileId,
                first_name: firstName || null,
                last_name: lastName || null,
                title: title || null,
                email,
                phone: null,
                role,
                date_of_birth: null,
                gender: null,
            })

            if (role === "AGENT" && !DRY_RUN) {
                const { error: agentError } = await supabase.from("agent").upsert(
                    {
                        id: actualProfileId,
                        profile_id: actualProfileId,
                        contact_person_first_name: firstName || null,
                        contact_person_last_name: lastName || null,
                        country: "Germany",
                    },
                    { onConflict: "profile_id" }
                )
                if (agentError) {
                    throw agentError
                }
            }

            profileByEmail.set(email, actualProfileId)
            const partnerKey = normalizeKey(row.Name)
            if (partnerKey) {
                agentByPartnerName.set(partnerKey, actualProfileId)
            }
            if (partnerKey.includes("welcome center")) {
                agentByPartnerName.set("welcome center 1", actualProfileId)
                agentByPartnerName.set("welcome center india", actualProfileId)
            }

            logRow("accounts.csv", recordId, "staff_user", email, "INSERTED", role, actualProfileId)
        } catch (error) {
            logRow(
                "accounts.csv",
                recordId,
                "staff_user",
                email,
                "FAILED",
                error instanceof Error ? error.message : formatError(error)
            )
        }
    }

    let defaultAgentId = agentByPartnerName.get("welcome center 1") ?? DEFAULT_AGENT_PROFILE_ID

    const seenStudentEmails = new Set()

    for (const row of students) {
        const recordId = cleanText(row["Record ID"])
        const email = cleanText(row.Email).toLowerCase()
        const firstName = cleanText(row["Full Name : First"]) || cleanText(row["getNameFirst"])
        const lastName = cleanText(row["Full Name : Last"]) || cleanText(row["getNameLast"])
        const title = cleanText(row["Full Name : Title"]) || cleanText(row["getNameTitle"])
        const phone = cleanText(row.Phone)
        const fullName = cleanText(row["Full Name"])
        const profileId = stableUuid(`csv:student:${recordId}`)

        if (!email) {
            logRow("students.csv", recordId, "student_user", "", "SKIPPED", "Missing email")
            continue
        }

        if (RESERVED_EMAILS.has(email)) {
            logRow("students.csv", recordId, "student_user", email, "SKIPPED", "Reserved dev seed email")
            continue
        }

        if (seenStudentEmails.has(email)) {
            logRow("students.csv", recordId, "student_user", email, "SKIPPED", "Duplicate email in CSV")
            continue
        }
        seenStudentEmails.add(email)

        try {
            const user = await ensureAuthUser(supabase, {
                id: profileId,
                email,
                role: "STUDENT",
                firstName,
                lastName,
                title,
                phone,
            })
            const actualProfileId = user.id

            const dob = parseDate(row["Date of Birth"])
            const gender = mapGenderFromTitle(title)
            await upsertProfile(supabase, {
                id: actualProfileId,
                first_name: firstName || null,
                last_name: lastName || null,
                title: title || null,
                email,
                phone: phone || null,
                role: "STUDENT",
                date_of_birth: dob,
                gender,
            })

            const agentId = resolveAgentId(row["University Partner"], agentByPartnerName, defaultAgentId)
            const country = cleanText(row["Address : Country"] || row["getAddressCountry"])
            const studentPayload = {
                id: actualProfileId,
                profile_id: actualProfileId,
                created_by_agent_id: agentId,
                nationality: cleanText(row.Nationality) || null,
                country: country || null,
                city: cleanText(row["Address : City"] || row["getAddressCity"]) || null,
                state: cleanText(row["Address : State"] || row["getAddressState"]) || null,
                street_1: cleanText(row["Address : Street 1"] || row["getAddressStreet"]) || null,
                street_2: cleanText(row["Address : Street 2"] || row["getAddressStreet2"]) || null,
                post_code: cleanText(row["Address : Zip"] || row["getAddressZip"]) || null,
                zip_code: cleanText(row["Address : Zip"] || row["getAddressZip"]) || null,
                address: cleanText(row.Address) || null,
                aps_requirement:
                    cleanText(row["APS Required ? "]).toLowerCase() === "yes" || requiresAps(country),
            }

            if (!DRY_RUN) {
                const { error: studentError } = await supabase.from("student").upsert(studentPayload, {
                    onConflict: "profile_id",
                })
                if (studentError) {
                    throw studentError
                }

                const qualification = mapQualification(row["Highest Qualification"])
                const { error: educationError } = await supabase.from("education").upsert(
                    {
                        id: stableUuid(`csv:education:${recordId}`),
                        profile_id: actualProfileId,
                        qualification,
                        institution_name: null,
                    },
                    { onConflict: "id" }
                )
                if (educationError) {
                    throw educationError
                }
            }

            profileByEmail.set(email, actualProfileId)
            if (fullName) {
                profileByName.set(normalizeKey(fullName), actualProfileId)
            }

            studentProfileByOldId.set(recordId, actualProfileId)
            logRow("students.csv", recordId, "student_user", email, "INSERTED", "student+education", actualProfileId)
        } catch (error) {
            logRow(
                "students.csv",
                recordId,
                "student_user",
                email,
                "FAILED",
                error instanceof Error ? error.message : formatError(error)
            )
        }
    }

    if (!DRY_RUN) {
        await hydrateProfilesFromDb(supabase, profileByName, profileByEmail)
    }

    const applicationByRecordId = new Map()
    const applications = readCsv("applications.csv")

    for (const row of applications) {
        const recordId = cleanText(row["Record ID"])
        const studentName = cleanText(row.Student)
        const email = cleanText(row["Student Email-ID"]).toLowerCase()
        const programName = cleanText(row.Program) || cleanText(row["Program Name"])
        const course = resolveCourse(programName, courseByName)
        const profileId =
            profileByEmail.get(email) || resolveProfileByName(studentName, profileByName)
        const applicationId = stableUuid(`csv:application:${recordId}`)

        if (!profileId) {
            logRow(
                "applications.csv",
                recordId,
                "application",
                studentName || email,
                "SKIPPED",
                "Student profile not found"
            )
            continue
        }

        if (!course) {
            logRow(
                "applications.csv",
                recordId,
                "application",
                email,
                "SKIPPED",
                `Course not found for program: ${programName}`
            )
            continue
        }

        try {
            if (!DRY_RUN) {
                const { error: applicationError } = await supabase.from("application").upsert(
                    {
                        id: applicationId,
                        profile_id: profileId,
                        course_id: course.courseId,
                        university_id: ADMIN_PROFILE_ID,
                        submitted_by_profile_id: resolveAgentId(
                            row["University Partner"],
                            agentByPartnerName,
                            defaultAgentId
                        ),
                        application_no: cleanText(row["Application No."]) || null,
                        status: mapApplicationStatus(row["Application Status"]),
                    },
                    { onConflict: "id" }
                )
                if (applicationError) {
                    throw applicationError
                }

                const offerUrl =
                    extractUrl(row["Conditional Offer Letter : URL"]) ||
                    extractUrl(row["Unconditional Offer Letter   : URL"])
                if (offerUrl) {
                    const { error: offerError } = await supabase.from("offer_letter").upsert(
                        {
                            id: stableUuid(`csv:offer:${recordId}`),
                            application_id: applicationId,
                            file_url: offerUrl,
                            status: "PENDING",
                            issued_by_profile_id: ADMIN_PROFILE_ID,
                        },
                        { onConflict: "id" }
                    )
                    if (offerError) {
                        throw offerError
                    }
                }
            }

            applicationByRecordId.set(recordId, applicationId)
            logRow(
                "applications.csv",
                recordId,
                "application",
                email,
                "INSERTED",
                course.name,
                applicationId
            )
        } catch (error) {
            logRow(
                "applications.csv",
                recordId,
                "application",
                email,
                "FAILED",
                error instanceof Error ? error.message : formatError(error)
            )
        }
    }

    const documents = readCsv("studentdocumentsstatus.csv")
    if (!SKIP_DOCUMENTS) {
    for (const row of documents) {
        const recordId = cleanText(row["Record ID"])
        const studentName = cleanText(row.Student)
        const documentName =
            cleanText(row["Document Name"]) ||
            cleanText(row["Global Document"]) ||
            cleanText(row["Document Type"])
        const profileId = resolveProfileByName(studentName, profileByName)

        if (!studentName || !documentName) {
            logRow(
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                "",
                "SKIPPED",
                "Missing student or document name"
            )
            continue
        }

        if (!profileId) {
            logRow(
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                studentName,
                "SKIPPED",
                "Student profile not found"
            )
            continue
        }

        const docType = resolveDocumentType(row, documentMaps)
        if (!docType) {
            logRow(
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                studentName,
                "SKIPPED",
                `Unknown document type: ${documentName}`
            )
            continue
        }

        const knackUrl = extractKnackFileUrl(row)
        if (!knackUrl) {
            logRow(
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                studentName,
                "SKIPPED",
                "No file URL in CSV"
            )
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
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                studentName,
                "INSERTED",
                `${docType.code}:${reviewStatus}:uploaded`,
                documentId
            )
        } catch (error) {
            logRow(
                "studentdocumentsstatus.csv",
                recordId,
                "document",
                studentName,
                "FAILED",
                formatError(error)
            )
        }
    }
    } else {
        console.log("Skipping document migration (--skip-documents).")
    }

    const payments = readCsv("payments.csv")
    for (const row of payments) {
        const recordId = cleanText(row["Record ID"])
        logRow(
            "payments.csv",
            recordId,
            "payment",
            "",
            "SKIPPED",
            "No application link in CSV export"
        )
    }

    const noTableFiles = [
        ["conditions.csv", "condition"],
        ["commission.csv", "commission"],
        ["invoices.csv", "invoice"],
        ["intakes.csv", "intake"],
        ["applicationcommunicationlog.csv", "application_note"],
        ["postadmissiondocuments.csv", "post_admission_document"],
    ]

    for (const [fileName, entityType] of noTableFiles) {
        const rows = readCsv(fileName)
        for (const row of rows) {
            const recordId = cleanText(row["Record ID"])
            logRow(fileName, recordId, entityType, "", "SKIPPED", "No matching database table")
        }
    }

    const header = [
        "source_file",
        "record_id",
        "entity_type",
        "email",
        "status",
        "details",
        "new_id",
    ]
    const csvBody = [
        header.join(","),
        ...report.map((row) =>
            [
                escapeCsv(row.source_file),
                escapeCsv(row.record_id),
                escapeCsv(row.entity_type),
                escapeCsv(row.email),
                escapeCsv(row.status),
                escapeCsv(row.details),
                escapeCsv(row.new_id),
            ].join(",")
        ),
    ].join("\n")

    writeFileSync(REPORT_PATH, `${csvBody}\n`, "utf8")

    const summary = report.reduce((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1
        return acc
    }, {})

    console.log(`Wrote ${REPORT_PATH}`)
    console.log("Migration summary:", summary)
    if (DRY_RUN) {
        console.log("Dry run only — no database writes performed.")
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
