"use client"

import { memo, useCallback, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Printer } from "lucide-react"
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
import { DocumentTemplateFormView } from "./document-template-form-view"
import { DocumentTemplatePreview } from "./document-template-preview"
import { DocumentTemplateTable } from "./document-template-table"
import {
    withDocumentTemplatePageLogic,
    type DocumentTemplatePageLogicProps,
} from "../withDocumentTemplatePageLogic"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"

type PageContentProps = {
    initialTemplates: DocumentTemplateListItem[]
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

function DocumentTemplatePageView({
    templates,
    canCreateTemplate,
    canDeleteTemplate,
    isLoading,
    isError,
    errorMessage,
    mode,
    title,
    bodyHtml,
    isSaving,
    isDeleting,
    deletingId,
    deleteError,
    formError,
    setTitle,
    setBodyHtml,
    openEdit,
    openView,
    backToList,
    saveTemplate,
    deleteTemplateById,
    clearDeleteError,
    refetchTemplates,
}: DocumentTemplatePageLogicProps) {
    const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplateListItem | null>(
        null
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

    const handlePrint = () => {
        window.print()
    }

    if (mode === "list") {
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
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={handleOpenDeleteDialog}
                        onRetry={refetchTemplates}
                        viewOnly={false}
                        canDelete={canDeleteTemplate}
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
            </main>
        )
    }

    if (mode === "edit") {
        return (
            <DocumentTemplateFormView
                heading="Edit Document Template"
                title={title}
                bodyHtml={bodyHtml}
                isSaving={isSaving}
                formError={formError}
                onTitleChange={setTitle}
                onBodyChange={setBodyHtml}
                onSave={saveTemplate}
                onBack={backToList}
            />
        )
    }

    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <Button type="button" variant="outline" className="gap-2" onClick={backToList}>
                            <ArrowLeft className="size-4" />
                            Back to list
                        </Button>
                        <Typography as="h1" font="sub-heading" className="font-bold tracking-tight pt-4">
                            View Document Template
                        </Typography>
                    </div>

                    <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                        <Printer className="size-4" />
                        Print / Save as PDF
                    </Button>
                </div>

                <DocumentTemplatePreview
                    title={title}
                    bodyHtml={bodyHtml}
                    useSampleData
                    printable
                />
            </BluryCard>
        </main>
    )
}

const DocumentTemplatePageContent = memo(
    withDocumentTemplatePageLogic(DocumentTemplatePageView)
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
