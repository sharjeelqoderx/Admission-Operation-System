import {

    buildTemplateDateVariables,

    type DocumentTemplateDates,

} from "@/lib/document-template/date-variables"

import {

    ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE,

    ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE,

    ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE,

    buildLocalizedChecklistHtml,

    type AdmissionRequirementsContext,

    type AdmissionRequirementId,

    type ChecklistProofs,

} from "@/lib/document-template/admission-requirements-checklist"

import {

    buildStudentGreeting,

    formatLocalizedTitle,

    normalizeStudentTitle,

    normalizeTemplateLocale,

    type TemplateLocale,

} from "@/lib/document-template/locale"

import { formatFullName } from "@/lib/utils/profile"

import { formatPostalAddress } from "@/lib/utils/location"

import { buildStudentSignatureHtml } from "@/lib/document-template/variables"



export type OfferStudentTemplateContext = {

    name?: string | null

    first_name?: string | null

    last_name?: string | null

    title?: string | null

    date_of_birth?: string | null

    signature?: string | null

    street_1?: string | null

    street_2?: string | null

    street_3?: string | null

    post_code?: string | null

    address?: string | null

    city?: string | null

    state?: string | null

    country?: string | null

    zip_code?: string | null

}



export type OfferApplicationContext = {

    application_no?: string | null

    student?: OfferStudentTemplateContext | null

    course?: {

        name?: string | null

        deadline_date?: string | null

        degree?: {

            name?: string | null

            fees?: string | null

            intake_date?: string | null

            intake_starts_on?: string | null

            duration?: string | null

        } | null

    } | null

    university?: {

        name?: string | null

        first_name?: string | null

        last_name?: string | null

    } | null

}



export type OfferChecklistOptions = {

    itemIds?: AdmissionRequirementId[] | null

    proofs?: ChecklistProofs | null

}



export type BuildOfferTemplateVariablesOptions = {

    locale?: TemplateLocale | null

    issueDate?: Date | string | null

    templateDates?: DocumentTemplateDates | null

}



function buildChecklistVariables(

    requirementsContext: AdmissionRequirementsContext | undefined,

    checklistOptions: OfferChecklistOptions | undefined,

    locale: TemplateLocale

) {

    const context: AdmissionRequirementsContext =

        requirementsContext ??

        ({

            paymentStatus: null,

            apsRequirement: false,

            hasWorkExperience: false,

            requiresWorkExperience: false,

            documents: [],

        } satisfies AdmissionRequirementsContext)



    const checklistParams = {

        itemIds: checklistOptions?.itemIds,

        storedProofs: checklistOptions?.proofs,

    }



    return {

        [ADMISSION_REQUIREMENTS_CHECKLIST_DE_VARIABLE]: buildLocalizedChecklistHtml(context, {

            ...checklistParams,

            locale: "de",

        }),

        [ADMISSION_REQUIREMENTS_CHECKLIST_EN_VARIABLE]: buildLocalizedChecklistHtml(context, {

            ...checklistParams,

            locale: "en",

        }),

        [ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE]: buildLocalizedChecklistHtml(context, {

            ...checklistParams,

            locale,

        }),

    }

}



function buildGreetingVariables(params: {

    title?: string | null

    firstName?: string | null

    lastName?: string | null

    locale: TemplateLocale

}) {

    const normalizedTitle = normalizeStudentTitle(params.title)



    return {

        student_greeting: buildStudentGreeting({

            title: params.title,

            firstName: params.firstName,

            lastName: params.lastName,

            locale: params.locale,

        }),

        student_greeting_de: buildStudentGreeting({

            title: params.title,

            firstName: params.firstName,

            lastName: params.lastName,

            locale: "de",

        }),

        student_greeting_en: buildStudentGreeting({

            title: params.title,

            firstName: params.firstName,

            lastName: params.lastName,

            locale: "en",

        }),

        student_first_name: params.firstName?.trim() || "—",

        student_last_name: params.lastName?.trim() || "—",

        student_title: formatLocalizedTitle(normalizedTitle, params.locale),

    }

}



export function buildOfferTemplateVariables(

    application: OfferApplicationContext,

    requirementsContext?: AdmissionRequirementsContext,

    checklistOptions?: OfferChecklistOptions,

    options?: BuildOfferTemplateVariablesOptions

): Record<string, string> {

    const locale = normalizeTemplateLocale(options?.locale)

    const firstName = application.student?.first_name?.trim() || ""

    const lastName = application.student?.last_name?.trim() || ""



    const studentName =

        application.student?.name ??

        formatFullName(firstName, lastName, "—")



    const universityName =

        application.university?.name ??

        formatFullName(

            application.university?.first_name,

            application.university?.last_name,

            "University"

        )



    const issueDateSource = options?.issueDate ?? new Date()



    return {

        student_name: studentName,

        ...buildGreetingVariables({

            title: application.student?.title,

            firstName,

            lastName,

            locale,

        }),

        student_address: formatPostalAddress({

            street_1: application.student?.street_1,

            street_2: application.student?.street_2,

            street_3: application.student?.street_3,

            post_code: application.student?.post_code,

            address: application.student?.address,

            city: application.student?.city,

            state: application.student?.state,

            country: application.student?.country,

            zip_code: application.student?.zip_code,

        }),

        student_signature: buildStudentSignatureHtml(application.student?.signature, {

            alt: `${studentName} Signature`,

            locale,

        }),

        course_name: application.course?.name ?? "—",

        degree_name: application.course?.degree?.name ?? "—",

        university_name: universityName,

        application_no: application.application_no ?? "—",

        fees: application.course?.degree?.fees ?? "—",

        duration: application.course?.degree?.duration?.trim() || "—",

        ...buildTemplateDateVariables({

            locale,

            issueDate: issueDateSource,

            studentDateOfBirth: application.student?.date_of_birth,

            applicationDeadline: application.course?.deadline_date,

            intakeStartDate: application.course?.degree?.intake_starts_on,

            duration: application.course?.degree?.duration,

            templateDates: options?.templateDates,

        }),

        ...buildChecklistVariables(requirementsContext, checklistOptions, locale),

    }

}


