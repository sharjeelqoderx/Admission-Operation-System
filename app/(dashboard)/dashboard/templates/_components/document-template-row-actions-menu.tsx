"use client"

import { memo } from "react"
import { CopyPlus, EllipsisVertical, Eye, Pencil, Trash2 } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Spinner } from "@/components/shared/page-loader"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentTemplateListItem } from "@/types/schemas/document-template"

type DocumentTemplateRowActionsMenuProps = {
    template: DocumentTemplateListItem
    isBusy?: boolean
    viewOnly?: boolean
    canClone?: boolean
    canDelete?: boolean
    onView: (template: DocumentTemplateListItem) => void
    onEdit: (template: DocumentTemplateListItem) => void
    onClone: (template: DocumentTemplateListItem) => void
    onDelete: (template: DocumentTemplateListItem) => void
}

export const DocumentTemplateRowActionsMenu = memo(function DocumentTemplateRowActionsMenu({
    template,
    isBusy = false,
    viewOnly = false,
    canClone = false,
    canDelete = true,
    onView,
    onEdit,
    onClone,
    onDelete,
}: DocumentTemplateRowActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isBusy}
                    aria-label={`Actions for ${template.title}`}
                    className="size-9 rounded-lg border border-gray-200 bg-white/80 text-gray-700 hover:bg-white hover:border-gray-300"
                >
                    {isBusy ? (
                        <Spinner size="sm" />
                    ) : (
                        <EllipsisVertical className="size-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onView(template)}
                >
                    <Eye className="size-4 shrink-0 text-gray-600" />
                    <Typography as="span" className="text-sm font-semibold text-gray-800">
                        View
                    </Typography>
                </DropdownMenuItem>

                {!viewOnly ? (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(template)}
                    >
                        <Pencil className="size-4 shrink-0 text-gray-600" />
                        <Typography as="span" className="text-sm font-semibold text-gray-800">
                            Edit
                        </Typography>
                    </DropdownMenuItem>
                ) : null}

                {canClone ? (
                    <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={isBusy}
                        onClick={() => onClone(template)}
                    >
                        <CopyPlus className="size-4 shrink-0 text-gray-600" />
                        <Typography as="span" className="text-sm font-semibold text-gray-800">
                            Clone
                        </Typography>
                    </DropdownMenuItem>
                ) : null}

                {canDelete ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={isBusy}
                            onClick={() => onDelete(template)}
                        >
                            <Trash2 className="size-4 shrink-0" />
                            <Typography as="span" className="text-sm font-semibold">
                                Delete
                            </Typography>
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
