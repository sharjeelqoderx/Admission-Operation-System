"use client"

import React, { useCallback, useState } from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, AlertCircle, Copy, Check } from "lucide-react"
import { PageLoader } from "@/components/shared/page-loader"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { OfferListItem, OfferListPagination } from "@/types/schemas/offer"

type Props = {
    offers: OfferListItem[]
    pagination?: OfferListPagination
    isLoading: boolean
    isFetching?: boolean
    isError: boolean
    onRetry: () => void
    onPageChange: (page: number) => void
}

const COLUMN_COUNT = 5

function formatCreatedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export const OfferTable = React.memo(function OfferTable({
    offers,
    pagination,
    isLoading,
    isFetching = false,
    isError,
    onRetry,
    onPageChange,
}: Props) {
    const [copiedOfferId, setCopiedOfferId] = useState<string | null>(null)

    const handleCopySignLink = useCallback(async (offer: OfferListItem) => {
        if (!offer.application?.student?.id) {
            toast.error("Student data not available for this offer")
            return
        }
        const signLink = `${window.location.origin}/sign?user_id=${offer.application.student.id}&offer_id=${offer.id}`
        try {
            await navigator.clipboard.writeText(signLink)
            setCopiedOfferId(offer.id)
            toast.success("Sign link copied to clipboard!")
            setTimeout(() => setCopiedOfferId(null), 2000)
        } catch (err) {
            console.error("Failed to copy link:", err)
            toast.error("Failed to copy link")
        }
    }, [])

    const total = pagination?.total ?? 0
    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 10
    const totalPages = Math.max(1, pagination?.totalPages ?? 1)
    const startIndex = total === 0 ? 0 : (page - 1) * limit + 1
    const endIndex = total === 0 ? 0 : Math.min(page * limit, total)

    if (isLoading || isFetching) {
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
                    <div className="text-center">
                        <Typography as="p" className="text-sm font-bold text-gray-700">
                            Failed to load offers
                        </Typography>
                        <Typography as="p" className="text-xs text-gray-500 mt-1">
                            Check your connection and try again.
                        </Typography>
                    </div>
                    <button
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
            <div className="relative overflow-x-auto rounded-xl">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student
                            </TableHead>
                            <TableHead className="max-w-[220px] px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Program
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Created
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-white/45">
                        {offers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <Typography as="p" className="text-sm text-gray-500 font-medium">
                                        No offers found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            offers.map((offer, index) => {
                                const studentName = offer.application?.student?.name ?? "—"
                                const initials = studentName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()

                                return (
                                    <TableRow
                                        key={offer.id}
                                        className={cn(
                                            "border-b border-brand-secondary/15 transition-colors",
                                            index % 2 === 0 ? "bg-white/70" : "bg-white/45",
                                            "hover:bg-brand-secondary/5"
                                        )}
                                    >
                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10 rounded-xl border-2 border-white/50">
                                                    <AvatarImage
                                                        src={
                                                            offer.application?.student?.avatar_url ??
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`
                                                        }
                                                        alt={studentName}
                                                        className="rounded-xl"
                                                    />
                                                    <AvatarFallback className="rounded-xl text-[12px] font-bold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <Typography as="span" className="text-sm font-bold text-gray-900">
                                                        {studentName}
                                                    </Typography>
                                                    {offer.application?.application_no && (
                                                        <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                            {offer.application.application_no}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="max-w-[220px] px-6 py-5">
                                            <div className="min-w-0 max-w-[220px]">
                                                <Typography
                                                    as="span"
                                                    className="block truncate text-sm font-bold text-gray-700"
                                                    title={offer.application?.course?.name ?? undefined}
                                                >
                                                    {offer.application?.course?.name ?? "—"}
                                                </Typography>
                                                {offer.application?.course?.degree?.name && (
                                                    <Typography
                                                        as="span"
                                                        className="block truncate text-[11px] font-light text-gray-500"
                                                        title={offer.application.course.degree.name}
                                                    >
                                                        {offer.application.course.degree.name}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <StatusBadge status={offer.status} />
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-medium text-gray-600">
                                                {formatCreatedDate(offer.created_at)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                    asChild
                                                >
                                                    <Link href={`/dashboard/offer/${offer.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-3 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg transition-all shadow-sm"
                                                    onClick={() => handleCopySignLink(offer)}
                                                >
                                                    {copiedOfferId === offer.id ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Copy className="size-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>

                    <TableFooter className="border-t-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                        <TableRow className="hover:bg-brand-secondary/10 border-0">
                            <TableCell colSpan={COLUMN_COUNT} className="px-8 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            Showing
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-bold text-brand-blue-text mx-1">
                                            {startIndex}–{endIndex}
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            of
                                        </Typography>
                                        <Typography as="span" className="mx-1 text-[12px] font-bold text-brand-blue-text">
                                            {total}
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            total
                                        </Typography>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => onPageChange(Math.max(1, page - 1))}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Typography
                                            as="span"
                                            className="min-w-[72px] text-center text-[12px] font-medium text-gray-600"
                                        >
                                            {page} / {Math.max(totalPages, 1)}
                                        </Typography>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                onPageChange(Math.min(Math.max(totalPages, 1), page + 1))
                                            }
                                            disabled={page >= totalPages || total === 0}
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </BluryCard>
    )
})
