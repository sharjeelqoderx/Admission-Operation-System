"use client"

import { useState, useRef, useCallback } from "react"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import {
    MAX_FILE_SIZE_MB,
    getFileSizeLimitError,
    isFileWithinSizeLimit,
} from "@/lib/constants/file-upload"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloudIcon, FileIcon, XIcon, GripVerticalIcon } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────
export interface UploadedFile {
    id: string
    file: File
    preview?: string
}

interface DraggableFileProps {
    item: UploadedFile
    onRemove: (id: string) => void
}

interface FileDropZoneProps {
    onFilesAdded: (files: File[]) => void
    accept?: string
    multiple?: boolean
}

interface DragDropCardProps {
    title?: string
    description?: string
    accept?: string
    multiple?: boolean
    onChange?: (files: UploadedFile[]) => void
    className?: string
    existingFile?: { url: string; name?: string } | null
}

function isImageUrl(url: string) {
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)
}

function fileNameFromUrl(url: string, fallback = "Uploaded file") {
    try {
        const segment = url.split("/").pop()?.split("?")[0]
        return segment ? decodeURIComponent(segment) : fallback
    } catch {
        return fallback
    }
}

function ExistingRemoteFile({ url, name }: { url: string; name: string }) {
    const isImage = isImageUrl(url)

    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-brand-input px-3 py-2.5 text-sm">
            {isImage ? (
                <img src={url} alt={name} className="size-8 rounded object-cover shrink-0" />
            ) : (
                <FileIcon className="size-8 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{name}</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline underline-offset-2"
                >
                    View file
                </a>
            </div>
        </div>
    )
}

// ─── Draggable File Item ──────────────────────────────────────
function DraggableFile({ item, onRemove }: DraggableFileProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })

    const style = transform
        ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
        : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-brand-input px-3 py-2.5 text-sm transition-shadow",
                isDragging && "opacity-40"
            )}
        >
            <button
                {...listeners}
                {...attributes}
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            >
                <GripVerticalIcon className="size-4" />
            </button>

            {item.preview ? (
                <img src={item.preview} alt={item.file.name} className="size-8 rounded object-cover shrink-0" />
            ) : (
                <FileIcon className="size-8 shrink-0 text-muted-foreground" />
            )}

            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{(item.file.size / 1024).toFixed(1)} KB</p>
            </div>

            <button
                onClick={() => onRemove(item.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
                <XIcon className="size-4" />
            </button>
        </div>
    )
}

// ─── Drop Zone ────────────────────────────────────────────────
function FileDropZone({ onFilesAdded, accept, multiple }: FileDropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const { setNodeRef, isOver } = useDroppable({ id: "drop-zone" })

    const validate = (files: File[]): File[] => {
        const valid = files.filter(f => {
            if (!isFileWithinSizeLimit(f)) {
                setError(getFileSizeLimitError(f.name))
                return false
            }
            return true
        })
        if (valid.length === files.length) setError("")
        return valid
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        const valid = validate(files)
        if (valid.length) onFilesAdded(multiple ? valid : [valid[0]])
    }, [onFilesAdded, multiple])

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        const valid = validate(files)
        if (valid.length) onFilesAdded(multiple ? valid : [valid[0]])
        e.target.value = ""
    }

    return (
        <div
            ref={setNodeRef}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
                "flex flex-col items-center border-border bg-muted/30 justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
                isDragOver || isOver
                    ? "border-primary bg-brand-input/5"
                    : "border-border hover:border-primary/50 hover:bg-brand-input/30"
            )}
        >
            <div className={cn(
                "flex size-12 items-center justify-center rounded-full transition-colors",
                isDragOver || isOver ? "bg-brand-input/10" : "bg-muted"
            )}>
                <UploadCloudIcon className={cn("size-6", isDragOver || isOver ? "text-primary" : "text-muted-foreground")} />
            </div>

            <div>
                <p className="text-sm font-medium">
                    Drag & drop files here, or{" "}
                    <span className="text-primary underline underline-offset-2">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {accept ? `Accepted: ${accept}` : "Any file type"} · Max {MAX_FILE_SIZE_MB}MB
                    {multiple ? " · Multiple files allowed" : ""}
                </p>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleInput}
            />
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────
export function DragDropCard({
    title = "Upload Files",
    description = "Drag and drop or click to upload",
    accept,
    multiple = true,
    onChange,
    className,
    existingFile,
}: DragDropCardProps) {
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
    const showExistingFile = files.length === 0 && !!existingFile?.url

    const addFiles = (newFiles: File[]) => {
        const items: UploadedFile[] = newFiles.map(file => ({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }))
        const updated = multiple ? [...files, ...items] : items
        setFiles(updated)
        onChange?.(updated)
    }

    const removeFile = (id: string) => {
        const updated = files.filter(f => f.id !== id)
        setFiles(updated)
        onChange?.(updated)
    }

    const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = e
        if (!over || active.id === over.id) return
        const oldIndex = files.findIndex(f => f.id === active.id)
        const newIndex = files.findIndex(f => f.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        const reordered = [...files]
        const [moved] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, moved)
        setFiles(reordered)
        onChange?.(reordered)
    }

    const activeFile = files.find(f => f.id === activeId)

    return (
        <Card className={cn("w-full p-0", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-0">
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <FileDropZone
                        onFilesAdded={addFiles}
                        accept={accept}
                        multiple={multiple}
                    />

                    {showExistingFile && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                1 file uploaded
                            </p>
                            <ExistingRemoteFile
                                url={existingFile.url}
                                name={existingFile.name ?? fileNameFromUrl(existingFile.url)}
                            />
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {files.length} file{files.length > 1 ? "s" : ""} selected
                            </p>
                            <div className="space-y-2">
                                {files.map(item => (
                                    <DraggableFile key={item.id} item={item} onRemove={removeFile} />
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-0"
                                onClick={() => { setFiles([]); onChange?.([]) }}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}

                    <DragOverlay>
                        {activeFile && (
                            <div className="flex items-center gap-3 rounded-lg border border-primary bg-background px-3 py-2.5 text-sm shadow-lg opacity-95">
                                <GripVerticalIcon className="size-4 text-muted-foreground" />
                                {activeFile.preview
                                    ? <img src={activeFile.preview} className="size-8 rounded object-cover" />
                                    : <FileIcon className="size-8 text-muted-foreground" />
                                }
                                <span className="truncate font-medium">{activeFile.file.name}</span>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </CardContent>
        </Card>
    )
}
