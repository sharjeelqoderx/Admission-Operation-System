import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CourseDocumentsResponse, SaveDegreeDocumentsInput } from "@/types/schemas/document"

export const COURSE_DOCUMENT_BUNDLES_QUERY_KEY = ["course-document-bundles"] as const

export async function fetchCourseDocumentBundles(profileId?: string): Promise<CourseDocumentsResponse> {
    const params = new URLSearchParams()
    if (profileId) params.set("profile_id", profileId)

    const res = await fetch(`/api/document/course-bundles?${params.toString()}`)
    const json = await res.json()
    if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to load course documents")
    }

    const data = json.data as CourseDocumentsResponse

    return {
        ...data,
        degree_bundles: data.degree_bundles.map((bundle) => ({
            ...bundle,
            degree: {
                ...bundle.degree,
                levels:
                    bundle.degree.levels?.length
                        ? bundle.degree.levels
                        : bundle.degree.level
                          ? [{ id: bundle.degree.level.id, name: bundle.degree.level.name }]
                          : [],
            },
        })),
    }
}

async function uploadDocument(payload: {
    profile_id: string
    document_type_id: string
    files: File[]
}) {
    const fd = new FormData()
    fd.set("student_id", payload.profile_id)
    fd.set("document_type_id", payload.document_type_id)
    payload.files.forEach((file) => fd.append("files", file))

    const res = await fetch("/api/document", { method: "POST", body: fd })
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json.error ?? "Failed to upload document")
    }
    return json
}

export function useCourseDocumentBundles(profileId?: string) {
    return useQuery({
        queryKey: [...COURSE_DOCUMENT_BUNDLES_QUERY_KEY, profileId ?? "self"],
        queryFn: () => fetchCourseDocumentBundles(profileId),
        enabled: Boolean(profileId),
    })
}

export function useSaveDegreeDocuments() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: SaveDegreeDocumentsInput) => {
            for (const upload of payload.uploads) {
                await uploadDocument({
                    profile_id: payload.profile_id,
                    document_type_id: upload.document_type_id,
                    files: upload.files,
                })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: COURSE_DOCUMENT_BUNDLES_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ["documents"] })
            queryClient.invalidateQueries({ queryKey: ["documents", "students"] })
        },
    })
}
