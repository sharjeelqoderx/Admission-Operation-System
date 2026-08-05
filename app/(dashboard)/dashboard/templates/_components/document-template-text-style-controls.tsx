"use client"

import { memo, useCallback, useEffect, useMemo, useReducer } from "react"
import type { Editor } from "@tiptap/react"
import { Minus, Palette, Plus } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DOCUMENT_TEMPLATE_FONT_SIZE_STEP,
    clampDocumentTemplateFontSizePx,
    formatDocumentTemplateFontSizePx,
    getDocumentTemplateFontSizeOptions,
    parseDocumentTemplateFontSizePx,
} from "@/lib/document-template/tiptap-document-font-size"
import { cn } from "@/lib/utils"

const TEXT_COLOR_PRESETS = [
    { label: "Black", value: "#111827" },
    { label: "Blue", value: "#2563eb" },
    { label: "Red", value: "#dc2626" },
    { label: "Green", value: "#059669" },
    { label: "Gray", value: "#6b7280" },
    { label: "Purple", value: "#7c3aed" },
    { label: "Orange", value: "#d97706" },
] as const

type DocumentTemplateTextStyleControlsProps = {
    editor: Editor
}

function ToolbarButton({
    onClick,
    disabled,
    label,
    children,
}: {
    onClick: () => void
    disabled?: boolean
    label: string
    children: React.ReactNode
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}

export const DocumentTemplateTextStyleControls = memo(function DocumentTemplateTextStyleControls({
    editor,
}: DocumentTemplateTextStyleControlsProps) {
    const [, forceRender] = useReducer((value: number) => value + 1, 0)

    useEffect(() => {
        const update = () => forceRender()

        editor.on("selectionUpdate", update)
        editor.on("transaction", update)

        return () => {
            editor.off("selectionUpdate", update)
            editor.off("transaction", update)
        }
    }, [editor])

    const currentFontSize = clampDocumentTemplateFontSizePx(
        parseDocumentTemplateFontSizePx(
            editor.getAttributes("textStyle").fontSize as string | undefined
        )
    )
    const currentColor = (editor.getAttributes("textStyle").color as string | undefined) ?? "#111827"
    const fontSizeOptions = useMemo(() => getDocumentTemplateFontSizeOptions(), [])

    const applyFontSize = useCallback(
        (size: number) => {
            editor.chain().focus().setFontSize(formatDocumentTemplateFontSizePx(size)).run()
        },
        [editor]
    )

    const decreaseFontSize = useCallback(() => {
        applyFontSize(currentFontSize - DOCUMENT_TEMPLATE_FONT_SIZE_STEP)
    }, [applyFontSize, currentFontSize])

    const increaseFontSize = useCallback(() => {
        applyFontSize(currentFontSize + DOCUMENT_TEMPLATE_FONT_SIZE_STEP)
    }, [applyFontSize, currentFontSize])

    const handleFontSizeSelect = useCallback(
        (value: string) => {
            applyFontSize(Number.parseInt(value, 10))
        },
        [applyFontSize]
    )

    const applyColor = useCallback(
        (color: string) => {
            editor.chain().focus().setColor(color).run()
        },
        [editor]
    )

    const resetTextStyle = useCallback(() => {
        editor.chain().focus().unsetColor().unsetFontSize().run()
    }, [editor])

    const canDecrease =
        clampDocumentTemplateFontSizePx(currentFontSize - DOCUMENT_TEMPLATE_FONT_SIZE_STEP) <
        currentFontSize
    const canIncrease =
        clampDocumentTemplateFontSizePx(currentFontSize + DOCUMENT_TEMPLATE_FONT_SIZE_STEP) >
        currentFontSize

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Typography as="span" font="small" className="mr-1 text-muted-foreground uppercase">
                Font
            </Typography>

            <ToolbarButton
                label="Decrease font size"
                disabled={!canDecrease}
                onClick={decreaseFontSize}
            >
                <Minus className="size-3.5" />
            </ToolbarButton>

            <Select value={String(currentFontSize)} onValueChange={handleFontSizeSelect}>
                <SelectTrigger size="sm" className="h-7 w-[92px] px-2 text-xs">
                    <SelectValue>{currentFontSize}px</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    {fontSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                            {size}px
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <ToolbarButton
                label="Increase font size"
                disabled={!canIncrease}
                onClick={increaseFontSize}
            >
                <Plus className="size-3.5" />
            </ToolbarButton>

            <Typography as="span" font="small" className="mx-1 text-muted-foreground uppercase">
                Color
            </Typography>

            <div className="flex flex-wrap items-center gap-1.5">
                {TEXT_COLOR_PRESETS.map((preset) => (
                    <button
                        key={preset.value}
                        type="button"
                        aria-label={`Set text color ${preset.label}`}
                        title={preset.label}
                        className={cn(
                            "size-6 rounded-full border border-border transition-transform hover:scale-105",
                            currentColor.toLowerCase() === preset.value.toLowerCase() &&
                                "ring-2 ring-brand-secondary ring-offset-1"
                        )}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => applyColor(preset.value)}
                    />
                ))}

                <label className="relative inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40">
                    <Palette className="size-3.5 text-muted-foreground" />
                    <input
                        type="color"
                        value={currentColor}
                        aria-label="Pick custom text color"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => applyColor(event.target.value)}
                    />
                </label>
            </div>

            <Button type="button" variant="ghost" size="xs" onClick={resetTextStyle}>
                Reset style
            </Button>
        </div>
    )
})
