"use client"

import React, { useCallback, useMemo, useState } from "react"
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
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type OfferRow = {
    id: string
    status: string
    created_at: string
    application?: {
        id: string
        application_no: string | null
        student?: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null
        course?: {
            id: string
            name: string | null
            degree?: { id: string; name: string } | null
        } | null
        university?: { id: string; name: string | null } | null
    } | null
}

type Props = {
    offers: OfferRow[]
    isLoading: boolean
    isError: boolean
    searchQuery: string
    onRetry: () => void
}

const COLUMN_COUNT = 6

function formatCreatedDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export const OfferTable = React.memo(function OfferTable({
    offers,
    isLoading,
    isError,
    searchQuery,
    onRetry,
}: Props) {
    const [copiedOfferId, setCopiedOfferId] = useState<string | null>(null)

    const handleCopySignLink = useCallback(async (offer: OfferRow) => {
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

    const filteredOffers = useMemo(() => {
        if (!searchQuery) return offers
        const s = searchQuery.toLowerCase()
        return offers.filter(
            (offer) =>
                offer.application?.student?.name?.toLowerCase().includes(s) ||
                offer.application?.student?.email?.toLowerCase().includes(s) ||
                offer.application?.course?.name?.toLowerCase().includes(s) ||
                offer.application?.course?.degree?.name?.toLowerCase().includes(s)
        )
    }, [offers, searchQuery])

    if (isLoading) {
        return (
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="size-8 text-brand-secondary animate-spin" />
                    <Typography as="p" className="text-sm font-medium text-gray-500">
                        Loading offers...
                    </Typography>
                </div>
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
            <div className="overflow-x-auto rounded-xl">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow className="border-b-2 border-brand-secondary/20 bg-brand-secondary/10 hover:bg-brand-secondary/10">
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Student
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                Program
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-extrabold tracking-widest text-brand-blue-text uppercase">
                                University
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
                        {filteredOffers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COLUMN_COUNT} className="px-8 py-16 text-center">
                                    <Typography as="p" className="text-sm text-gray-500 font-medium">
                                        No offers found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOffers.map((offer, index) => {
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

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Typography as="span" className="text-sm font-bold text-gray-700">
                                                    {offer.application?.course?.name ?? "—"}
                                                </Typography>
                                                {offer.application?.course?.degree?.name && (
                                                    <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                        {offer.application.course.degree.name}
                                                    </Typography>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-6 py-5 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-light text-gray-600">
                                                {offer.application?.university?.name ?? "—"}
                                            </Typography>
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
                                            {filteredOffers.length}
                                        </Typography>
                                        <Typography as="span" className="text-[12px] font-light text-gray-500">
                                            entries
                                        </Typography>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon">
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button variant="outline" size="icon">
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
