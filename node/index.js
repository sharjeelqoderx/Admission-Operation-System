/**
 * Knack → Supabase import
 *
 * Usage (from repo root):
 *   node node/index.js
 *
 * Optional:
 *   IMPORT_DRY_RUN=1 node node/index.js
 *   IMPORT_LIMIT_STUDENTS=5 node node/index.js   # smoke test
 *
 * Password for every created auth user: fhm@12345
 */

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { createClient } = require("@supabase/supabase-js")

const ROOT = path.join(__dirname, "..")
const DATA_DIR = __dirname
const DEFAULT_PASSWORD = "fhm@12345"
const UNIVERSITY_PROFILE_ID = "00000000-0000-0000-0000-000000000002"
const DRY_RUN = process.env.IMPORT_DRY_RUN === "1"
const LIMIT_STUDENTS = process.env.IMPORT_LIMIT_STUDENTS
  ? Number(process.env.IMPORT_LIMIT_STUDENTS)
  : null

// ─── env ─────────────────────────────────────────────────────
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnv(path.join(ROOT, ".env"))
loadEnv(path.join(ROOT, ".env.local"))

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// knackId → actual auth/profile uuid (may differ if email already existed)
const idMap = new Map()
const stats = {
  createdUsers: 0,
  reusedUsers: 0,
  errors: [],
}

// ─── helpers ─────────────────────────────────────────────────
function loadRecords(fileName) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), "utf8"))
  return Array.isArray(raw) ? raw : raw.records || []
}

