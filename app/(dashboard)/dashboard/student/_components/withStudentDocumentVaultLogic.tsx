"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { resolveStudentProgramDegreeId } from "@/lib/document/resolve-student-program-degree"
import { StudentDocumentVaultCell } from "./student-document-vault-cell"

type StudentDocumentVaultProps = {
    studentId: string
    studentName: string
    documentsUploadedCount: number
    totalDocumentTypes: number
    documentUploadPercentage: number
}

type ViewProps = {
    studentName: string
    documentsUploadedCount: number
    totalDocumentTypes: number
    documentUploadPercentage: number
    isOpening: boolean
    onOpen: () => void
}

function StudentDocumentVaultView({
    studentName,
    documentsUploadedCount,
    totalDocumentTypes,
    documentUploadPercentage,
    isOpening,
    onOpen,
}: ViewProps) {
    return (
        <StudentDocumentVaultCell
            studentName={studentName}
            documentsUploadedCount={documentsUploadedCount}
            totalDocumentTypes={totalDocumentTypes}
            documentUploadPercentage={documentUploadPercentage}
            isOpening={isOpening}
            onOpen={onOpen}
        />
    )
}

export function withStudentDocumentVaultLogic(
    Component: typeof StudentDocumentVaultView
) {
    return function StudentDocumentVault({
        studentId,
        studentName,
        documentsUploadedCount,
        totalDocumentTypes,
        documentUploadPercentage,
    }: StudentDocumentVaultProps) {
        const router = useRouter()
        const queryClient = useQueryClient()

        const openMutation = useMutation({
            mutationFn: () => resolveStudentProgramDegreeId(queryClient, studentId),
            onSuccess: (degreeId) => {
                router.push(
                    `/dashboard/document/student/${studentId}/degree/${degreeId}?from=students`,
                    { scroll: false }
                )
            },
            onError: (error) => {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to open program documents"
                )
            },
        })

        const handleOpen = useCallback(() => {
            openMutation.mutate()
        }, [openMutation])

        return (
            <Component
                studentName={studentName}
                documentsUploadedCount={documentsUploadedCount}
                totalDocumentTypes={totalDocumentTypes}
                documentUploadPercentage={documentUploadPercentage}
                isOpening={openMutation.isPending}
                onOpen={handleOpen}
            />
        )
    }
}

export const StudentDocumentVault = withStudentDocumentVaultLogic(StudentDocumentVaultView)
