"use client"

import { memo, useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DocumentTemplateTable } from "./document-template-table"
import {
    CloneTemplateDialog,
    getDefaultCloneTitle,
    validateCloneTemplateTitle,
} from "./clone-template-dialog"
import {
    withDocumentTemplatePageLogic,
    type DocumentTemplateListLogicProps,
} from "../withDocumentTemplatePageLogic"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"

type PageContentProps = {
    initialTemplates?: DocumentTemplateListItem[]
    canCreateTemplate: boolean
    canDeleteTemplate: boolean
}

type DeleteTemplateDialogProps = {
    template: DocumentTemplateListItem | null
    open: boolean
    isDeleting: boolean
    deleteError: string | null
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

function DeleteTemplateDialog({
    template,
    open,
    isDeleting,
    deleteError,
    onOpenChange,
    onConfirm,
}: DeleteTemplateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
                <DialogHeader>
                    <DialogTitle>Delete template?</DialogTitle>
                    <DialogDescription>
                        {template
                            ? `Delete "${template.title}"? This action cannot be undone.`
                            : "This action cannot be undone."}
                    </DialogDescription>
                </DialogHeader>
                {deleteError ? <ErrorView message={deleteError} /> : null}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={onConfirm}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DocumentTemplateListPageView({
    templates,
    canCreateTemplate,
    canDeleteTemplate,
    isLoading,
    isError,
    errorMessage,
    isDeleting,
    deletingId,
    cloningId,
    deleteError,
    deleteTemplateById,
    cloneTemplate,
    clearDeleteError,
    refetchTemplates,
}: DocumentTemplateListLogicProps) {
    const router = useRouter()
    const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplateListItem | null>(
        null
    )
    const [templateToClone, setTemplateToClone] = useState<DocumentTemplateListItem | null>(null)
    const [cloneTitle, setCloneTitle] = useState("")
    const [cloneProgramIds, setCloneProgramIds] = useState<string[]>([])
    const [cloneError, setCloneError] = useState<string | null>(null)

    const handleOpenCloneDialog = useCallback((template: DocumentTemplateListItem) => {
        setCloneError(null)
        setCloneTitle(getDefaultCloneTitle(template.title))
        setCloneProgramIds([])
        setTemplateToClone(template)
    }, [])

    const handleCloseCloneDialog = useCallback(() => {
        if (cloningId) return
        setCloneError(null)
        setCloneTitle("")
        setCloneProgramIds([])
        setTemplateToClone(null)
    }, [cloningId])

    const handleConfirmClone = useCallback(async () => {
        if (!templateToClone) return

        const validationError = validateCloneTemplateTitle(
            cloneTitle,
            templateToClone,
            templates
        )

        if (validationError) {
            setCloneError(validationError)
            return
        }

        if (cloneProgramIds.length === 0) {
            setCloneError("Select at least one program for this offer template.")
            return
        }

        setCloneError(null)

        try {
            const cloned = await cloneTemplate({
                sourceId: templateToClone.id,
                title: cloneTitle.trim(),
                body_html: templateToClone.body_html,
                locale: templateToClone.locale,
                template_dates: templateToClone.template_dates,
                watermark: templateToClone.watermark,
                course_ids: cloneProgramIds,
            })
            setTemplateToClone(null)
            setCloneTitle("")
            setCloneProgramIds([])
            if (cloned) {
                router.push(`/dashboard/templates/${cloned.id}`)
            }
        } catch {
            // Error toast is handled in cloneTemplate.
        }
    }, [cloneProgramIds, cloneTemplate, cloneTitle, router, templateToClone, templates])

    const handleViewFromClone = useCallback(
        (template: DocumentTemplateListItem) => {
            setCloneError(null)
            setCloneTitle("")
            setCloneProgramIds([])
            setTemplateToClone(null)
            router.push(`/dashboard/templates/${template.id}`)
        },
        [router]
    )

    const handleOpenDeleteDialog = useCallback(
        (template: DocumentTemplateListItem) => {
            clearDeleteError()
            setTemplateToDelete(template)
        },
        [clearDeleteError]
    )

    const handleCloseDeleteDialog = useCallback(() => {
        if (isDeleting) return
        clearDeleteError()
        setTemplateToDelete(null)
    }, [clearDeleteError, isDeleting])

    const handleConfirmDelete = useCallback(async () => {
        if (!templateToDelete) return

        try {
            await deleteTemplateById(templateToDelete.id)
            setTemplateToDelete(null)
        } catch {
            // Error toast is handled in deleteTemplateById.
        }
    }, [deleteTemplateById, templateToDelete])

    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 max-w-2xl">
                        <Typography as="h1" font="sub-heading" className="font-bold tracking-tight">
                            Document Templates
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-muted-foreground">
                            Create reusable document templates with dynamic fields like{" "}
                            {"{{student_name}}"}, {"{{student_signature}}"}, and dynamic sections
                            like the admission requirements checklist for conditional letters.
                        </Typography>
                    </div>
                    {canCreateTemplate ? (
                        <Button type="button" asChild>
                            <Link href="/dashboard/templates/new">
                                <Plus className="size-4" />
                                Create Template
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </BluryCard>

            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
                <DocumentTemplateTable
                    templates={templates}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    deletingId={deletingId}
                    cloningId={cloningId}
                    onClone={handleOpenCloneDialog}
                    onDelete={handleOpenDeleteDialog}
                    onRetry={refetchTemplates}
                    canClone={canCreateTemplate}
                    canDelete={canDeleteTemplate}
                    canEdit={canCreateTemplate}
                />
            </div>

            {canDeleteTemplate ? (
                <DeleteTemplateDialog
                    template={templateToDelete}
                    open={templateToDelete !== null}
                    isDeleting={isDeleting}
                    deleteError={deleteError}
                    onOpenChange={(open) => {
                        if (!open) handleCloseDeleteDialog()
                    }}
                    onConfirm={handleConfirmDelete}
                />
            ) : null}

            {canCreateTemplate ? (
                <CloneTemplateDialog
                    template={templateToClone}
                    cloneTitle={cloneTitle}
                    cloneProgramIds={cloneProgramIds}
                    cloneError={cloneError}
                    open={templateToClone !== null}
                    isCloning={cloningId !== null}
                    onOpenChange={(open) => {
                        if (!open) handleCloseCloneDialog()
                    }}
                    onTitleChange={(value) => {
                        setCloneError(null)
                        setCloneTitle(value)
                    }}
                    onProgramIdsChange={(value) => {
                        setCloneError(null)
                        setCloneProgramIds(value)
                    }}
                    onView={handleViewFromClone}
                    onConfirm={handleConfirmClone}
                />
            ) : null}
        </main>
    )
}

const DocumentTemplatePageContent = memo(
    withDocumentTemplatePageLogic(DocumentTemplateListPageView)
)

DocumentTemplatePageContent.displayName = "DocumentTemplatePageContent"

export function PageContent({
    initialTemplates,
    canCreateTemplate,
    canDeleteTemplate,
}: PageContentProps) {
    return (
        <DocumentTemplatePageContent
            initialTemplates={initialTemplates}
            canCreateTemplate={canCreateTemplate}
            canDeleteTemplate={canDeleteTemplate}
        />
    )
}
