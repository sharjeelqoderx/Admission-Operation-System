"use client"

import React, { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Input } from "@/components/ui/input"
import { OfferTable } from "./_component/OfferTable"

export default function OfferPage() {
    const [searchQuery, setSearchQuery] = useState("")

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ["offers"],
        queryFn: async () => {
            const res = await fetch("/api/offer")
            if (!res.ok) throw new Error("Failed to fetch offers")
            const json = await res.json()
            return json
        },
    })

    const offers = useMemo(
        () => (Array.isArray(response?.data) ? response.data : []),
        [response]
    )

    return (
        <main className="relative space-y-6">
            {/* ── Header ── */}
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="space-y-4"
            >
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All offers
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s
                    </Typography>
                </div>
            </BluryCard>

            {/* ── Search Bar ── */}
            <div className="flex flex-col sm:flex-row gap-4 px-1">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by student name or program..."
                        className="w-full backdrop-blur-md ps-9 bg-white/20 border-white/40 focus:bg-white/40 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <OfferTable 
                offers={offers}
                isLoading={isLoading}
                isError={isError}
                searchQuery={searchQuery}
            />
        </main >
    )
}
