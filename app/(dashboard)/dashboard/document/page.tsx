"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { DocumentTable } from "./_component/DocumentTable"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { FileUp } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function DocumentsPage() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["documents"],
        queryFn: async () => {
            const res = await fetch("/api/document")
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Failed to fetch")
            return json.data
        },
    })

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
                    <Button size={'sm'} className="bg-brand-byzantine hover:bg-brand-byzantine/80 text-white px-6 h-11 rounded-md shrink-0 shadow-md">
                        <FileUp className="size-4 mr-2" />
                        <Typography as="span" className="text-inherit font-medium capitalize text-sm">Upload document</Typography>
                    </Button>
                </Link>
            </BluryCard>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl p-2!"
                childClass="p-0! flex! justify-between items-center flex-wrap gap-4"
            >
                <Input placeholder="Enter to search" className="max-w-[300px] rounded-lg" />
            </BluryCard>
            
            <DocumentTable
                rows={data ?? []}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
            />
        </main>
    )
}
