"use client"

import { useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { DegreeDocumentBundle } from "@/types/schemas/document"
import { AlertCircle, FileText, Pencil, Plus, Upload } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    formatDocumentStatus,
    getDocumentStatusBadgeClass,
    getPendingEntry,
    hasPendingFiles,
    type PendingEntry,
    type PendingFilesMap,
} from "./degree-documents-shared"

function NotePopover({
    note,
    documentId,
    onSave,
    isDisabled,
}: {
    note: string
    documentId?: string
    onSave: (note: string) => void
    isDisabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState(note)
    const [saving, setSaving] = useState(false)

    const handleOpenChange = (v: boolean) => {
        if (v) setDraft(note)
        setOpen(v)
    }

    const handleSave = async () => {
        if (documentId) {
            setSaving(true)
            await fetch(`/api/document/${documentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: draft }),
            })
            setSaving(false)
        }
        onSave(draft)
        setOpen(false)
    }

    return (
        <div className="flex items-center gap-2">
            {note && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="size-9 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center"
                            >
                                <AlertCircle className="size-4 text-amber-600" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px]">
                            <p className="text-sm whitespace-pre-wrap">{note}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    {note ? (
                        <button
                            type="button"
                            className="size-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-byzantine transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isDisabled}
                        >
                            <Pencil className="size-4 text-gray-600" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="size-9 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:border-brand-byzantine transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isDisabled}
                        >
                            <Plus className="size-4 text-gray-600" />
                        </button>
                    )}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[280px] space-y-3">
                    <Typography font="text" className="font-semibold">
                        {note ? "Edit Note" : "Add Note"}
                    </Typography>
                    <textarea
                        autoFocus
                        placeholder="Write note..."
                        className="w-full min-h-[100px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-byzantine resize-none"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

type Props = {
    bundle: DegreeDocumentBundle
    pendingFiles: PendingFilesMap
    onPendingChange: (documentTypeId: string, entry: PendingEntry) => void
    isSaving: Record<string, boolean>
    onSaveRow: (
        degreeId: string,
        documentTypeId: string,
        files: File[],
        note: string
    ) => void
}

export function DegreeDocumentsTable({
    bundle,
    pendingFiles,
    onPendingChange,
    isSaving,
    onSaveRow,
}: Props) {
    if (bundle.required_documents.length === 0) {
        return (
            <Typography font="sub-text" className="text-gray-500 py-8 text-center">
                No required documents configured for this program.
            </Typography>
        )
    }

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead className="font-semibold text-gray-700">Last Updated</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[200px]">Document</TableHead>
                        <TableHead className="font-semibold text-gray-700 min-w-[280px]">Upload</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Note</TableHead>
                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bundle.required_documents.map((requirement) => {
                        const entry = getPendingEntry(
                            pendingFiles,
                            requirement.document_type_id
                        )
                        const uploaded = requirement.uploaded
                        const uploadedFrontUrl =
                            uploaded?.files?.[0]?.file_url ?? null
                        const hasFile = Boolean(entry.front || uploadedFrontUrl)
                        const isLocked =
                            uploaded?.status === "APPROVED" ||
                            uploaded?.status === "VERIFIED"

                        return (
                            <TableRow key={requirement.requirement_id} className="align-top">
                                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                    {uploaded?.updated_at
                                        ? new Date(uploaded.updated_at).toLocaleDateString()
                                        : "—"}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-4 text-brand-byzantine shrink-0" />
                                            <Typography
                                                font="text"
                                                className="font-semibold text-gray-900"
                                            >
                                                {requirement.name}
                                            </Typography>
                                        </div>
                                        {requirement.description && (
                                            <Typography
                                                font="small"
                                                className="text-gray-500"
                                            >
                                                {requirement.description}
                                            </Typography>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <label
                                            htmlFor={`upload-${requirement.document_type_id}`}
                                            className={cn(
                                                "size-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-byzantine transition-colors",
                                                isLocked && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <Upload className="size-4 text-gray-600" />
                                        </label>
                                        <input
                                            id={`upload-${requirement.document_type_id}`}
                                            type="file"
                                            className="hidden"
                                            accept="image/*,application/pdf,.doc,.docx"
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null
                                                onPendingChange(
                                                    requirement.document_type_id,
                                                    { ...entry, front: file }
                                                )
                                            }}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            {entry.front ? (
                                                <>
                                                    <span className="text-sm font-medium text-emerald-600 truncate">
                                                        {entry.front.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {(entry.front.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </>
                                            ) : uploaded?.files?.[0] ? (
                                                <>
                                                    <span className="text-sm font-medium text-blue-600">
                                                        Uploaded
                                                    </span>
                                                    <a
                                                        href={uploaded.files[0].file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-brand-byzantine underline"
                                                    >
                                                        View file
                                                    </a>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-500">
                                                    No file selected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {uploaded ? (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] uppercase tracking-wide",
                                                getDocumentStatusBadgeClass(uploaded.status)
                                            )}
                                        >
                                            {formatDocumentStatus(uploaded.status)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">
                                            {hasFile ? "Ready" : "Pending"}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <NotePopover
                                        note={entry.note}
                                        documentId={uploaded?.document_id}
                                        onSave={(note) =>
                                            onPendingChange(
                                                requirement.document_type_id,
                                                { ...entry, note }
                                            )
                                        }
                                        isDisabled={isLocked}
                                    />
                                </TableCell>
                                <TableCell>
                                    {entry.front && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-brand-byzantine hover:bg-brand-byzantine/90"
                                            disabled={
                                                isSaving[requirement.document_type_id]
                                            }
                                            onClick={() =>
                                                onSaveRow(
                                                    bundle.degree.id,
                                                    requirement.document_type_id,
                                                    entry.front ? [entry.front] : [],
                                                    entry.note
                                                )
                                            }
                                        >
                                            {isSaving[requirement.document_type_id]
                                                ? "Saving..."
                                                : "Save"}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
