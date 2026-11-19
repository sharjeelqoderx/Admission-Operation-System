import type { DocumentTemplateAsset } from "@/types/schemas/document-template"

/**
 * FHM brand assets that ship with the app and always appear first in the template
 * asset library (so nobody has to re-upload the logo, seal or signature).
 * Files live in /public/assets/brand.
 */
export const DOCUMENT_TEMPLATE_BRAND_ASSETS: DocumentTemplateAsset[] = [
    {
        name: "fhm-logo-full.png",
        label: "FHM logo — full (cube + wordmark)",
        path: "builtin/fhm-logo-full.png",
        url: "/assets/brand/fhm-logo-full.png",
        created_at: null,
        builtin: true,
    },
    {
        name: "fhm-seal.png",
        label: "FHM seal / official stamp",
        path: "builtin/fhm-seal.png",
        url: "/assets/brand/fhm-seal.png",
        created_at: null,
        builtin: true,
    },
    {
        name: "fhm-signature-wittberg.jpg",
        label: "Signature — Prof. Dr. Volker Wittberg",
        path: "builtin/fhm-signature-wittberg.jpg",
        url: "/assets/brand/fhm-signature-wittberg.jpg",
        created_at: null,
        builtin: true,
    },
]
