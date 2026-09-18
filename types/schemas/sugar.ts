import { z } from "zod"

export const SugarOAuthTokenResponseSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expires_in: z.number().optional(),
    token_type: z.string().optional(),
})

export type SugarOAuthTokenResponse = z.infer<typeof SugarOAuthTokenResponseSchema>

export const SugarCreateRecordResponseSchema = z.object({
    id: z.string(),
})

export type SugarCreateRecordResponse = z.infer<typeof SugarCreateRecordResponseSchema>

export const SugarLogicInteractionPayloadSchema = z.object({
    submitUid: z.string(),
    anrede: z.string().optional(),
    vorname: z.string().optional(),
    nachname: z.string().optional(),
    strasse: z.string().optional(),
    plz: z.string().optional(),
    ort: z.string().optional(),
    hausnummer: z.string().optional(),
    e_mail_adresse: z.string().optional(),
    telefon: z.string().optional(),
    geburtsdatum: z.string().optional(),
    studienart: z.string().optional(),
    studienrichtung: z.string().optional(),
    studiengang: z.string().optional(),
    studienform: z.string().optional(),
    auspraegung: z.string().optional(),
    studienjahr: z.string().optional(),
    studienstart: z.string().optional(),
    studienort: z.string().optional(),
    pruefungszentrum: z.string().optional(),
    dokumente: z.string().optional(),
})

export type SugarLogicInteractionPayload = z.infer<typeof SugarLogicInteractionPayloadSchema>
