"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, FileText, FileSpreadsheet, File, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { cn } from "@/lib/utils"
import { BluryCard } from "@/components/shared/blury-card"

type DocumentFile = {
    id: string
    file_url: string
    type: string
}

type Props = {
    files: DocumentFile[]
    documentName: string
}




export function DocumentViewer({ files, documentName }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)

    // Sort files to ensure FRONT is always first
    const sortedFiles = [...files].sort((a, b) => {
        if (a.type === "FRONT") return -1
        if (b.type === "FRONT") return 1
        return 0
    })

    const handleNext = useCallback(() => {
        if (currentIndex < sortedFiles.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }, [currentIndex, sortedFiles.length])

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }, [currentIndex])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext()
            if (e.key === "ArrowLeft") handlePrev()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleNext, handlePrev])

    if (!sortedFiles.length) return null

    const currentFile = sortedFiles[currentIndex]
    const isImage = currentFile.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || currentFile.file_url.includes("image")
    const isMulti = sortedFiles.length > 1

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[600px] w-full gap-6">
            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl"
                childClass="flex! items-center justify-between py-0!"
            >
                <div
                    className="w-full h-full flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {sortedFiles.map((file, i) => {
                        const extension = file.file_url.split('?')[0].split('.').pop()?.toLowerCase() || "";

                        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
                        const isPdf = extension === "pdf";
                        const isExcel = ["xls", "xlsx", "csv"].includes(extension);
                        const isWord = ["doc", "docx"].includes(extension);

                        return (
                            <div key={file.id} className="min-w-full h-full flex items-center justify-center p-4 lg:p-8">
                                {isImage ? (
                                    <img
                                        src={file.file_url}
                                        alt={`${documentName} - ${file.type}`}
                                        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className={cn(
                                            "size-24 rounded-3xl flex items-center justify-center shadow-md bg-white",
                                            isPdf && "border-red-100",
                                            isExcel && "border-green-100",
                                            isWord && "border-blue-100"
                                        )}>
                                            {isPdf && <FileText className="size-12 text-red-500" />}
                                            {isExcel && <FileSpreadsheet className="size-12 text-green-600" />}
                                            {isWord && <FileText className="size-12 text-blue-600" />}
                                            {!isPdf && !isExcel && !isWord && <File className="size-12 text-gray-400" />}
                                        </div>
                                        <div className="text-center space-y-2">
                                            <Typography as="p" font="text-xl" className="font-extrabold text-gray-900">
                                                {isPdf ? "PDF Document" : isExcel ? "Excel Spreadsheet" : isWord ? "Word Document" : "Document File"}
                                            </Typography>
                                            <Typography as="p" className="text-sm text-gray-500 max-w-[300px]">
                                                {isPdf ? "Preview this PDF by opening it in a new tab." : "This file type can be downloaded for viewing."}
                                            </Typography>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button asChild variant="outline" className="rounded-xl px-8 h-12 font-bold border-gray-200">
                                                <a href={file.file_url} target="_blank" rel="noreferrer">
                                                    Open in New Tab
                                                </a>
                                            </Button>
                                            <Button asChild className="bg-brand-secondary hover:bg-brand-secondary/90 rounded-xl px-8 h-12 font-bold">
                                                <a href={file.file_url} download={documentName}>
                                                    Download
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                </div>

                {isMulti && (
                    <>
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className={cn(
                                "absolute left-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/80 backdrop-blur-md shadow-xl flex items-center justify-center text-gray-800 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 scale-90 hover:scale-100 hover:bg-white",
                                currentIndex === 0 && "pointer-events-none"
                            )}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === sortedFiles.length - 1}
                            className={cn(
                                "absolute right-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/80 backdrop-blur-md shadow-xl flex items-center justify-center text-gray-800 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 scale-90 hover:scale-100 hover:bg-white",
                                currentIndex === sortedFiles.length - 1 && "pointer-events-none"
                            )}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {isMulti && (
                    <div className="absolute top-6 left-6 px-4 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-white/10">
                        <Typography as="span" font="small" className="tracking-[0.2em] p-0 m-0 text-white uppercase">
                            {currentFile.type} SIDE
                        </Typography>
                    </div>
                )}
            </BluryCard>

            <BluryCard
                isCentered={false}
                blurAmount="backdrop-blur-lg"
                blendColorClass="bg-white/10"
                className="rounded-xl"
                childClass="flex! items-center justify-between py-0!"
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="h-10 px-3 rounded-xl gap-2 font-bold"
                        >
                            <ChevronLeft size={18} />
                            Prev
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentIndex === sortedFiles.length - 1}
                            className="h-10 px-3 rounded-xl gap-2 font-bold"
                        >
                            Next
                            <ChevronRight size={18} />
                        </Button>
                    </div>

                    {/* ── Indicators ── */}
                    {isMulti && (
                        <div className="flex items-center gap-3 px-4 border-l border-gray-100">
                            {sortedFiles.map((file, i) => (
                                <button
                                    key={file.id}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-300",
                                        currentIndex === i ? "w-8 bg-brand-byzantine" : "w-2 bg-gray-200 hover:bg-gray-300"
                                    )}
                                    title={file.type}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Typography as="span" className="text-xs font-bold text-gray-400 mr-2">
                        {currentIndex + 1} / {sortedFiles.length}
                    </Typography>
                    <Button asChild variant="outline" size="sm" className="h-10 rounded-xl gap-2 border-gray-200 border">
                        <a href={currentFile.file_url} target="_blank" rel="noreferrer">
                            <ExternalLink size={16} />
                            <span className="hidden sm:inline">Open Original</span>
                        </a>
                    </Button>
                </div>
            </BluryCard>
        </div >
    )
}