/** Deterministic UUID from any string key (MD5 → UUID layout). */
function uuidFrom(...parts) {
  const hash = crypto.createHash("md5").update(parts.join(":")).digest("hex")
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

function remember(knackId, uuid) {
  if (knackId) idMap.set(String(knackId), uuid)
  return uuid
}

function resolveId(knackId, ...namespace) {
  if (!knackId) return null
  const key = String(knackId)
  if (idMap.has(key)) return idMap.get(key)
  const uuid = uuidFrom(...(namespace.length ? namespace : ["knack"]), key)
  return remember(key, uuid)
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function isoDate(raw) {
  if (!raw) return null
  if (typeof raw === "string") {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  if (raw.proper_iso_timestamp) return raw.proper_iso_timestamp.slice(0, 10)
  if (raw.iso_timestamp) return raw.iso_timestamp.slice(0, 10)
  return null
}

function isoTimestamp(raw) {
  if (!raw) return null
  if (typeof raw === "string") {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return raw.proper_iso_timestamp || raw.iso_timestamp || null
}

function connId(raw) {
  if (!Array.isArray(raw) || !raw.length) return null
  return raw[0]?.id || null
}

function connIds(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => x?.id).filter(Boolean)
}

function connLabel(raw) {
  if (!Array.isArray(raw) || !raw.length) return null
  return raw[0]?.identifier || null
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function mapAppStatus(value) {
  const s = String(Array.isArray(value) ? value[0] : value || "")
    .trim()
    .toLowerCase()
  if (s.includes("reject")) return "REJECTED"
  if (s.includes("revision") || s.includes("document pending")) return "NEEDS_REVISION"
  if (s.includes("approve") || s.includes("conditional offer") || s.includes("offer issued"))
    return "APPROVED"
  return "PENDING"
}

function mapDocStatus(value) {
  const s = String(value || "")
    .trim()
    .toLowerCase()
  // Live DB enum: APPROVED | REJECTED | NEEDS_REVISION
  if (s.includes("approve") || s === "verified") return "APPROVED"
  if (s.includes("reject")) return "REJECTED"
  return "NEEDS_REVISION"
}

function mapGender(title) {
  const t = String(title || "").toLowerCase()
  if (t.startsWith("mr")) return "MALE"
  if (t.startsWith("ms") || t.startsWith("mrs") || t.startsWith("miss")) return "FEMALE"
  return null
}

function mapStudyMode(value) {
  const s = String(value || "").toLowerCase()
  if (s.includes("part")) return "part_time"
  if (s.includes("full")) return "full_time"
  return null
}

function mapIntakeSeason(name) {
  const s = String(name || "").toLowerCase()
  if (s.includes("summer") || s.includes("sommer")) return "summer"
  if (s.includes("winter") || s.includes("winter")) return "winter"
  return null
}

function parseMoney(value) {
  if (value == null || value === "") return null
  const n = Number(String(value).replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) ? n : null
}

function intOrNull(value) {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n) : null
}

function normalizeName(value) {
  return stripHtml(value).toLowerCase().replace(/\s+/g, " ").trim()
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function upsert(table, rows, onConflict = "id") {
  if (!rows.length) return { count: 0 }
  if (DRY_RUN) {
    console.log(`  [dry-run] ${table}: ${rows.length} rows`)
    return { count: rows.length }
  }
  let inserted = 0
  for (const batch of chunk(rows, 100)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict })
    if (error) {
      stats.errors.push(`${table}: ${error.message}`)
      console.error(`  ✗ ${table} upsert failed:`, error.message)
      // try row-by-row so one bad row does not kill the batch
      for (const row of batch) {
        const { error: rowErr } = await supabase.from(table).upsert(row, { onConflict })
        if (rowErr) {
          stats.errors.push(`${table}/${row.id}: ${rowErr.message}`)
          console.error(`    ✗ ${table} ${row.id}:`, rowErr.message)
        } else {
          inserted++
        }
      }
    } else {
      inserted += batch.length
    }
  }
  console.log(`  ✓ ${table}: ${inserted}/${rows.length}`)
  return { count: inserted }
}

async function ensureAuthUser({ knackId, email, metadata, role }) {
  const desiredId = resolveId(knackId)
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail) throw new Error(`Missing email for knack id ${knackId}`)

  if (DRY_RUN) {
    remember(knackId, desiredId)
    stats.createdUsers++
    return desiredId
  }

  // Prefer existing profile by email (idempotent re-runs)
  const { data: existingProfile } = await supabase
    .from("profile")
    .select("id, role")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (existingProfile?.id) {
    remember(knackId, existingProfile.id)
    stats.reusedUsers++
    await supabase
      .from("profile")
      .update({
        title: metadata.title || null,
        first_name: metadata.first_name || null,
        last_name: metadata.last_name || null,
        phone: metadata.phone || null,
        date_of_birth: metadata.date_of_birth || null,
        gender: metadata.gender || null,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
    return existingProfile.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    id: desiredId,
    email: normalizedEmail,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { ...metadata, role },
  })

  if (error) {
    // Retry without forced id if id collision, or resolve by listing
    const msg = error.message || ""
    if (/already|registered|exists/i.test(msg)) {
      const { data: byEmail } = await supabase
        .from("profile")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle()
      if (byEmail?.id) {
        remember(knackId, byEmail.id)
        stats.reusedUsers++
        return byEmail.id
      }
    }
    throw new Error(`createUser(${normalizedEmail}): ${msg}`)
  }

  const userId = data.user.id
  remember(knackId, userId)
  stats.createdUsers++

  // Ensure profile fields (trigger may have created a stub)
  await supabase.from("profile").upsert({
    id: userId,
    email: normalizedEmail,
    title: metadata.title || null,
    first_name: metadata.first_name || null,
    last_name: metadata.last_name || null,
    phone: metadata.phone || null,
    date_of_birth: metadata.date_of_birth || null,
    gender: metadata.gender || null,
    role,
  })

  await sleep(80)
  return userId
}

// ─── import steps ────────────────────────────────────────────
async function ensureUniversity() {
  console.log("\n[1] University profile")
  const { data } = await supabase
    .from("profile")
    .select("id")
    .eq("id", UNIVERSITY_PROFILE_ID)
    .maybeSingle()

  if (data?.id) {
    console.log("  ✓ university profile exists:", UNIVERSITY_PROFILE_ID)
    return UNIVERSITY_PROFILE_ID
  }

  if (DRY_RUN) {
    console.log("  [dry-run] would ensure university", UNIVERSITY_PROFILE_ID)
    return UNIVERSITY_PROFILE_ID
  }

  const email = "fhm@gmail.com"
  const { error } = await supabase.auth.admin.createUser({
    id: UNIVERSITY_PROFILE_ID,
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "UNIVERSITY",
      first_name: "FHM",
      last_name: "University",
      title: "",
    },
  })
  if (error && !/already|registered|exists/i.test(error.message)) {
    throw error
  }

  await supabase.from("profile").upsert({
    id: UNIVERSITY_PROFILE_ID,
    email,
    first_name: "FHM",
    last_name: "University",
    role: "UNIVERSITY",
  })
  await supabase.from("university").upsert({
    id: uuidFrom("university-row", UNIVERSITY_PROFILE_ID),
    profile_id: UNIVERSITY_PROFILE_ID,
    country: "Germany",
    website: "https://www.fh-mittelstand.de",
  })
  console.log("  ✓ university ensured")
  return UNIVERSITY_PROFILE_ID
}

async function importLevels() {
  console.log("\n[2] Degree levels → levels")
  const rows = loadRecords("degree-levels.json").map((r) => {
    const id = resolveId(r.id, "level")
    return {
      id,
      name: r.field_322_raw || r.field_322 || "Unknown",
      university_id: UNIVERSITY_PROFILE_ID,
      created_at: isoTimestamp(r.field_324_raw) || undefined,
      updated_at: isoTimestamp(r.field_325_raw) || undefined,
    }
  })
  await upsert("levels", rows)
  return rows
}

async function importDocumentTypes(levels) {
  console.log("\n[3] Documents → document_type + document_type_level")
  const levelByName = new Map(levels.map((l) => [l.name.toLowerCase(), l.id]))
  const docs = loadRecords("document.json")

  const { data: existingTypes } = await supabase
    .from("document_type")
    .select("id, name, code")
  const byCode = new Map()
  const byName = new Map()
  for (const t of existingTypes || []) {
    if (t.code) byCode.set(String(t.code).toUpperCase(), t.id)
    if (t.name) byName.set(normalizeName(t.name), t.id)
  }

  const typeRows = []
  const levelLinks = []

  for (const r of docs) {
    const name = r.field_291_raw || r.field_291 || "Document"
    const code = (r.field_295_raw || r.field_295 || "").toString().trim() || null
    const existingId =
      (code && byCode.get(code.toUpperCase())) || byName.get(normalizeName(name)) || null

    const id = existingId || resolveId(r.id, "document_type")
    remember(r.id, id)

    if (!existingId) {
      typeRows.push({
        id,
        name,
        code,
        type: r.field_296_raw || r.field_296 || null,
        description: stripHtml(r.field_297_raw || r.field_297 || "") || null,
        is_active: r.field_298_raw !== false,
        may_expire: Boolean(r.field_300_raw),
        university_id: UNIVERSITY_PROFILE_ID,
        created_at: isoTimestamp(r.field_293_raw) || undefined,
        updated_at: isoTimestamp(r.field_294_raw) || undefined,
      })
      if (code) byCode.set(code.toUpperCase(), id)
      byName.set(normalizeName(name), id)
    } else {
      console.log(`  · reuse document_type ${code || name} → ${id}`)
    }

    const levelNames = r.field_370_raw || r.field_309_raw || []
    for (const levelName of levelNames) {
      const levelId = levelByName.get(String(levelName).toLowerCase())
      if (!levelId) continue
      levelLinks.push({
        id: uuidFrom("document_type_level", r.id, levelName),
        document_type_id: id,
        level_id: levelId,
      })
    }
  }

  await upsert("document_type", typeRows)
  await upsert("document_type_level", levelLinks)
}

async function importAgents() {
  console.log("\n[4] Agents (Welcome Center / International Admission)")
  const students = loadRecords("students.json")
  const apps = loadRecords("applications.json")
  const logs = loadRecords("application-communication-log.json")
  const agentMeta = new Map()

  const consider = (raw, emailHint) => {
    for (const a of raw || []) {
      if (!a?.id) continue
      if (!agentMeta.has(a.id)) {
        agentMeta.set(a.id, {
          id: a.id,
          name: a.identifier || "Agent",
          email: emailHint || null,
        })
      } else if (emailHint && !agentMeta.get(a.id).email) {
        agentMeta.get(a.id).email = emailHint
      }
    }
  }

  for (const s of students) {
    consider(s.field_221_raw)
    consider(s.field_261_raw)
  }
  for (const a of apps) {
    consider(a.field_263_raw, a.field_417 || null)
    consider(a.field_265_raw)
  }
  for (const l of logs) {
    consider(l.field_427_raw)
  }

  // Fallback emails for known agents
  const emailFallback = {
    "69b7debafe833cbe585aeeb0": "wci1@fhm.com",
    "69bbd82d900ac5ecbd7b75a3": "ia1@fhm.com",
    "69bbd82d900ac5ecbd7b75a4": "ia1-notes@fhm.com",
  }

  const agentRows = []
  for (const agent of agentMeta.values()) {
    const email =
      agent.email ||
      emailFallback[agent.id] ||
      `${stripHtml(agent.name).toLowerCase().replace(/[^a-z0-9]+/g, ".")}@fhm.import`

    const parts = stripHtml(agent.name).split(/\s+/)
    const profileId = await ensureAuthUser({
      knackId: agent.id,
      email,
      role: "AGENT",
      metadata: {
        title: "",
        first_name: parts[0] || "Agent",
        last_name: parts.slice(1).join(" ") || "Import",
      },
    })

    // agency_name is in generated types but not on the live DB yet
    agentRows.push({
      id: profileId,
      profile_id: profileId,
      contact_person_first_name: parts[0] || null,
      contact_person_last_name: parts.slice(1).join(" ") || null,
      country: "Germany",
      website: null,
    })
  }

  await upsert("agent", agentRows)
  const agentIds = new Set(agentRows.map((a) => a.id))
  globalThis.__importedAgentIds = agentIds
  console.log(`  agents prepared: ${agentRows.length}`)
}

async function importCampuses() {
  console.log("\n[5] Campuses → campus")
  const rows = loadRecords("campuses.json").map((r) => {
    const addr = r.field_26_raw || {}
    return {
      id: resolveId(r.id, "campus"),
      profile_id: UNIVERSITY_PROFILE_ID,
      name: r.field_25_raw || r.field_25 || "Campus",
      location: addr.full || [addr.street, addr.city, addr.country].filter(Boolean).join(", "),
      status: "ACTIVE",
      created_at: isoTimestamp(r.field_28_raw) || undefined,
      updated_at: isoTimestamp(r.field_29_raw) || undefined,
    }
  })
  await upsert("campus", rows)
}

async function importPrograms() {
  console.log("\n[6] Programs → program + degree + course + campus_program_junction")
  const intakes = loadRecords("intakes.json")
  const intakeById = new Map(
    intakes.map((i) => [
      i.id,
      {
        name: i.field_62_raw || i.field_62,
        deadline: isoDate(i.field_63_raw),
        startsOn: isoDate(i.field_376_raw),
        season: mapIntakeSeason(i.field_62_raw || i.field_62),
      },
    ])
  )

  const levels = loadRecords("degree-levels.json")
  const levelByName = new Map(
    levels.map((l) => [String(l.field_322_raw || l.field_322).toLowerCase(), resolveId(l.id, "level")])
  )

  const programs = loadRecords("programs.json")
  const programRows = []
  const degreeRows = []
  const courseRows = []
  const junctionRows = []

  for (const r of programs) {
    const knackId = r.id
    const name = stripHtml(r.field_55_raw || r.field_55 || "Program")
    const programId = resolveId(knackId, "program")
    const degreeId = uuidFrom("degree", knackId)
    const courseId = uuidFrom("course", knackId)
    // applications reference program knack id → course row for that program
    remember(`course-for-program:${knackId}`, courseId)

    const levelName =
      connLabel(r.field_326_raw) || r.field_287_raw || r.field_287 || null
    const levelId = levelName ? levelByName.get(String(levelName).toLowerCase()) : null

    const intakeIds = connIds(r.field_281_raw)
    const primaryIntake = intakeIds.length ? intakeById.get(intakeIds[0]) : null
    const campusIdRaw = connId(r.field_124_raw)
    const tuition = parseMoney(r.field_280_raw ?? r.field_280)
    const durationMonths = intOrNull(r.field_259_raw ?? r.field_259)
    const studyMode = mapStudyMode(r.field_258_raw || r.field_258)
    const credits = intOrNull(r.field_546_raw ?? r.field_546)

    programRows.push({
      id: programId,
      profile_id: UNIVERSITY_PROFILE_ID,
      name,
      location: connLabel(r.field_124_raw),
      program_length: durationMonths != null ? `${durationMonths} months` : null,
      admission_requirements: stripHtml(r.field_57_raw || r.field_57 || "") || null,
      program_detail: stripHtml(r.field_58_raw || r.field_58 || "") || null,
      category: levelName,
      status: "ACTIVE",
      created_at: isoTimestamp(r.field_60_raw) || undefined,
      updated_at: isoTimestamp(r.field_61_raw) || undefined,
    })

    degreeRows.push({
      id: degreeId,
      name,
      level_id: levelId,
      fees: tuition != null ? String(tuition) : null,
      duration: durationMonths != null ? String(durationMonths) : null,
      study_mode: studyMode,
      intake_date: primaryIntake?.season || null,
      intake_starts_on: primaryIntake?.startsOn || null,
      language_of_study: r.field_545_raw || r.field_545 || null,
      location: connLabel(r.field_124_raw),
      credits,
      agent_commission: parseMoney(r.field_282_raw ?? r.field_282),
    })

    courseRows.push({
      id: courseId,
      name,
      program_id: programId,
      degree_id: degreeId,
      deadline_date: primaryIntake?.deadline || null,
    })

    if (campusIdRaw) {
      const campusId = resolveId(campusIdRaw, "campus")
      for (const intakeId of intakeIds.length ? intakeIds : [null]) {
        const intake = intakeId ? intakeById.get(intakeId) : primaryIntake
        junctionRows.push({
          id: uuidFrom("campus_program", campusIdRaw, knackId, intakeId || "default"),
          campus_id: campusId,
          program_id: programId,
          tuition_fee: tuition,
          currency: "EUR",
          study_type: studyMode === "part_time" ? "part_time" : "full_time",
          intake_date: intake?.startsOn || null,
          application_deadline: intake?.deadline || null,
          agent_commission: parseMoney(r.field_282_raw ?? r.field_282),
        })
      }
    }
  }

  await upsert("program", programRows)
  await upsert("degree", degreeRows)
  await upsert("course", courseRows)
  await upsert("campus_program_junction", junctionRows)
}

async function importStudents() {
  console.log("\n[7] Students → auth + profile + student + education")
  let students = loadRecords("students.json")
  if (LIMIT_STUDENTS) students = students.slice(0, LIMIT_STUDENTS)

  const studentRows = []
  const educationRows = []
  let i = 0

  for (const r of students) {
    i++
    const email = r.field_47_raw?.email || null
    if (!email) {
      stats.errors.push(`student ${r.id}: missing email`)
      continue
    }

    const nameObj = r.field_43_raw || {}
    const title = r.field_380_raw || nameObj.title || ""
    const firstName =
      r.field_381_raw || nameObj.first || stripHtml(nameObj.full || "").replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, "").split(" ")[0] || "Student"
    const lastName = r.field_382_raw || nameObj.last || ""
    const phone = r.field_48_raw?.formatted || r.field_48 || null
    const dob = isoDate(r.field_44_raw)
    const addr = r.field_240_raw || {}
    const agentKnackId = connId(r.field_221_raw)

    process.stdout.write(`\r  students ${i}/${students.length} ${email}`.padEnd(80))

    let profileId
    try {
      profileId = await ensureAuthUser({
        knackId: r.id,
        email,
        role: "STUDENT",
        metadata: {
          title,
          first_name: firstName,
          last_name: lastName,
          phone,
          date_of_birth: dob,
          gender: mapGender(title),
        },
      })
    } catch (err) {
      stats.errors.push(`student auth ${email}: ${err.message}`)
      console.error(`\n  ✗ ${email}:`, err.message)
      continue
    }

    // Enrich profile dates/gender after create
    if (!DRY_RUN) {
      await supabase
        .from("profile")
        .update({
          date_of_birth: dob,
          gender: mapGender(title),
          phone,
          title: title || null,
          first_name: firstName,
          last_name: lastName || null,
        })
        .eq("id", profileId)
    }

    let createdByAgentId = null
    if (agentKnackId) {
      const agentId = resolveId(agentKnackId)
      if (globalThis.__importedAgentIds?.has(agentId)) createdByAgentId = agentId
    }

    studentRows.push({
      id: profileId,
      profile_id: profileId,
      nationality: r.field_45_raw || r.field_45 || null,
      country: addr.country || r.field_386_raw || null,
      city: addr.city || null,
      state: (addr.state || r.field_387_raw || "").replace(/,$/, "") || null,
      address:
        [r.field_383_raw || addr.street, r.field_384_raw || addr.street2]
          .filter(Boolean)
          .join(", ") || addr.full || null,
      zip_code: r.field_385_raw || addr.zip || null,
      created_by_agent_id: createdByAgentId,
      aps_requirement: Boolean(r.field_458_raw),
      created_at: isoTimestamp(r.field_53_raw) || undefined,
      updated_at: isoTimestamp(r.field_54_raw) || undefined,
    })

    const qualification = r.field_301_raw || r.field_301
    if (qualification) {
      educationRows.push({
        id: uuidFrom("education", r.id),
        profile_id: profileId,
        qualification: String(qualification),
        institution_name: null,
      })
    }
  }

  console.log("")
  await upsert("student", studentRows)
  await upsert("education", educationRows)
}

