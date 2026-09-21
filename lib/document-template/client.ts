import type {
    DocumentTemplateDetailResponse,
    DocumentTemplateProgramOptionsResponse,
} from "@/types/schemas/document-template"

export async function fetchDocumentTemplate(
    templateId: string
): Promise<DocumentTemplateDetailResponse> {
    const res = await fetch(`/api/document-template/${templateId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch document template")
    }
    return json
}

export async function fetchDocumentTemplateProgramOptions(
    excludeTemplateId?: string | null
): Promise<DocumentTemplateProgramOptionsResponse["data"]> {
    const params = new URLSearchParams()
    if (excludeTemplateId) {
        params.set("exclude_template_id", excludeTemplateId)
    }

    const query = params.toString()
    const res = await fetch(
        `/api/document-template/program-options${query ? `?${query}` : ""}`
    )
    const json = await res.json()

    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch program options")
    }

    return json.data
}
