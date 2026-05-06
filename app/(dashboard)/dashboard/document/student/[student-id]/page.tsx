"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Typography } from "@/components/shared/Typography"
import { BluryCard } from "@/components/shared/blury-card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { PageLoader } from "@/components/shared/page-loader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

type PageProps = {
    params: Promise<{ "student-id": string }>
}

export default function StudentDocumentsPage({ params }: PageProps) {
    const { "student-id": studentId } = use(params)
    const router = useRouter()

    const { data: student } = useQuery({
        queryKey: ["students", studentId],
        queryFn: async () => {
            const res = await fetch(`/api/student/${studentId}`)
            const json = await res.json()
            return json.data
        }
    })

    const { data: documents, isLoading } = useQuery({
        queryKey: ["documents", "student", studentId],
        queryFn: async () => {
            const res = await fetch(`/api/document/student/${studentId}`)
            const json = await res.json()
            return json.data as any[]
        }
    })

    if (isLoading) return <PageLoader label="Loading documents..." />

    return (
        <main className="space-y-8">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/20"
                className="rounded-lg p-0"
            >

                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div>
                        <Typography font="text-xl" as="h2">
                            Documents for <span className="text-brand-byzantine">{student?.name || "Student"}</span>
                        </Typography>
                        <Typography as="p" className="text-sm text-gray-500">
                            Manage and view all documents uploaded for this student.
                        </Typography>
                    </div>
                </div>
            </BluryCard>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                childClass="p-0!"
                className="rounded-lg p-0"
            >
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="border-b border-white/20 bg-white/10">
                            <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Document Name</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Number of document</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Upload Date</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Status</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-600">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!documents?.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No documents found for this student.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => (
                                <TableRow key={doc.id} className="hover:bg-white/10 transition-colors">
                                    <TableCell className="px-6 py-5 font-bold text-gray-900">{doc.name}</TableCell>
                                    <TableCell className="px-6 py-5 text-sm font-medium text-gray-500">
                                        {doc.document_files?.length || 0} {doc.document_files?.length === 1 ? "file" : "files"}
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-sm text-gray-600">
                                        {new Date(doc.created_at).toLocaleDateString("en-GB", {
                                            day: "2-digit", month: "short", year: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <StatusBadge status={doc.document_review?.[0]?.status || "PENDING"} />
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <Link href={`/dashboard/document/student/${studentId}/${doc.id}`}>
                                            <Button variant="outline" size="sm" className="h-9 px-5">
                                                View Files
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </BluryCard>
        </main>
    )
}