async function importApplications() {
  console.log("\n[8] Applications → application")
  const apps = loadRecords("applications.json")
  const rows = []
  const offerRows = []

  // Only attach to profiles that actually exist
  const { data: profiles } = await supabase.from("profile").select("id")
  const profileSet = new Set((profiles || []).map((p) => p.id))
  const { data: courses } = await supabase.from("course").select("id")
  const courseSet = new Set((courses || []).map((c) => c.id))

  for (const r of apps) {
    const studentKnackId = connId(r.field_126_raw)
    const programKnackId = connId(r.field_127_raw)
    if (!studentKnackId || !programKnackId) {
      stats.errors.push(`application ${r.id}: missing student/program`)
      continue
    }

    const profileId = resolveId(studentKnackId)
    if (!profileSet.has(profileId)) continue

    const courseId =
      idMap.get(`course-for-program:${programKnackId}`) || uuidFrom("course", programKnackId)
    if (!courseSet.has(courseId)) {
      stats.errors.push(`application ${r.id}: missing course for program ${programKnackId}`)
      continue
    }

    const status = mapAppStatus(r.field_69_raw || r.field_69)
    const agentKnackId = connId(r.field_263_raw)
    const submittedBy = agentKnackId ? resolveId(agentKnackId) : null
    const submittedBySafe = submittedBy && profileSet.has(submittedBy) ? submittedBy : null
    const appId = resolveId(r.id, "application")

    rows.push({
      id: appId,
      profile_id: profileId,
      university_id: UNIVERSITY_PROFILE_ID,
      course_id: courseId,
      status,
      application_no: String(r.field_72_raw || r.field_72 || r.id),
      submitted_by_profile_id: submittedBySafe,
      created_at: isoTimestamp(r.field_73_raw || r.field_70_raw) || undefined,
      updated_at: isoTimestamp(r.field_74_raw || r.field_71_raw) || undefined,
    })

    const statusLabel = Array.isArray(r.field_69_raw) ? r.field_69_raw[0] : r.field_69
    if (String(statusLabel || "").toLowerCase().includes("offer")) {
      const checklist = []
      const pairs = [
        [r.field_485, r.field_493],
        [r.field_486, r.field_492],
        [r.field_487, r.field_494],
        [r.field_488, r.field_495],
        [r.field_489, r.field_496],
        [r.field_490, r.field_497],
        [r.field_491, r.field_498],
        [r.field_499, r.field_500],
      ]
      for (const [en] of pairs) {
        if (!en) continue
        const text = stripHtml(en)
        checklist.push({
          label: text.replace(/^[⊠□]\s*/, ""),
          done: text.startsWith("⊠"),
        })
      }

      offerRows.push({
        id: uuidFrom("offer", r.id),
        application_id: appId,
        status: "PENDING",
        body_html: r.field_413 || null,
        checklist_items: checklist,
        file_url: r.field_267_raw?.url || null,
        issued_by_profile_id: connId(r.field_265_raw) ? resolveId(connId(r.field_265_raw)) : null,
        created_at: isoTimestamp(r.field_73_raw) || undefined,
        updated_at: isoTimestamp(r.field_74_raw) || undefined,
      })
    }
  }

  await upsert("application", rows)
  await upsert("offer_letter", offerRows)
}

