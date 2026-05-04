"use client"

import { useRef, useState, useEffect } from "react"
import { UploadCloud, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    value?: File | string | null
    onChange?: (file: File | null) => void
    message?: string
    className?: string
}

export function ImageUploadCard({
    value,
    onChange,
    message = "Click to upload or drag and drop",
    className,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
        if (!value) {
            setPreview(null)
            return
        }
        if (typeof value === "string") {
            setPreview(value)
            return
        }
        const url = URL.createObjectURL(value)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [value])

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large (Max 5MB)")
            return
        }
        onChange?.(file)
    }

    return (
        <div
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file)
            }}
            className={cn(
                "relative group flex flex-col items-center justify-center w-full min-h-[120px]",
                "rounded-xl transition-all duration-200 cursor-pointer",
                "bg-[#EDEDED] border-none hover:bg-gray-200",
                className
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                }}
            />

            {preview ? (
                <div className="relative w-full h-full p-2 flex flex-col items-center justify-center">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-h-24 rounded-lg object-contain"
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange?.(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-sm hover:scale-110 transition-transform"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 p-4">
                    <div className="text-gray-400 group-hover:scale-110 transition-transform">
                        <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-[11px] font-medium text-gray-500 text-center">
                        <span className="text-[#4285f4] font-bold">Click here</span> to upload {message.toLowerCase()}
                    </p>
                </div>
            )}
        </div>
    )
}

export default ImageUploadCard