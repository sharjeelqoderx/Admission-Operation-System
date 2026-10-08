import "server-only"
import {
    extractStudienjahr,
    extractStudienstartMonth,
    formatSugarBirthDate,
    mapSugarAnrede,
    mapStudyModeToStudienform,
    resolveSugarLabel,
    SUGAR_DEGREE_LEVEL,
    SUGAR_FIELD_OF_STUDY,
    SUGAR_LOCATION,
    SUGAR_TYPE_OF_STUDY,
} from "@/lib/sugar/label-mappings"
import { SUGAR_EXAM_VENUE } from "@/lib/sugar/exam-venue-label-map"
import { SUGAR_STUDIES } from "@/lib/sugar/studies-label-map"
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
        state: string | null
        country: string | null
    } | null
    course: {
        name: string
        category: string | null
        location: string | null
        program_detail: string | null
    }
    degree: {
        name: string
        intake_date: string | null
        intake_starts_on: string | null
        study_mode: string | null
        location: string | null
        level_name: string | null
    } | null
    documentFileUrls: string[]
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

/** FHM sample: file_1/file_3–5 use null when empty; file_2 uses "". */
function fileSlot(urls: string[], index: number): string | null {
    const value = urls[index]?.trim()
    if (!value) {
        return index === 1 ? "" : null
    }
    return value
}

export function mapApplicationToSugarPayload(
    context: SugarApplicationContext
): SugarLogicInteractionPayload {
    const { strasse, hausnummer } = parseStreetAddress(context.student?.street_1)
    const plz = context.student?.post_code ?? context.student?.zip_code ?? ""
    const intakeRef =
        context.application.custom_intake_date ??
        context.degree?.intake_starts_on ??
        context.degree?.intake_date ??
        null

    const studienortRaw =
        context.course.location ?? context.degree?.location ?? ""
    const studienort = resolveSugarLabel(SUGAR_LOCATION, studienortRaw)

    const studienrichtung = resolveSugarLabel(
        SUGAR_FIELD_OF_STUDY,
        context.course.category
    )

    const studienart = resolveSugarLabel(
        SUGAR_DEGREE_LEVEL,
        context.degree?.level_name ?? ""
    )

    // type_of_study_c → studienform (degree study mode) + auspraegung (course program_detail)
    const studienform = mapStudyModeToStudienform(context.degree?.study_mode)
    const auspraegung = resolveSugarLabel(
        SUGAR_TYPE_OF_STUDY,
        context.course.program_detail ?? ""
    )
    // Exam_venue_c → pruefungszentrum (no AdmissionTool column yet; send label when stored as code)
    const pruefungszentrum = resolveSugarLabel(SUGAR_EXAM_VENUE, "")

    const urls = context.documentFileUrls

    return {
        submitUid: context.application.application_no ?? context.application.id,
        anrede: mapSugarAnrede(context.profile.title),
        vorname: context.profile.first_name ?? "",
        nachname: context.profile.last_name ?? "",
        strasse: strasse || context.student?.street_2 || context.student?.street_3 || "",
        plz,
        ort: context.student?.city ?? "",
        hausnummer,
        e_mail_adresse: context.profile.email ?? "",
        telefon: context.profile.phone ?? "",
        geburtsdatum: formatSugarBirthDate(context.profile.date_of_birth),
        marker_01: context.student?.state ?? context.student?.city ?? "",
        studienart,
        studienrichtung,
        studiengang: resolveSugarLabel(SUGAR_STUDIES, context.course.name),
        studienform,
        auspraegung,
        studienjahr: extractStudienjahr(intakeRef),
        studienstart: extractStudienstartMonth(intakeRef),
        studienort,
        pruefungszentrum,
        file_1: fileSlot(urls, 0),
        file_2: fileSlot(urls, 1),
        file_3: fileSlot(urls, 2),
        file_4: fileSlot(urls, 3),
        file_5: fileSlot(urls, 4),
        marker: "",
        no_label_01: true,
    }
}
