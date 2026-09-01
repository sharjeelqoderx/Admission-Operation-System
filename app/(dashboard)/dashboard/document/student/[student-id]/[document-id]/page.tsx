"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ChevronLeft, ExternalLink, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

import { DocumentViewer } from "../../../_component/DocumentViewer"

type PageProps = {
    params: Promise<{ "student-id": string, "document-id": string }>
}

export default function DocumentDetailPage({ params }: PageProps) {
    const { "document-id": documentId } = use(params)
    const router = useRouter()

    const { data: document, isLoading } = useQuery({
        queryKey: ["document", documentId],
        queryFn: async () => {
            const res = await fetch(`/api/document/${documentId}`)
            const json = await res.json()
            return json.data
        }
    })

    if (isLoading) return <DetailPageSkeleton />
    if (!document) return <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest">Document not found.</div>

    return (
        <main className="max-w-[1400px] mx-auto space-y-8 px-6 lg:px-12 pt-4 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div>
                        <Typography font="text-xl" as="h2">
                            {document.name}
                        </Typography>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={document.document_review?.[0]?.status || "PENDING"} />
                            <Typography as="span" className="text-xs text-gray-400">•</Typography>
                            <Typography as="span" className="text-xs text-gray-500 font-medium">
                                Uploaded on {new Date(document.created_at).toLocaleDateString("en-GB", {
                                    day: "2-digit", month: "short", year: "numeric",
                                })}
                            </Typography>
                        </div>
                    </div>
                </div>
            </div>

            <DocumentViewer 
                files={document.document_files || []} 
                documentName={document.name} 
            />
        </main>
    )
}
