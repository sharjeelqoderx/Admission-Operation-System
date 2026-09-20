"use client"

import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react"
import type { Editor } from "@tiptap/react"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import {
    A4_DOCUMENT_GROWING_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    A4_PAGE_PADDING_X_MM,
    A4_PAGE_PADDING_Y_MM,
    A4_PAGE_WIDTH_MM,
    DOCUMENT_PAGE_BREAK_CLASS,
    mmToPx,
} from "@/lib/document-template/a4-document"
import { DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES } from "@/lib/document-template/header-footer"
import { cn } from "@/lib/utils"

/** Rendered height of the page-break badge; the stretched marker never gets smaller. */
const PAGE_BREAK_BADGE_HEIGHT_PX = 26

type DocumentTemplateA4PaginatedSheetProps = {
    editor: Editor | null
    hasHeader: boolean
    hasFooter: boolean
    headerHtml: string
    footerHtml: string
    watermark?: DocumentTemplateWatermark | null
    children: ReactNode
    className?: string
}

type SheetGeometry = {
    top: number
    height: number
}

type SheetLayout = {
    sheets: SheetGeometry[]
    stackHeightPx: number
    editorTopPx: number
    editorBottomPx: number
}

function measureElementHeight(element: HTMLElement | null): number {
    if (!element) {
        return 0
    }

    return element.getBoundingClientRect().height
}

function layoutSignature(layout: SheetLayout): string {
    const rounded = (value: number) => Math.round(value * 2) / 2
    return [
        layout.sheets.map((sheet) => `${rounded(sheet.top)}:${rounded(sheet.height)}`).join("|"),
        rounded(layout.stackHeightPx),
        rounded(layout.editorTopPx),
        rounded(layout.editorBottomPx),
    ].join("~")
}

