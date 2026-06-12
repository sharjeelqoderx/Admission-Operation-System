import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ok, err } from "@/lib/api"
import {
    attachLevelsToCourses,
    COURSE_SELECT,
    type CourseRow,
} from "@/lib/api/course-program"
import type {
    CourseRequiredDocument,
    DegreeDocumentBundle,
    UploadedDocumentSummary,
} from "@/types/schemas/document"
import type { CourseDegree, CourseProgram } from "@/types/schemas/program"

type DocumentRow = {
    id: string
    document_type_id: string | null
    created_at: string
    updated_at: string | null
    document_review: Array<{ status: string; created_at: string }> | null
    document_files: Array<{ file_url: string; type: string | null }> | null
}

function mapUploadedDocument(doc: DocumentRow): UploadedDocumentSummary {
    return {
        document_id: doc.id,
        status: doc.document_review?.[0]?.status ?? "PENDING",
        note: null,
        files: (doc.document_files ?? []).map((file) => ({
            file_url: file.file_url,
            type: file.type,
        })),
        created_at: doc.created_at,
        updated_at: doc.updated_at ?? null,
    }
}

type LevelSummary = { id: string; name: string }

function buildLevelsByDocumentType(
    rows: Array<{
        document_type_id: string
        level: { id: string; name: string } | null
    }>
) {
    const map = new Map<string, LevelSummary[]>()

    for (const row of rows) {
        if (!row.level?.id) continue
        const existing = map.get(row.document_type_id) ?? []
        if (existing.some((level) => level.id === row.level!.id)) continue
        existing.push({ id: row.level.id, name: row.level.name })
        map.set(row.document_type_id, existing)
    }

    return map
}

