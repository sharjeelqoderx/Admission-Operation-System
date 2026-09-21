"use client"

import { memo } from "react"
import Link from "next/link"
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
    canClone?: boolean
    canDelete?: boolean
    canEdit?: boolean
    onClone: (template: DocumentTemplateListItem) => void
    onDelete: (template: DocumentTemplateListItem) => void
}

export const DocumentTemplateRowActionsMenu = memo(function DocumentTemplateRowActionsMenu({
    template,
    isBusy = false,
    canClone = false,
    canDelete = true,
    canEdit = false,
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
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/dashboard/templates/${template.id}`}>
                        <Eye className="size-4 shrink-0 text-gray-600" />
                        <Typography as="span" className="text-sm font-semibold text-gray-800">
                            View
                        </Typography>
                    </Link>
                </DropdownMenuItem>

                {canEdit ? (
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/dashboard/templates/${template.id}/edit`}>
                            <Pencil className="size-4 shrink-0 text-gray-600" />
                            <Typography as="span" className="text-sm font-semibold text-gray-800">
                                Edit
                            </Typography>
                        </Link>
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
