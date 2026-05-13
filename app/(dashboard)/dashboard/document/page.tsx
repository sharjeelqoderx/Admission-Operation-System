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

    const { data: documents, isLoading, isError, refetch } = useQuery({
        queryKey: ["documents", urlSearch, status],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (urlSearch) params.set("search", urlSearch)
            if (status !== "ALL") params.set("status", status)

            const res = await fetch(`/api/document?${params.toString()}`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch")
            return json.data
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
        <main className="space-y-8">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl py-0"
                childClass="py-0 flex! justify-between items-center flex-wrap gap-4"
            >
                <div className="space-y-0">
                    <Typography font='text-xl' as={'h2'} className="capitalize">
                        All documents
                    </Typography>

                    <Typography font='text' as={'p'} className='max-w-[660] text-gray-600 size-full'>
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s
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
                className="rounded-xl p-4!"
                childClass="p-0! flex! justify-between items-center flex-wrap gap-4"
            >
                <div className="relative w-full max-w-[350px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        placeholder="Search student name..."
                        className="pl-10 h-11 rounded-lg border-none focus-visible:ring-brand-byzantine"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Typography as="span" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Status Filter
                    </Typography>
                    <Select value={status} onValueChange={updateStatus}>
                        <SelectTrigger className="w-[180px] h-11 rounded-xl border-none bg-gray-50 focus:ring-brand-byzantine/20">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Documents</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </BluryCard>

            {isLoading ? (
                <PageLoader label="Searching documents..." />
            ) : (
                <DocumentTable
                    rows={documents ?? []}
                    isLoading={isLoading}
                    isError={isError}
                    onRetry={refetch}
                />
            )}
        </main>
    )
}
