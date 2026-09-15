import type { QueryClient } from "@tanstack/react-query"
import {
    COURSE_DOCUMENT_BUNDLES_QUERY_KEY,
    fetchCourseDocumentBundles,
} from "@/hooks/useCourseDocumentBundles"
import {
    filterDegreeBundlesByQualification,
    getQualificationSnapshotFromEducation,
} from "@/lib/utils/resolve-student-qualification"

const studentDetailQueryKey = (studentId: string) => ["student", studentId] as const

async function fetchStudentEducation(studentId: string) {
    const res = await fetch(`/api/student/${studentId}`)
    const json = await res.json()
    if (!res.ok) {
        throw new Error(json?.error ?? "Failed to fetch student")
    }
    return json as { data?: { education?: Array<Record<string, unknown>> | null } }
}

export async function resolveStudentProgramDegreeId(
    queryClient: QueryClient,
    studentId: string
): Promise<string> {
    const [bundles, studentResponse] = await Promise.all([
        queryClient.fetchQuery({
            queryKey: [...COURSE_DOCUMENT_BUNDLES_QUERY_KEY, studentId],
            queryFn: () => fetchCourseDocumentBundles(studentId),
        }),
        queryClient.fetchQuery({
            queryKey: studentDetailQueryKey(studentId),
            queryFn: () => fetchStudentEducation(studentId),
        }),
    ])

    const snapshot = getQualificationSnapshotFromEducation(
        studentResponse?.data?.education?.[0] ?? null
    )
    const filtered = filterDegreeBundlesByQualification(bundles.degree_bundles ?? [], snapshot)
    const degreeId = filtered[0]?.degree.id

    if (!degreeId) {
        throw new Error("No program documents found for this student")
    }

    return degreeId
}
