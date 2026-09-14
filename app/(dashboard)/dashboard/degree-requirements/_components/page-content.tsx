"use client"

import { memo } from "react"
import { Plus } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DegreeRequirementTable } from "./degree-requirement-table"
import {
    withDegreeRequirementPageLogic,
    type DegreeRequirementPageLogicProps,
} from "../withDegreeRequirementPageLogic"
import type {
    DegreeRequirementListItem,
    DocumentRequirementType,
} from "@/types/schemas/degree-requirement"

function RequirementTypeSelect({
    value,
    onChange,
    disabled,
    id,
}: {
    value: DocumentRequirementType
    onChange: (value: DocumentRequirementType) => void
    disabled?: boolean
    id?: string
}) {
    return (
        <Select
            value={value}
            disabled={disabled}
            onValueChange={(next) => onChange(next as DocumentRequirementType)}
        >
            <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="REQUIRED">Required</SelectItem>
                <SelectItem value="OPTIONAL">Optional</SelectItem>
            </SelectContent>
        </Select>
    )
}

function DegreeRequirementPageView(props: DegreeRequirementPageLogicProps) {
    const {
        requirements,
        isLoading,
        isError,
        errorMessage,
        includeDeleted,
        setIncludeDeleted,
        isSaving,
        removingId,
        formError,
        createOpen,
        setCreateOpen,
        editTarget,
        setEditTarget,
        removeTarget,
        setRemoveTarget,
        createDegreeId,
        setCreateDegreeId,
        createDocumentTypeId,
        setCreateDocumentTypeId,
        createRequirementType,
        setCreateRequirementType,
        editRequirementType,
        setEditRequirementType,
        degreeOptions,
        documentTypeOptions,
        optionsLoading,
        optionsError,
        createRequirement,
        updateRequirement,
        removeRequirement,
        restoreRequirement,
        refetch,
        clearFormError,
    } = props

    return (
        <main className="relative space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl space-y-1">
                        <Typography as="h1" font="sub-heading" className="font-bold tracking-tight">
                            Degree Requirements
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-muted-foreground">
                            Assign which documents are required or optional for each degree. Rows
                            are soft-removed only — never permanently deleted.
                        </Typography>
                    </div>

                    <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Add requirement
                    </Button>
                </div>

                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={includeDeleted}
                        onCheckedChange={(checked) => setIncludeDeleted(checked === true)}
                    />
                    <Typography as="span" className="text-sm text-gray-700">
                        Show removed requirements
                    </Typography>
                </label>
            </BluryCard>

            <div className="-mx-4 px-4 sm:-mx-6 sm:px-6">
                <DegreeRequirementTable
                    requirements={requirements}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    removingId={removingId}
                    onEdit={setEditTarget}
                    onRemove={setRemoveTarget}
                    onRestore={restoreRequirement}
                    onRetry={refetch}
                />
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md" showCloseButton={!isSaving}>
                    <DialogHeader>
                        <DialogTitle>Add degree requirement</DialogTitle>
                        <DialogDescription>
                            Link a document type to a degree and mark it required or optional.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {optionsError ? <ErrorView message={optionsError} /> : null}

                        <div className="space-y-2">
                            <Typography as="label" font="sub-text" className="font-semibold">
                                Degree
                            </Typography>
                            <Select
                                value={createDegreeId || undefined}
                                disabled={isSaving || optionsLoading}
                                onValueChange={setCreateDegreeId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            optionsLoading ? "Loading degrees..." : "Select degree"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {degreeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Typography as="label" font="sub-text" className="font-semibold">
                                Document type
                            </Typography>
                            <Select
                                value={createDocumentTypeId || undefined}
                                disabled={isSaving || optionsLoading}
                                onValueChange={setCreateDocumentTypeId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            optionsLoading
                                                ? "Loading documents..."
                                                : "Select document type"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.code
                                                ? `${option.label} (${option.code})`
                                                : option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Typography as="label" font="sub-text" className="font-semibold">
                                Requirement
                            </Typography>
                            <RequirementTypeSelect
                                value={createRequirementType}
                                disabled={isSaving}
                                onChange={setCreateRequirementType}
                            />
                        </div>

                        {formError ? <ErrorView message={formError} /> : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() => setCreateOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" disabled={isSaving} onClick={createRequirement}>
                            {isSaving ? "Saving..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditTarget(null)
                        clearFormError()
                    }
                }}
            >
                <DialogContent className="sm:max-w-md" showCloseButton={!isSaving}>
                    <DialogHeader>
                        <DialogTitle>Edit requirement</DialogTitle>
                        <DialogDescription>
                            {editTarget
                                ? `${editTarget.document_type_name} for ${editTarget.degree_name}`
                                : "Update required or optional status."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Typography as="label" font="sub-text" className="font-semibold">
                                Requirement
                            </Typography>
                            <RequirementTypeSelect
                                value={editRequirementType}
                                disabled={isSaving}
                                onChange={setEditRequirementType}
                            />
                        </div>
                        {formError ? <ErrorView message={formError} /> : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() => setEditTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" disabled={isSaving} onClick={updateRequirement}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={removeTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !removingId) setRemoveTarget(null)
                }}
            >
                <DialogContent className="sm:max-w-md" showCloseButton={!removingId}>
                    <DialogHeader>
                        <DialogTitle>Remove requirement?</DialogTitle>
                        <DialogDescription>
                            {removeTarget
                                ? `Soft-remove "${removeTarget.document_type_name}" from ${removeTarget.degree_name}? You can restore it later.`
                                : "This only soft-removes the requirement."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={Boolean(removingId)}
                            onClick={() => setRemoveTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={Boolean(removingId)}
                            onClick={removeRequirement}
                        >
                            {removingId ? "Removing..." : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}

const DegreeRequirementPageContent = memo(
    withDegreeRequirementPageLogic(DegreeRequirementPageView)
)

DegreeRequirementPageContent.displayName = "DegreeRequirementPageContent"

export function PageContent({
    initialRequirements,
}: {
    initialRequirements?: DegreeRequirementListItem[]
}) {
    return <DegreeRequirementPageContent initialRequirements={initialRequirements} />
}
