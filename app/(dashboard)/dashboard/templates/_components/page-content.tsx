"use client"

import { memo, useCallback, useState } from "react"
import { ArrowLeft, Plus, Printer, Save } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { DocumentTemplateEditor } from "./document-template-editor"
import { DocumentTemplatePreview } from "./document-template-preview"
import { DocumentTemplateTable } from "./document-template-table"
import {
    withDocumentTemplatePageLogic,
    type DocumentTemplatePageLogicProps,
} from "../withDocumentTemplatePageLogic"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"

type PageContentProps = {
    initialTemplates: DocumentTemplateListItem[]
}

type DeleteTemplateDialogProps = {
    template: DocumentTemplateListItem | null
    open: boolean
    isDeleting: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

function DeleteTemplateDialog({
    template,
    open,
    isDeleting,
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
    isLoading,
    isError,
    errorMessage,
    mode,
    title,
    bodyHtml,
    isSaving,
    isDeleting,
    deletingId,
    formError,
    setTitle,
    setBodyHtml,
    openCreate,
    openEdit,
    openView,
    backToList,
    saveTemplate,
    deleteTemplateById,
    refetchTemplates,
}: DocumentTemplatePageLogicProps) {
    const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplateListItem | null>(
        null
    )

    const handleOpenDeleteDialog = useCallback((template: DocumentTemplateListItem) => {
        setTemplateToDelete(template)
    }, [])

    const handleCloseDeleteDialog = useCallback(() => {
        if (isDeleting) return
        setTemplateToDelete(null)
    }, [isDeleting])

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
                        <Button type="button" onClick={openCreate}>
                            <Plus className="size-4" />
                            Create Template
                        </Button>
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
                    />
                </div>

                <DeleteTemplateDialog
                    template={templateToDelete}
                    open={templateToDelete !== null}
                    isDeleting={isDeleting}
                    onOpenChange={(open) => {
                        if (!open) handleCloseDeleteDialog()
                    }}
                    onConfirm={handleConfirmDelete}
                />
            </main>
        )
    }

    const isViewMode = mode === "view"
    const heading =
        mode === "create"
            ? "Create Document Template"
            : mode === "edit"
              ? "Edit Document Template"
              : "View Document Template"

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
                            {heading}
                        </Typography>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {isViewMode ? (
                            <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                                <Printer className="size-4" />
                                Print / Save as PDF
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="gap-2"
                                disabled={isSaving}
                                onClick={saveTemplate}
                            >
                                <Save className="size-4" />
                                {isSaving ? "Saving..." : "Save Template"}
                            </Button>
                        )}
                    </div>
                </div>

                {!isViewMode ? (
                    <div className="space-y-2">
                        <Typography as="label" font="sub-text" className="font-semibold">
                            Template title
                        </Typography>
                        <Input
                            value={title}
                            placeholder="e.g. Admission Offer Letter"
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </div>
                ) : null}

                {formError ? <ErrorView message={formError} /> : null}

                {isViewMode ? (
                    <DocumentTemplatePreview
                        title={title}
                        bodyHtml={bodyHtml}
                        useSampleData
                        printable
                    />
                ) : (
                    <DocumentTemplateEditor
                        content={bodyHtml}
                        onChange={setBodyHtml}
                    />
                )}
            </BluryCard>
        </main>
    )
}

const DocumentTemplatePageContent = memo(
    withDocumentTemplatePageLogic(DocumentTemplatePageView)
)

DocumentTemplatePageContent.displayName = "DocumentTemplatePageContent"

export function PageContent({ initialTemplates }: PageContentProps) {
    return <DocumentTemplatePageContent initialTemplates={initialTemplates} />
}
