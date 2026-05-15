"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Plus, Search } from "lucide-react"
import Link from "next/link"
import { DocumentTable } from "./_component/DocumentTable"
import { PageLoader } from "@/components/shared/page-loader"
import { useDebounce } from "@/hooks/use-debounce"

export default function DocumentPage() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const urlSearch = searchParams.get("search") || ""
    const status = searchParams.get("status") || "ALL"

    // Local state for responsive input
    const [localSearch, setLocalSearch] = useState(urlSearch)
    const debouncedSearch = useDebounce(localSearch, 600)

    // Sync debounced search to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (debouncedSearch) {
            params.set("search", debouncedSearch)
        } else {
            params.delete("search")
        }
        router.push(`${pathname}?${params.toString()}`)
    }, [debouncedSearch])

    const { data: documentsResponse, isLoading, isError, refetch } = useQuery({
        queryKey: ["documents", urlSearch, status],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (urlSearch) params.set("search", urlSearch)
            if (status !== "ALL") params.set("status", status)

            const res = await fetch(`/api/document?${params.toString()}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch")
            return json
        }
    })

    const updateStatus = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "ALL") {
            params.set("status", value)
        } else {
            params.delete("status")
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl py-0"
                childClass="py-0 flex! justify-between items-center flex-wrap gap-4"
            >
                <div className="space-y-1 max-w-2xl">
                    <Typography as="h2" font="sub-heading" className="font-bold tracking-tight">
                        All documents
                    </Typography>
                    <Typography as="p" font="sub-text" className="text-gray-500 font-medium max-w-2xl leading-relaxed">
                        View and manage all uploaded documents. 
                        {documentsResponse?.role === "STUDENT" ? " Here you can see your own documents and their review status." : " Agents can see documents for all their students."}
                    </Typography>
                </div>

                <Link href="/dashboard/document/new">
                    <Button className="px-6 gap-2 font-normal">
                        <Plus size={24} className="text-white" /> New Document
                    </Button>
                </Link>
            </BluryCard>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl py-6"
                childClass="flex flex-wrap gap-4 items-center justify-between"
            >
                <div className="flex flex-wrap gap-4 items-center flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-10 h-11 bg-white/50 border-white/20 focus:bg-white"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>

                    <Select value={status} onValueChange={updateStatus}>
                        <SelectTrigger className="w-[180px] h-11 bg-white/50 border-white/20 focus:bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </BluryCard>

            <DocumentTable
                rows={documentsResponse?.data || []}
                role={documentsResponse?.role}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
            />
        </div>
    )
}
