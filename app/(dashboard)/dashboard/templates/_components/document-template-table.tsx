"use client"

import { memo } from "react"
import { AlertCircle, FileText } from "lucide-react"
import { PageLoader } from "@/components/shared/page-loader"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { DocumentTemplateRowActionsMenu } from "./document-template-row-actions-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"
import { cn } from "@/lib/utils"

type DocumentTemplateTableProps = {
    templates: DocumentTemplateListItem[]
    isLoading: boolean
    isError: boolean
    errorMessage?: string
    deletingId: string | null
    cloningId: string | null
    onView: (template: DocumentTemplateListItem) => void
    onEdit: (template: DocumentTemplateListItem) => void
    onClone: (template: DocumentTemplateListItem) => void
    onDelete: (template: DocumentTemplateListItem) => void
    onRetry: () => void
    viewOnly?: boolean
    canClone?: boolean
    canDelete?: boolean
}

const COLUMN_COUNT = 5
const ACTION_COLUMN_WIDTH = "w-[88px]"

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatVariablesLabel(variables: string[]) {
    if (variables.length === 0) return "—"
    return variables.map((v) => `{{${v}}}`).join(", ")
}

export const DocumentTemplateTable = memo(function DocumentTemplateTable({
    templates,
    isLoading,
    isError,
    errorMessage,
    deletingId,
    cloningId,
    onView,
    onEdit,
    onClone,
    onDelete,
    onRetry,
    viewOnly = false,
    canClone = false,
    canDelete = true,
}: DocumentTemplateTableProps) {
    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <PageLoader className="py-24" />
            </BluryCard>
        )
    }

    if (isError) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="size-8 text-red-400" />
                    </div>
                    <div className="text-center px-4">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            {errorMessage || "Failed to load document templates"}
                        </Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-1">
                            Check your connection and try again.
                        </Typography>
                    </div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </BluryCard>
        )
    }

    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="p-0!"
            className="rounded-lg p-0"
        >
            <div className="w-full overflow-x-auto rounded-xl max-w-full pb-2">
                <Table className="w-full table-fixed text-left border-collapse min-w-[760px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="w-[180px] max-w-[180px] px-4 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Title
                            </TableHead>
                            <TableHead className="w-[180px] max-w-[180px] px-4 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Program
                            </TableHead>
                            <TableHead className="w-[100px] px-4 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Variables
                            </TableHead>
                            <TableHead className="w-[110px] px-4 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Updated
                            </TableHead>
                            <TableHead className={`${ACTION_COLUMN_WIDTH} px-4 py-4 text-center text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase`}>
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="size-8 text-gray-300" />
                                        <Typography as="p" className="text-sm font-medium text-gray-500">
                                            No document templates yet.
                                        </Typography>
                                        <Typography as="p" className="text-xs text-gray-400">
                                            Create your first template to get started.
                                        </Typography>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template, index) => (
                                <TableRow
                                    key={template.id}
                                    className={cn(
                                        "border-b border-brand-secondary/15 transition-colors",
                                        index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                        "hover:bg-brand-secondary/5",
                                        deletingId === template.id && "opacity-50"
                                    )}
                                >
                                    <TableCell className="max-w-[180px] px-4 py-5">
                                        <span className="block truncate" title={template.title}>
                                            <Typography as="span" className="text-sm font-bold text-gray-900">
                                                {template.title}
                                            </Typography>
                                        </span>
                                    </TableCell>

                                    <TableCell className="max-w-[180px] px-4 py-5">
                                        <span
                                            className="block truncate"
                                            title={template.program_label ?? undefined}
                                        >
                                            <Typography
                                                as="span"
                                                className="text-xs font-medium text-gray-600"
                                            >
                                                {template.program_label ?? "Not assigned"}
                                            </Typography>
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-4 py-5">
                                        <span
                                            className="block max-w-[100px] truncate"
                                            title={formatVariablesLabel(template.variables)}
                                        >
                                            <Typography
                                                as="span"
                                                className="text-xs font-medium text-gray-600"
                                            >
                                                {template.variables.length > 0
                                                    ? `${template.variables.length} field${template.variables.length === 1 ? "" : "s"}`
                                                    : "—"}
                                            </Typography>
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-4 py-5 whitespace-nowrap">
                                        <Typography as="span" className="text-sm font-medium text-gray-600">
                                            {formatDate(template.updated_at)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell className={`${ACTION_COLUMN_WIDTH} px-4 py-5 whitespace-nowrap`}>
                                        <div className="flex items-center justify-center">
                                            <DocumentTemplateRowActionsMenu
                                                template={template}
                                                isBusy={
                                                    deletingId === template.id ||
                                                    cloningId === template.id
                                                }
                                                viewOnly={viewOnly}
                                                canClone={canClone}
                                                canDelete={canDelete}
                                                onView={onView}
                                                onEdit={onEdit}
                                                onClone={onClone}
                                                onDelete={onDelete}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>

                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="hover:bg-brand-secondary/10 border-0">
                            <TableCell colSpan={COLUMN_COUNT} className="px-8 py-5">
                                <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                                    <Typography as="span" className="text-[12px] font-light text-gray-500">
                                        Showing
                                    </Typography>
                                    <Typography
                                        as="span"
                                        className="text-[12px] font-bold text-brand-blue-text mx-1"
                                    >
                                        {templates.length}
                                    </Typography>
                                    <Typography as="span" className="text-[12px] font-light text-gray-500">
                                        {templates.length === 1 ? "entry" : "entries"}
                                    </Typography>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </BluryCard>
    )
})