function resolveDegreeLevels(
    degreeLevel: LevelSummary | null,
    documentTypeIds: string[],
    levelsByDocumentType: Map<string, LevelSummary[]>
): LevelSummary[] {
    const byId = new Map<string, LevelSummary>()

    if (degreeLevel) {
        byId.set(degreeLevel.id, degreeLevel)
    }

    for (const documentTypeId of documentTypeIds) {
        for (const level of levelsByDocumentType.get(documentTypeId) ?? []) {
            byId.set(level.id, level)
        }
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return err("Unauthorized", 401)
        }

        const profileIdParam = new URL(req.url).searchParams.get("profile_id")
        let profileId = user.id

        if (profileIdParam && profileIdParam !== user.id) {
            const { data: profile } = await supabase
                .from("profile")
                .select("role")
                .eq("id", user.id)
                .maybeSingle()

            if (profile?.role !== "AGENT") {
                return err("Forbidden", 403)
            }

            const { data: agentRow } = await supabase
                .from("agent")
                .select("id")
                .eq("profile_id", user.id)
                .maybeSingle()

            if (!agentRow) {
                return err("Agent profile not found", 400)
            }

            const { data: studentRow } = await supabase
                .from("student")
                .select("profile_id")
                .eq("profile_id", profileIdParam)
                .eq("created_by_agent_id", agentRow.id)
                .maybeSingle()

            if (!studentRow) {
                return err("Student not found", 404)
            }

            profileId = profileIdParam
        }

        const { data: courseRows, error: courseError } = await supabase
            .from("course")
            .select(COURSE_SELECT)
            .order("name", { ascending: true })

        if (courseError) {
            console.error("course-bundles course error:", courseError)
            return err("Failed to fetch courses", 500)
        }

        const courses = (await attachLevelsToCourses(
            supabase,
            (courseRows ?? []) as unknown as CourseRow[]
        )) as CourseProgram[]

        const { data: documentRows, error: documentError } = await supabase
            .from("document")
            .select(`
                id,
                document_type_id,
                created_at,
                updated_at,
                document_review(status, created_at),
                document_files(file_url, type)
            `)
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false })

        if (documentError) {
            console.error("course-bundles document error:", documentError)
            return err("Failed to fetch documents", 500)
        }

        const latestDocumentByType = new Map<string, UploadedDocumentSummary>()
        for (const row of (documentRows ?? []) as DocumentRow[]) {
            if (!row.document_type_id || latestDocumentByType.has(row.document_type_id)) {
                continue
            }
            latestDocumentByType.set(row.document_type_id, mapUploadedDocument(row))
        }

        const degreeMap = new Map<
            string,
            {
                degree: CourseDegree
                courses: DegreeDocumentBundle["courses"]
            }
        >()

        for (const course of courses) {
            if (!course.degree?.id) continue

            const existing = degreeMap.get(course.degree.id)
            const courseSummary = {
                id: course.id,
                name: course.name,
                deadline_date: course.deadline_date,
            }

            if (existing) {
                existing.courses.push(courseSummary)
                continue
            }

            degreeMap.set(course.degree.id, {
                degree: course.degree,
                courses: [courseSummary],
            })
        }

        const allDocumentTypeIds = [
            ...new Set(
                Array.from(degreeMap.values()).flatMap(({ degree }) =>
                    (degree.requirements ?? [])
                        .map((item) => item.document_type?.id)
                        .filter((id): id is string => Boolean(id))
                )
            ),
        ]

        let levelsByDocumentType = new Map<string, LevelSummary[]>()

        if (allDocumentTypeIds.length > 0) {
            const { data: documentTypeLevels, error: documentTypeLevelsError } = await supabase
                .from("document_type_level")
                .select("document_type_id, level:level_id(id, name)")
                .in("document_type_id", allDocumentTypeIds)

            if (documentTypeLevelsError) {
                console.error("course-bundles document_type_level error:", documentTypeLevelsError)
            } else {
                levelsByDocumentType = buildLevelsByDocumentType(
                    (documentTypeLevels ?? []) as unknown as Array<{
                        document_type_id: string
                        level: { id: string; name: string } | null
                    }>
                )
            }
        }

        const degree_bundles: DegreeDocumentBundle[] = Array.from(degreeMap.values())
            .map(({ degree, courses: degreeCourses }) => {
                const requirements =
                    degree.requirements?.filter((item) => item.document_type?.id) ?? []

                const required_documents: CourseRequiredDocument[] = requirements.map(
                    (requirement) => {
                        const documentType = requirement.document_type!
                        return {
                            requirement_id: requirement.id,
                            document_type_id: documentType.id,
                            name: documentType.name,
                            description: documentType.description,
                            code: documentType.code,
                            uploaded:
                                latestDocumentByType.get(documentType.id) ?? null,
                        }
                    }
                )

                const total_required = required_documents.length
                const uploaded_count = required_documents.filter(
                    (item) => item.uploaded
                ).length
                const completion_percentage =
                    total_required === 0
                        ? 100
                        : Math.round((uploaded_count / total_required) * 100)

                const documentTypeIds = required_documents.map((item) => item.document_type_id)
                const degreeLevel = degree.level?.id
                    ? { id: degree.level.id, name: degree.level.name }
                    : null
                const levels = resolveDegreeLevels(
                    degreeLevel,
                    documentTypeIds,
                    levelsByDocumentType
                )

                return {
                    degree: {
                        id: degree.id,
                        name: degree.name,
                        credits: degree.credits,
                        location: degree.location,
                        language_of_study: degree.language_of_study,
                        duration: degree.duration,
                        fees: degree.fees,
                        study_mode: degree.study_mode,
                        intake_date: degree.intake_date,
                        level: degreeLevel,
                        levels,
                    },
                    courses: degreeCourses,
                    required_documents,
                    total_required,
                    uploaded_count,
                    completion_percentage,
                }
            })
            .sort((a, b) => a.degree.name.localeCompare(b.degree.name))

        return ok({
            profile_id: profileId,
            degree_bundles,
        })
    } catch (error) {
        console.error("course-bundles error:", error)
        return err("Internal Server Error", 500)
    }
}
