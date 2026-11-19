"use client"

import { memo } from "react"
import { useEditorState, type Editor } from "@tiptap/react"
import { Languages } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TEMPLATE_LOCALE_OPTIONS, type TemplateLocale } from "@/lib/document-template/locale"

export type PageLanguageAtCursor = {
    /** Language of the page the cursor is on. */
    locale: TemplateLocale
    /** Position of the page break that starts this page; null on the first page. */
    breakPos: number | null
}

/** Language of the page under the cursor, from the page breaks above it. */
export function getPageLanguageAtCursor(
    editor: Editor,
    templateLocale: TemplateLocale
): PageLanguageAtCursor {
    const cursor = editor.state.selection.from
    let locale = templateLocale
    let breakPos: number | null = null

    editor.state.doc.forEach((node, offset) => {
        if (offset >= cursor) return
        if (node.type.name !== "documentPageBreak" || node.attrs.auto) return
        breakPos = offset
        if (node.attrs.lang === "de" || node.attrs.lang === "en") locale = node.attrs.lang
    })

    return { locale, breakPos }
}

/**
 * Sets the language of the page under the cursor (the page break above it carries the
 * language). Header and Sign & Stamp text, variable dates, titles and greetings of that
 * page then follow it.
 */
export function setPageLanguageAtCursor(
    editor: Editor,
    templateLocale: TemplateLocale,
    next: TemplateLocale
): boolean {
    const { breakPos } = getPageLanguageAtCursor(editor, templateLocale)
    if (breakPos === null) return false
    const node = editor.state.doc.nodeAt(breakPos)
    if (!node) return false
    editor.view.dispatch(
        editor.state.tr.setNodeMarkup(breakPos, undefined, { ...node.attrs, lang: next })
    )
    editor.view.focus()
    return true
}

export const DocumentEditorPageLanguage = memo(function DocumentEditorPageLanguage({
    editor,
    templateLocale,
}: {
    editor: Editor
    templateLocale: TemplateLocale
}) {
    // The toolbar does not re-render on selection-only changes, so subscribe explicitly.
    const { locale, breakPos } = useEditorState({
        editor,
        selector: ({ editor: current }) => getPageLanguageAtCursor(current, templateLocale),
    })
    const isFirstPage = breakPos === null

    return (
        <div
            className="flex items-center gap-1"
            title={
                isFirstPage
                    ? "The first page uses the Letter language. Insert a page break to set a different language for the next page."
                    : "Language of the page the cursor is on — header, signature, dates and greetings follow it."
            }
        >
            <Languages className="size-3.5 text-muted-foreground" aria-hidden />
            <Select
                value={locale}
                disabled={isFirstPage}
                onValueChange={(value) =>
                    setPageLanguageAtCursor(editor, templateLocale, value as TemplateLocale)
                }
            >
                <SelectTrigger className="h-7 w-[132px] px-2 text-xs" aria-label="Page language">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-40">
                    {TEMPLATE_LOCALE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {isFirstPage ? `Page 1 · ${option.label}` : `Page: ${option.label}`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
})