async function importDegreeRequirements() {
  console.log("\n[9] Document requirements → degree_requirement")
  const reqs = loadRecords("document-requirements.json")
  const { data: degrees } = await supabase
    .from("degree")
    .select("id, level_id")
  const degreesByLevel = new Map()
  for (const d of degrees || []) {
    if (!d.level_id) continue
    if (!degreesByLevel.has(d.level_id)) degreesByLevel.set(d.level_id, [])
    degreesByLevel.get(d.level_id).push(d.id)
  }

  const rows = []
  for (const r of reqs) {
    const docTypeKnackId = connId(r.field_313_raw)
    const levelKnackId = connId(r.field_327_raw)
    if (!docTypeKnackId || !levelKnackId) continue

    const documentTypeId = resolveId(docTypeKnackId, "document_type")
    const levelId = resolveId(levelKnackId, "level")
    const requirementType = r.field_288_raw === false ? "OPTIONAL" : "REQUIRED"
    const targetDegrees = degreesByLevel.get(levelId) || []

    for (const degreeId of targetDegrees) {
      rows.push({
        id: uuidFrom("degree_requirement", r.id, degreeId),
        degree_id: degreeId,
        document_type_id: documentTypeId,
        requirement_type: requirementType,
        created_at: isoTimestamp(r.field_276_raw) || undefined,
        updated_at: isoTimestamp(r.field_277_raw) || undefined,
      })
    }
  }

  await upsert("degree_requirement", rows)
}

