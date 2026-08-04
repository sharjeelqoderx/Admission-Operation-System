"use client"

import { memo, useCallback, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { DocumentTemplateAsset } from "@/types/schemas/document-template"
import { cn } from "@/lib/utils"

export const DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY = ["document-template-assets"] as const

export type DocumentTemplateAssetIntent = "header" | "header-logo" | "inline" | "logo"

type Props = {
    open: boolean
    intent: DocumentTemplateAssetIntent | null
    onOpenChange: (open: boolean) => void
    onSelect: (asset: DocumentTemplateAsset, intent: DocumentTemplateAssetIntent) => void
}

async function fetchDocumentTemplateAssets(): Promise<DocumentTemplateAsset[]> {
    const res = await fetch("/api/document-template/assets")
    const json = await res.json()

    if (!res.ok || !json.success) {
        throw new Error(json?.error ?? "Failed to load template assets")
    }

    return json.data as DocumentTemplateAsset[]
}

async function uploadDocumentTemplateAsset(file: File): Promise<DocumentTemplateAsset> {
    const formData = new FormData()
    formData.set("file", file)

    const res = await fetch("/api/document-template/assets", {
        method: "POST",
        body: formData,
    })
    const json = await res.json()

    if (!res.ok || !json.success) {
        throw new Error(json?.error ?? "Failed to upload image")
    }

    return json.data as DocumentTemplateAsset
}

function getIntentLabel(intent: DocumentTemplateAssetIntent | null): string {
    switch (intent) {
        case "header":
            return "header image"
        case "header-logo":
            return "document header logo"
        case "logo":
            return "logo"
        default:
            return "image"
    }
}

export const DocumentTemplateAssetsModal = memo(function DocumentTemplateAssetsModal({
    open,
    intent,
    onOpenChange,
    onSelect,
}: Props) {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const assetsQuery = useQuery({
        queryKey: DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY,
        queryFn: fetchDocumentTemplateAssets,
        enabled: open,
    })

    const uploadMutation = useMutation({
        mutationFn: uploadDocumentTemplateAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY })
            toast.success("Image added to template assets.")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload image")
        },
    })

    const handleBrowse = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFileSelected = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return

            await uploadMutation.mutateAsync(file)
        },
        [uploadMutation]
    )

    const handleAssetClick = useCallback(
        (asset: DocumentTemplateAsset) => {
            if (!intent) return
            onSelect(asset, intent)
            onOpenChange(false)
        },
        [intent, onOpenChange, onSelect]
    )

    const assets = assetsQuery.data ?? []
    const isUploading = uploadMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Template image assets</DialogTitle>
                    <DialogDescription>
                        Choose an existing image or add a new one to reuse across templates. Selected
                        assets are stored in the shared document-template-assets folder.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Typography as="p" className="text-sm text-muted-foreground">
                            {intent
                                ? `Select a ${getIntentLabel(intent)} from your library.`
                                : "Select an image from your library."}
                        </Typography>
                        <Button
                            type="button"
                            className="gap-2"
                            disabled={isUploading}
                            onClick={handleBrowse}
                        >
                            {isUploading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ImagePlus className="size-4" />
                            )}
                            Add image
                        </Button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileSelected}
                    />

                    {assetsQuery.isLoading ? (
                        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : null}

                    {assetsQuery.isError ? (
                        <ErrorView
                            message={
                                assetsQuery.error instanceof Error
                                    ? assetsQuery.error.message
                                    : "Failed to load template assets"
                            }
                        />
                    ) : null}

                    {!assetsQuery.isLoading && !assetsQuery.isError && assets.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-10 text-center">
                            <Typography as="p" className="text-sm font-medium text-gray-700">
                                No template images yet
                            </Typography>
                            <Typography as="p" className="mt-1 text-sm text-muted-foreground">
                                Click Add image to upload once and reuse it in any template.
                            </Typography>
                        </div>
                    ) : null}

                    {assets.length > 0 ? (
                        <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                            {assets.map((asset) => (
                                <button
                                    key={asset.path}
                                    type="button"
                                    className={cn(
                                        "group overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition-colors",
                                        "hover:border-brand-secondary hover:ring-2 hover:ring-brand-secondary/20"
                                    )}
                                    onClick={() => handleAssetClick(asset)}
                                >
                                    <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={asset.url}
                                            alt={asset.name}
                                            className="size-full object-contain p-2 transition-transform group-hover:scale-[1.02]"
                                        />
                                    </div>
                                    <div className="border-t border-gray-100 px-3 py-2">
                                        <Typography
                                            as="p"
                                            className="truncate text-xs font-medium text-gray-700"
                                            title={asset.name}
                                        >
                                            {asset.name}
                                        </Typography>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
})
