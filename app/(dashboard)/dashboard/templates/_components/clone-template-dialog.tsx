"use client"

import { memo, useCallback } from "react"
import { CopyPlus, Eye } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
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
import { Label } from "@/components/ui/label"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import { DocumentTemplateProgramSelect } from "./document-template-program-select"

type CloneTemplateDialogProps = {
    template: DocumentTemplateListItem | null
    cloneTitle: string
    cloneProgramId: string | null
    cloneError: string | null
    open: boolean
    isCloning: boolean
    onOpenChange: (open: boolean) => void
    onTitleChange: (value: string) => void
    onProgramChange: (value: string | null) => void
    onView: (template: DocumentTemplateListItem) => void
    onConfirm: () => void
}

function buildDefaultCloneTitle(title: string) {
    return `${title} (Copy)`
}

export function getDefaultCloneTitle(title: string) {
    return buildDefaultCloneTitle(title)
}

export function validateCloneTemplateTitle(
    title: string,
    sourceTemplate: DocumentTemplateListItem,
    existingTemplates: DocumentTemplateListItem[]
): string | null {
    const trimmed = title.trim()

    if (!trimmed) {
        return "Title is required."
    }

    if (trimmed.toLowerCase() === sourceTemplate.title.trim().toLowerCase()) {
        return "The cloned template must use a different title than the original."
    }

    const duplicate = existingTemplates.some(
        (template) => template.title.trim().toLowerCase() === trimmed.toLowerCase()
    )

    if (duplicate) {
        return "A template with this title already exists. Please choose another name."
    }

    return null
}

export const CloneTemplateDialog = memo(function CloneTemplateDialog({
    template,
    cloneTitle,
    cloneProgramId,
    cloneError,
    open,
    isCloning,
    onOpenChange,
    onTitleChange,
    onProgramChange,
    onView,
    onConfirm,
}: CloneTemplateDialogProps) {
    const handleTitleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onTitleChange(event.target.value)
        },
        [onTitleChange]
    )

    const handleViewTemplate = useCallback(() => {
        if (!template) return
        onView(template)
    }, [onView, template])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton={!isCloning}>
                <DialogHeader>
                    <DialogTitle>Clone template</DialogTitle>
                    <DialogDescription>
                        Choose a new title and assign a program for the cloned template. The clone
                        cannot keep the same name as the original. Use View to open the full template
                        preview first.
                    </DialogDescription>
                </DialogHeader>

                {template ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="clone-template-title">
                                <Typography as="span" className="text-sm font-semibold text-gray-800">
                                    New template title
                                </Typography>
                            </Label>
                            <Input
                                id="clone-template-title"
                                value={cloneTitle}
                                disabled={isCloning}
                                placeholder={buildDefaultCloneTitle(template.title)}
                                onChange={handleTitleChange}
                            />
                            <Typography as="p" className="text-xs text-muted-foreground">
                                Original title:{" "}
                                <Typography as="span" className="text-xs font-semibold text-gray-700">
                                    {template.title}
                                </Typography>
                            </Typography>
                        </div>

                        <DocumentTemplateProgramSelect
                            value={cloneProgramId}
                            disabled={isCloning}
                            onChange={onProgramChange}
                        />

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2"
                            disabled={isCloning}
                            onClick={handleViewTemplate}
                        >
                            <Eye className="size-4" />
                            View template
                        </Button>

                        {cloneError ? <ErrorView message={cloneError} /> : null}
                    </div>
                ) : null}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isCloning}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" disabled={isCloning || !template} onClick={onConfirm}>
                        <CopyPlus className="size-4" />
                        {isCloning ? "Cloning..." : "Clone template"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})