async function importStudentDocuments() {
  console.log("\n[10] Student documents → document + document_files + document_review")
  const records = loadRecords("student-document-status.json").filter(
    (r) => Array.isArray(r.field_132_raw) && r.field_132_raw.length
  )

  const documentRows = []
  const fileRows = []
  const reviewRows = []
  const appDocRows = []

  const { data: profiles } = await supabase.from("profile").select("id")
  const profileSet = new Set((profiles || []).map((p) => p.id))
  const { data: docTypes } = await supabase.from("document_type").select("id")
  const docTypeSet = new Set((docTypes || []).map((d) => d.id))
  const { data: appRows } = await supabase.from("application").select("id, profile_id")
  const appsByProfile = new Map()
  for (const a of appRows || []) {
    if (!appsByProfile.has(a.profile_id)) appsByProfile.set(a.profile_id, [])
    appsByProfile.get(a.profile_id).push(a.id)
  }

  for (const r of records) {
    const studentKnackId = connId(r.field_132_raw)
    if (!studentKnackId) continue
    const profileId = resolveId(studentKnackId)
    if (!profileSet.has(profileId)) continue

    const docTypeKnackId = connId(r.field_312_raw)
    let documentTypeId = docTypeKnackId ? resolveId(docTypeKnackId, "document_type") : null
    if (documentTypeId && !docTypeSet.has(documentTypeId)) documentTypeId = null

    const documentId = resolveId(r.id, "document")
    const status = mapDocStatus(r.field_225_raw || r.field_225)
    const note = r.field_83_raw || r.field_83 || null
    const file = r.field_224_raw

    documentRows.push({
      id: documentId,
      profile_id: profileId,
      document_type_id: documentTypeId,
      note: note ? String(note) : null,
      created_at: isoTimestamp(r.field_87_raw || r.field_85_raw) || undefined,
      updated_at: isoTimestamp(r.field_88_raw) || undefined,
    })

    if (file?.url) {
      fileRows.push({
        id: uuidFrom("document_file", r.id),
        document_id: documentId,
        file_url: file.signed_url || file.url,
        // DB check constraint only allows FRONT | BACK
        type: "FRONT",
        created_at: isoTimestamp(r.field_87_raw) || undefined,
      })
    }

    reviewRows.push({
      id: uuidFrom("document_review", r.id),
      document_id: documentId,
      status,
      feedback: r.field_226_raw || r.field_226 || null,
      created_at: isoTimestamp(r.field_87_raw) || undefined,
      updated_at: isoTimestamp(r.field_88_raw) || undefined,
    })

    const studentApps = appsByProfile.get(profileId) || []
    if (studentApps[0]) {
      appDocRows.push({
        id: uuidFrom("application_document", r.id),
        application_id: studentApps[0],
        document_id: documentId,
      })
    }
  }

  await upsert("document", documentRows)
  await upsert("document_files", fileRows)
  await upsert("document_review", reviewRows)
  await upsert("application_document", appDocRows)
}