export const DocumentTemplateA4PaginatedSheet = memo(function DocumentTemplateA4PaginatedSheet({
    editor,
    hasHeader,
    hasFooter,
    headerHtml,
    footerHtml,
    watermark,
    children,
    className,
}: DocumentTemplateA4PaginatedSheetProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const headerMeasureRef = useRef<HTMLDivElement>(null)
    const footerMeasureRef = useRef<HTMLDivElement>(null)
    const lastSignatureRef = useRef<string | null>(null)

    const horizontalPaddingPx = mmToPx(A4_PAGE_PADDING_X_MM)
    const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM)
    const pageWidthPx = mmToPx(A4_PAGE_WIDTH_MM)
    const bodyWidthPx = pageWidthPx - horizontalPaddingPx * 2

    const [layout, setLayout] = useState<SheetLayout>(() => ({
        sheets: [{ top: 0, height: A4_PAGE_HEIGHT_PX }],
        stackHeightPx: A4_PAGE_HEIGHT_PX,
        editorTopPx: verticalPaddingPx,
        editorBottomPx: verticalPaddingPx,
    }))

    /**
     * Lays the continuous editor flow out onto A4 sheets.
     *
     * Manual page-break nodes are stretched so the content after them starts
     * at the top of the next sheet's editable area — the flow itself creates
     * the page spacing, so no content is ever clipped or hidden. Sheets grow
     * beyond A4 height when a page's content overflows (marked with an
     * indicator) instead of corrupting the following pages.
     */
    const runLayout = useCallback(() => {
        const headerHeightPx = hasHeader ? measureElementHeight(headerMeasureRef.current) : 0
        const footerHeightPx = hasFooter ? measureElementHeight(footerMeasureRef.current) : 0

        const editorTopPx = verticalPaddingPx + (hasHeader ? headerHeightPx : 0)
        const editorBottomPx = verticalPaddingPx + (hasFooter ? footerHeightPx : 0)

        const proseMirror = editorRef.current?.querySelector<HTMLElement>(".ProseMirror") ?? null

        const sheets: SheetGeometry[] = []
        let stackHeightPx = A4_PAGE_HEIGHT_PX

        if (proseMirror) {
            const proseMirrorTop = proseMirror.getBoundingClientRect().top
            const breakElements = Array.from(
                proseMirror.querySelectorAll<HTMLElement>(`.${DOCUMENT_PAGE_BREAK_CLASS}`)
            )

            let sheetTop = 0
            let contentStart = 0

            breakElements.forEach((breakElement, index) => {
                const breakTop = breakElement.getBoundingClientRect().top - proseMirrorTop

                // The sheet this break terminates — its height covers the
                // content above the break plus header, footer and padding.
                const sheetHeight = Math.max(
                    A4_PAGE_HEIGHT_PX,
                    editorTopPx + Math.max(breakTop - contentStart, 0) + editorBottomPx
                )
                sheets.push({ top: sheetTop, height: sheetHeight })

                // Stretch the break marker so the content after it starts at
                // the top of the next sheet's editable area.
                const nextSheetTop = sheetTop + sheetHeight + A4_PAGE_STACK_GAP_PX
                const fillHeight = Math.max(PAGE_BREAK_BADGE_HEIGHT_PX, nextSheetTop - breakTop)
                breakElement.style.height = `${fillHeight}px`

                // Label the badge with explicit page numbers so the actions
                // are unambiguous — "Delete page N" always refers to the page
                // that starts right after this break.
                const totalPages = breakElements.length + 1
                const badgeText = breakElement.querySelector<HTMLElement>(
                    "[data-page-break-badge-text]"
                )
                if (badgeText) {
                    badgeText.textContent = `— Page break · end of page ${index + 1} of ${totalPages} —`
                }
                const deleteLabel = breakElement.querySelector<HTMLElement>(
                    "[data-page-break-action-label]"
                )
                if (deleteLabel) {
                    deleteLabel.textContent = `Delete page ${index + 2}`
                    deleteLabel.title = `Deletes page ${index + 2} — the content after this break (Ctrl+Z to undo)`
                }

                contentStart = breakTop + fillHeight
                sheetTop = nextSheetTop
            })

            // The final sheet holds whatever follows the last page break.
            const contentEnd = proseMirror.scrollHeight
            const lastSheetHeight = Math.max(
                A4_PAGE_HEIGHT_PX,
                editorTopPx + Math.max(contentEnd - contentStart, 0) + editorBottomPx
            )
            sheets.push({ top: sheetTop, height: lastSheetHeight })
            stackHeightPx = sheetTop + lastSheetHeight
        }

        const nextLayout: SheetLayout = {
            sheets,
            stackHeightPx,
            editorTopPx,
            editorBottomPx,
        }

        const signature = layoutSignature(nextLayout)
        if (signature !== lastSignatureRef.current) {
            lastSignatureRef.current = signature
            setLayout(nextLayout)
        }
    }, [hasFooter, hasHeader, verticalPaddingPx])

    useLayoutEffect(() => {
        // The ResizeObserver fires an initial callback for every observed
        // element, which triggers the first layout pass (and any later pass
        // whenever the editor content, header or footer resizes).
        const targets: HTMLElement[] = []
        if (headerMeasureRef.current) targets.push(headerMeasureRef.current)
        if (footerMeasureRef.current) targets.push(footerMeasureRef.current)
        if (editorRef.current) targets.push(editorRef.current)

        const observer = new ResizeObserver(() => runLayout())
        targets.forEach((target) => observer.observe(target))

        return () => observer.disconnect()
    }, [footerHtml, headerHtml, runLayout])

    useEffect(() => {
        if (!editor) return

        // Re-run the layout pass on every document change (adding/removing
        // page breaks or content may not change the observed element sizes).
        const handleEditorChange = () => runLayout()
        editor.on("update", handleEditorChange)
        editor.on("create", handleEditorChange)

        return () => {
            editor.off("update", handleEditorChange)
            editor.off("create", handleEditorChange)
        }
    }, [editor, runLayout])

    return (
        <div className={cn(A4_DOCUMENT_SHEET_WRAPPER_CLASS, className)}>
            <div
                className="relative mx-auto"
                style={{
                    width: pageWidthPx,
                    maxWidth: "100%",
                    height: layout.stackHeightPx,
                }}
            >
                {hasHeader ? (
                    <div
                        ref={headerMeasureRef}
                        className={cn(
                            "pointer-events-none absolute left-[-10000px] top-0 opacity-0",
                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                        )}
                        style={{ width: bodyWidthPx }}
                        dangerouslySetInnerHTML={{ __html: headerHtml }}
                        aria-hidden
                    />
                ) : null}

                {hasFooter ? (
                    <div
                        ref={footerMeasureRef}
                        className={cn(
                            "pointer-events-none absolute left-[-10000px] top-0 opacity-0",
                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                        )}
                        style={{ width: bodyWidthPx }}
                        dangerouslySetInnerHTML={{ __html: footerHtml }}
                        aria-hidden
                    />
                ) : null}

                {layout.sheets.map((sheet, index) => (
                    <div
                        key={`a4-page-${index}`}
                        className={cn(
                            A4_DOCUMENT_GROWING_PAGE_CLASS,
                            "absolute left-0 flex flex-col",
                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                        )}
                        style={{ top: sheet.top, height: sheet.height }}
                    >
                        <DocumentPageWatermark watermark={watermark} />
                        {hasHeader ? (
                            <div
                                className="relative z-10 shrink-0 bg-white"
                                dangerouslySetInnerHTML={{ __html: headerHtml }}
                            />
                        ) : null}
                        <div className="relative z-0 min-h-0 flex-1" aria-hidden />
                        {hasFooter ? (
                            <div
                                className="relative z-10 mt-auto shrink-0 bg-white"
                                dangerouslySetInnerHTML={{ __html: footerHtml }}
                            />
                        ) : null}
                        {sheet.height > A4_PAGE_HEIGHT_PX + 2 ? (
                            <div
                                className="pointer-events-none absolute left-0 right-0 z-30 border-t-2 border-dashed border-amber-400/80"
                                style={{ top: A4_PAGE_HEIGHT_PX }}
                                aria-hidden
                            >
                                <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-b-md bg-amber-400/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                                    Content exceeds one A4 page — insert a page break or shorten
                                    this page
                                </span>
                            </div>
                        ) : null}
                    </div>
                ))}

                <div
                    className="absolute left-0 top-0 z-20"
                    style={{
                        width: pageWidthPx,
                        height: layout.stackHeightPx,
                    }}
                >
                    <div
                        ref={editorRef}
                        style={{
                            paddingLeft: horizontalPaddingPx,
                            paddingRight: horizontalPaddingPx,
                            paddingTop: layout.editorTopPx,
                            minHeight: Math.max(
                                A4_PAGE_HEIGHT_PX - layout.editorBottomPx,
                                layout.stackHeightPx - layout.editorBottomPx
                            ),
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
})
