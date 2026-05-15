"use client"

import { useRef, useState, useEffect } from "react"
import { X, ImageIcon, FileText, FileSpreadsheet, File } from "lucide-react"
import { cn } from "@/lib/utils"
import { Typography } from "./Typography"


type Props = {
    value?: File | string | null
    onChange?: (file: File | null) => void
    message?: string
    className?: string
    accept?: string
    emptyIcon?: React.ReactNode
    disabled?: boolean
}

function getFileIcon(file: File) {
    if (file.type.startsWith("image/")) return null // will show preview
    if (file.type === "application/pdf" || file.name.endsWith(".pdf"))
        return <FileText size={32} strokeWidth={1.5} className="text-red-500" />
    if (
        file.type.includes("spreadsheet") ||
        file.type.includes("excel") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
    )
        return <FileSpreadsheet size={32} strokeWidth={1.5} className="text-green-600" />
    return <File size={32} strokeWidth={1.5} className="text-gray-500" />
}

export function ImageUploadCard({
    value,
    onChange,
    message = "Click to upload or drag and drop",
    className,
    accept = "image/*",
    emptyIcon,
    disabled = false,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    useEffect(() => {
        if (!value) {
            setPreview(null)
            setSelectedFile(null)
            return
        }
        if (typeof value === "string") {
            setPreview(value)
            setSelectedFile(null)
            return
        }
        setSelectedFile(value)
        if (value.type.startsWith("image/")) {
            const url = URL.createObjectURL(value)
            setPreview(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setPreview(null)
        }
    }, [value])

    const handleFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large (Max 10MB)")
            return
        }
        onChange?.(file)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setPreview(null)
        setSelectedFile(null)
        onChange?.(null)
    }

    const hasFile = preview || selectedFile

    return (
        <div
            onClick={(e) => { 
                if (disabled) return;
                e.stopPropagation(); 
                inputRef.current?.click();
            }}
            onDragOver={(e) => { if (!disabled) e.preventDefault() }}
            onDrop={(e) => {
                if (disabled) return;
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file)
            }}
            className={cn(
                "relative group flex flex-col items-center justify-center w-full min-h-[120px] max-h-[200px]",
                "rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
                "bg-[#EDEDED] border-none hover:bg-gray-200",
                disabled && "cursor-not-allowed hover:bg-[#EDEDED] opacity-60",
                className
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                }}
            />

            {hasFile ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    {preview ? (
                        <img src={preview} alt="Preview" className="size-full object-contain" />
                    ) : (

                        selectedFile && (
                            <div className="flex flex-col items-center justify-center gap-2 p-4">
                                {getFileIcon(selectedFile)}
                                <Typography font="small" className="text-gray-600 text-center max-w-[90%] truncate">
                                    {selectedFile.name}
                                </Typography>
                                <Typography font="small" className="text-gray-400">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </Typography>
                            </div>

                        )
                    )}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full shadow-lg backdrop-blur-md hover:bg-red-500 transition-all z-20"
                        >
                            <X size={14} />
                        </button>
                    )}
                    {preview && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <ImageIcon className="text-white size-8 opacity-50" />
                        </div>
                    )}
                </div>
            ) : (

                <div className="flex flex-col items-center gap-2 p-4">
                    <div className="text-gray-400 group-hover:scale-110 transition-transform">
                        {emptyIcon ?? <ImageIcon size={32} strokeWidth={1.5} />}
                    </div>
                    <Typography font="small" className="text-gray-500 text-center">
                        <span className="text-[#4285f4] font-bold">Click here</span> to upload {message.toLowerCase()}
                    </Typography>
                </div>

            )}
        </div>
    )
}

export default ImageUploadCard