async function importCommunicationNotes() {
  console.log("\n[11] Communication logs → conversation + message (best-effort)")
  const logs = loadRecords("application-communication-log.json")
  if (!logs.length) return

  const { data: profiles } = await supabase.from("profile").select("id")
  const profileSet = new Set((profiles || []).map((p) => p.id))

  const conversationRows = []
  const messageRows = []

  for (const r of logs) {
    const agentRaw = r.field_427_raw
    const agentCandidate = connId(agentRaw) ? resolveId(connId(agentRaw)) : null
    const agentId = agentCandidate && profileSet.has(agentCandidate) ? agentCandidate : null
    const conversationId = resolveId(r.id, "conversation")
    const subject = r.field_432_raw || r.field_432 || "Imported note"
    const body = stripHtml(r.field_425_raw || r.field_425 || r.field_426_raw || r.field_426 || subject)

    conversationRows.push({
      id: conversationId,
      university_id: UNIVERSITY_PROFILE_ID,
      agent_id: agentId,
      subject: String(subject),
      status: "CLOSED",
      created_at: isoTimestamp(r.field_421_raw) || undefined,
      updated_at: isoTimestamp(r.field_422_raw) || undefined,
    })

    messageRows.push({
      id: uuidFrom("message", r.id),
      conversation_id: conversationId,
      sender_profile_id: agentId || UNIVERSITY_PROFILE_ID,
      body: body || subject,
      is_read: true,
      sent_at: isoTimestamp(r.field_428_raw || r.field_421_raw) || new Date().toISOString(),
      created_at: isoTimestamp(r.field_421_raw) || undefined,
      updated_at: isoTimestamp(r.field_422_raw) || undefined,
    })
  }

  await upsert("conversation", conversationRows)
  await upsert("message", messageRows)
}

