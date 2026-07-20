"use client"

import { memo } from "react"
import Link from "next/link"
import { Check, EllipsisVertical, SquareArrowOutUpRight, X } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Spinner } from "@/components/shared/page-loader"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Props = {
    mode: "review" | "view-only"
    viewHref: string
    canReview?: boolean
    isReviewing?: boolean
    onAccept?: () => void
    onDecline?: () => void
}

export const DocumentRowActionsMenu = memo(function DocumentRowActionsMenu({
    mode,
    viewHref,
    canReview = false,
    isReviewing = false,
    onAccept,
    onDecline,
}: Props) {
    const showReviewActions = mode === "review" && canReview

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isReviewing}
                    aria-label="Document actions"
                    className="size-9 rounded-lg border border-gray-200 bg-white/80 text-gray-700 hover:bg-white hover:border-gray-300"
                >
                    {isReviewing ? (
                        <Spinner size="sm" />
                    ) : (
                        <EllipsisVertical className="size-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={viewHref} className="flex w-full items-center">
                        <Typography as="span" className="text-sm font-semibold text-gray-800">
                            View
                        </Typography>
                        <SquareArrowOutUpRight className="size-4 shrink-0 text-gray-600 ml-auto" />
                    </Link>
                </DropdownMenuItem>
                {showReviewActions && (
                    <>
                        <DropdownMenuItem
                            disabled={isReviewing}
                            className="cursor-pointer"
                            onClick={onAccept}
                        >
                            <Typography as="span" className="text-sm font-semibold text-gray-800">
                                Accept
                            </Typography>
                            <Check className="size-4 shrink-0 text-green-600 ml-auto" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={isReviewing}
                            className={cn(
                                "cursor-pointer bg-red-700 text-white",
                                "hover:bg-red-700 focus:bg-red-700 focus:text-white",
                                "data-highlighted:bg-red-700 data-highlighted:text-white",
                                "focus:**:text-white data-highlighted:**:text-white",
                                "[&_svg]:text-white focus:[&_svg]:text-white data-highlighted:[&_svg]:text-white"
                            )}
                            onClick={onDecline}
                        >
                            <Typography as="span" className="text-sm font-semibold text-white">
                                Decline
                            </Typography>
                            <X className="size-4 shrink-0 text-white ml-auto" />
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
