
"use client"

import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { PageLoader } from "@/components/shared/page-loader"
import { ErrorView } from "@/components/shared/error-view"
import { useCourseDocumentBundles } from "@/hooks/useCourseDocumentBundles"
import { useAuth } from "@/hooks/useAuth"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { CourseBundlesTable } from "./course-bundles-table"

type Props = {
    profileId?: string
    studentName?: string
    showBack?: boolean
    backHref?: string
}

export function CourseDocumentsView({
    profileId,
    studentName,
    showBack = false,
    backHref = "/dashboard/document",
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

    if ((!profileId && userLoading) || isLoading) {
        return <PageLoader />
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

    const bundles = data?.degree_bundles ?? []
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
                        Back to students
                    </Link>
                )}

                <Typography
                    as="h2"
                    font="sub-heading"
                    className="font-bold tracking-tight"
                >
                    {studentName
                        ? `Course Documents for ${studentName}`
                        : "Course Documents"}
                </Typography>

                <Typography as="p" font="sub-text" className="text-gray-600">
                    Browse programs and upload required documents for each course.
                </Typography>
            </BluryCard>

            {bundles.length === 0 ? (
                <BluryCard isCentered={false} className="rounded-2xl">
                    <Typography as="p" font="sub-text" className="text-gray-600">
                        No courses with degree requirements found.
                    </Typography>
                </BluryCard>
            ) : listStudentId ? (
                <CourseBundlesTable bundles={bundles} studentId={listStudentId} />
            ) : null}
        </div>
    )
}
