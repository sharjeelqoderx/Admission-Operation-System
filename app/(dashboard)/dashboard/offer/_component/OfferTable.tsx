"use client"

import React from "react"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function OfferTable({
    offers,
    isLoading,
    isError,
    searchQuery
}: {
    offers: any[]
    isLoading: boolean
    isError: boolean
    searchQuery: string
}) {
    const filteredOffers = offers.filter(offer => {
        if (!searchQuery) return true;
        const s = searchQuery.toLowerCase();
        return (
            offer.application?.student?.name?.toLowerCase().includes(s) ||
            offer.application?.student?.email?.toLowerCase().includes(s) ||
            offer.application?.program?.name?.toLowerCase().includes(s)
        )
    });


    return (
        <BluryCard
            isCentered={false}
            blurAmount="backdrop-blur-lg"
            blendColorClass="bg-white/10"
            childClass="p-0!"
            className="rounded-lg p-0"
        >
            <div className="overflow-x-auto">
                <Table className="w-full text-left border-collapse min-w-[900px]">
                    <TableHeader>
                        <TableRow className="border-b border-white/20 bg-white/30 hover:bg-white/30">
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Student Name
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Program
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Campus
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Status
                            </TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-extrabold tracking-widest text-gray-600 uppercase">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-white/10">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="px-8 py-6 text-center">
                                        <div className="h-8 w-full bg-white/20 animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={5} className="px-8 py-6 text-center text-red-500">
                                    Failed to load offers.
                                </TableCell>
                            </TableRow>
                        ) : filteredOffers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="px-8 py-6 text-center text-gray-500">
                                    No offers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOffers.map((offer) => {
                                const studentName = offer.application?.student?.name || "Unknown Student";
                                const initials = studentName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <TableRow key={offer.id} className="hover:bg-white/10 transition-colors group">
                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
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
                                                    <Typography as="span" className="text-[11px] text-gray-500 font-light">
                                                        {offer.application?.application_no || "N/A"}
                                                    </Typography>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-bold text-gray-700">
                                                {offer.application?.program?.name || "N/A"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Typography as="span" className="text-sm font-light text-gray-600">
                                                {offer.application?.university?.name || "N/A"}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <StatusBadge status={offer.status} />
                                        </TableCell>

                                        <TableCell className="px-8 py-6 whitespace-nowrap">
                                            <Button
                                                variant="outline"
                                                className="h-9 px-6 bg-white/20 border-white/40 text-gray-700 hover:bg-white/40 rounded-lg font-bold text-[12px] transition-all shadow-sm"
                                                asChild
                                            >
                                                <Link href={`/dashboard/offer/${offer.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-8 py-5 border-t border-white/20 bg-white/5">
                <div className="flex items-center text-[12px] font-light text-gray-500 space-x-1">
                    <Typography as="span" className="text-[12px] font-light text-gray-500">
                        Showing
                    </Typography>
                    <Typography as="span" className="text-[12px] font-bold text-gray-700 mx-1">
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
        </BluryCard>
    )
}
