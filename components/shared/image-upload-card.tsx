"use client"

import { useRef, useState, useEffect } from "react"
import { UploadCloud, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    value?: File | null
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
                "relative group flex flex-col items-center justify-center w-full min-h-[160px]",
                "border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
                "bg-secondary/10 border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/20",
                preview ? "border-solid border-muted-foreground/10" : "p-6",
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
                <div className="relative w-full h-full p-4 flex flex-col items-center gap-4">
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-auto h-28 rounded-xl object-cover"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange?.(null)
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon size={12} /> Change Image
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-background rounded-full shadow-sm border border-border group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-1 text-center">
                        <p className="text-sm font-medium text-foreground">{message}</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImageUploadCard