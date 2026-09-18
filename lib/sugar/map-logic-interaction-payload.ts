import "server-only"
import { formatLocalizedTitle, normalizeStudentTitle } from "@/lib/document-template/locale"
import type { SugarLogicInteractionPayload } from "@/types/schemas/sugar"

export type SugarApplicationContext = {
    application: {
        id: string
        application_no: string | null
        custom_intake_date: string | null
    }
    profile: {
        title: string | null
        first_name: string | null
        last_name: string | null
        email: string | null
        phone: string | null
        date_of_birth: string | null
    }
    student: {
        street_1: string | null
        street_2: string | null
        street_3: string | null
        post_code: string | null
        zip_code: string | null
        city: string | null
    } | null
    course: {
        name: string
        category: string | null
        location: string | null
    }
    degree: {
        name: string
        intake_date: string | null
        intake_starts_on: string | null
        study_mode: string | null
        location: string | null
        level_name: string | null
    } | null
    documentCodes: string[]
}

function parseStreetAddress(street: string | null | undefined): {
    strasse: string
    hausnummer: string
} {
    const trimmed = street?.trim()
    if (!trimmed) {
        return { strasse: "", hausnummer: "" }
    }

    const match = trimmed.match(/^(.+?)\s+(\d+\w?)$/)
    if (match) {
        return { strasse: match[1].trim(), hausnummer: match[2] }
    }

    return { strasse: trimmed, hausnummer: "" }
}

function mapStudyMode(studyMode: string | null | undefined): string | undefined {
    if (!studyMode) return undefined
    if (studyMode === "full_time") return "Vollzeit"
    if (studyMode === "part_time") return "Teilzeit"
    return studyMode
}

function mapIntakeSeason(intakeDate: string | null | undefined): string | undefined {
    if (!intakeDate) return undefined
    if (intakeDate === "summer") return "Sommersemester"
    if (intakeDate === "winter") return "Wintersemester"
    return intakeDate
}

function formatDateOnly(value: string | null | undefined): string | undefined {
    if (!value) return undefined
    return value.includes("T") ? value.slice(0, 10) : value
}

export function mapApplicationToSugarPayload(
    context: SugarApplicationContext
): SugarLogicInteractionPayload {
    const { strasse, hausnummer } = parseStreetAddress(context.student?.street_1)
    const title = normalizeStudentTitle(context.profile.title)
    const plz = context.student?.post_code ?? context.student?.zip_code ?? undefined

    return {
        submitUid: context.application.application_no ?? context.application.id,
        anrede: title ? formatLocalizedTitle(title, "de") : undefined,
        vorname: context.profile.first_name ?? undefined,
        nachname: context.profile.last_name ?? undefined,
        strasse: strasse || context.student?.street_2 || context.student?.street_3 || undefined,
        plz: plz ?? undefined,
        ort: context.student?.city ?? undefined,
        hausnummer: hausnummer || undefined,
        e_mail_adresse: context.profile.email ?? undefined,
        telefon: context.profile.phone ?? undefined,
        geburtsdatum: formatDateOnly(context.profile.date_of_birth),
        studienart: context.degree?.level_name ?? undefined,
        studienrichtung: context.course.category ?? undefined,
        studiengang: context.course.name,
        studienform: mapStudyMode(context.degree?.study_mode),
        auspraegung: context.degree?.name ?? context.course.category ?? undefined,
        studienjahr: mapIntakeSeason(context.degree?.intake_date),
        studienstart:
            formatDateOnly(context.application.custom_intake_date) ??
            formatDateOnly(context.degree?.intake_starts_on),
        studienort:
            context.course.location ??
            context.degree?.location ??
            undefined,
        pruefungszentrum: context.course.location ?? context.degree?.location ?? undefined,
        dokumente:
            context.documentCodes.length > 0 ? context.documentCodes.join(",") : undefined,
    }
}
