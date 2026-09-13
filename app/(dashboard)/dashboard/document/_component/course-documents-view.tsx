"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { PanelSkeleton } from "@/components/shared/page-skeleton"
import { ErrorView } from "@/components/shared/error-view"
import { useCourseDocumentBundles } from "@/hooks/useCourseDocumentBundles"
import { useAuth } from "@/hooks/useAuth"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { CourseBundlesTable } from "./course-bundles-table"
import {
    filterDegreeBundlesByQualification,
    getQualificationSnapshotFromEducation,
} from "@/lib/utils/resolve-student-qualification"

type Props = {
    profileId?: string
    studentName?: string
    showBack?: boolean
    backHref?: string
    backLabel?: string
    isLoading?: boolean
}

export function CourseDocumentsView({
    profileId,
    studentName,
    showBack = false,
    backHref = "/dashboard/document",
    backLabel = "Back to documents",
    isLoading: externalLoading = false,
}: Props = {}) {
    const { me } = useAuth()
    const { data: user, isLoading: userLoading } = me

    const resolvedProfileId = profileId ?? user?.id

    const {
        data,
        isLoading,
        isError,
        error,
    } = useCourseDocumentBundles(resolvedProfileId)

    // Skip student fetch if studentName is provided (loaded by parent)
    const shouldFetchStudent = !studentName && Boolean(resolvedProfileId)
    const { data: studentResponse, isLoading: isStudentLoading } = useQuery({
        queryKey: ["student", resolvedProfileId],
        queryFn: async () => {
            const res = await fetch(`/api/student/${resolvedProfileId}`)
            if (!res.ok) throw new Error("Failed to fetch student profile")
            return res.json()
        },
        enabled: shouldFetchStudent,
        // Cache for 5 minutes to avoid refetch on back navigation
        staleTime: 5 * 60 * 1000,
    })

    const qualificationSnapshot = useMemo(
        () =>
            getQualificationSnapshotFromEducation(
                studentResponse?.data?.education?.[0] ?? null
            ),
        [studentResponse?.data?.education]
    )

    const filteredBundles = useMemo(() => {
        const bundles = data?.degree_bundles ?? []
        return filterDegreeBundlesByQualification(bundles, qualificationSnapshot)
    }, [data?.degree_bundles, qualificationSnapshot])

    // Show skeleton while loading course bundles or student data (if not provided via props)
    if (externalLoading || (!profileId && userLoading) || isLoading || (isStudentLoading && !studentName)) {
        return <PanelSkeleton />
    }

    if (isError) {
        return (
            <ErrorView
                message={
                    error instanceof Error
                        ? error.message
                        : "Failed to load course documents."
                }
            />
        )
    }

    const listStudentId = resolvedProfileId ?? ""

    return (
        <div className="space-y-6">
            <BluryCard
                isCentered={false}
                childClass="space-y-2"
                className="rounded-2xl"
            >
                {showBack && (
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-byzantine transition-colors mb-2"
                    >
                        <ChevronLeft className="size-4" />
                        {backLabel}
                    </Link>
                )}

                <Typography
                    as="h2"
                    font="sub-heading"
                    className="font-bold tracking-tight"
                >
                    {studentName
                        ? `Documents for ${studentName}`
                        : "Student Documents"}
                </Typography>

                <Typography as="p" font="sub-text" className="text-gray-600">
                    View and upload required documents for this student by program.
                </Typography>
            </BluryCard>

            {filteredBundles.length === 0 ? (
                <BluryCard isCentered={false} className="rounded-2xl">
                    <Typography as="p" font="sub-text" className="text-gray-600">
                        No courses with degree requirements found for the current highest qualification.
                    </Typography>
                </BluryCard>
            ) : listStudentId ? (
                <CourseBundlesTable bundles={filteredBundles} studentId={listStudentId} />
            ) : null}
        </div>
    )
}