async function noteSkipped() {
  console.log("\n[12] Notes on skipped / partial mappings")
  console.log("  • conditions.json → no dedicated table; offer checklist already imported from applications")
  console.log("  • Knack IDs converted to deterministic UUIDs via MD5")
  console.log(`  • Auth password for new users: ${DEFAULT_PASSWORD}`)
}

async function main() {
  console.log("Knack → Supabase import")
  console.log("URL:", SUPABASE_URL)
  console.log("DRY_RUN:", DRY_RUN)
  if (LIMIT_STUDENTS) console.log("LIMIT_STUDENTS:", LIMIT_STUDENTS)

  await ensureUniversity()
  const levels = await importLevels()
  await importDocumentTypes(levels)
  await importAgents()
  await importCampuses()
  await importPrograms()
  await importStudents()
  await importApplications()
  await importDegreeRequirements()
  await importStudentDocuments()
  await importCommunicationNotes()
  await noteSkipped()

  console.log("\n═══ Summary ═══")
  console.log("Created users:", stats.createdUsers)
  console.log("Reused users:", stats.reusedUsers)
  console.log("Errors:", stats.errors.length)
  if (stats.errors.length) {
    const errPath = path.join(DATA_DIR, "import-errors.json")
    fs.writeFileSync(errPath, JSON.stringify(stats.errors, null, 2))
    console.log("Error log written to:", errPath)
    console.log("First 10 errors:")
    for (const e of stats.errors.slice(0, 10)) console.log(" -", e)
  }
  console.log("Done.")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
