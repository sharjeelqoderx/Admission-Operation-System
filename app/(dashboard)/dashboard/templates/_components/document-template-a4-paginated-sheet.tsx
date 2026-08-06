"use client"

import {
    memo,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import {
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    A4_PAGE_PADDING_X_MM,
    A4_PAGE_PADDING_Y_MM,
    A4_PAGE_WIDTH_MM,
    mmToPx,
} from "@/lib/document-template/a4-document"
import {
    calculateA4BodySlotHeightPx,
    calculateA4PageCount,
    calculateA4StackHeightPx,
} from "@/lib/document-template/a4-pagination"
import { DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES } from "@/lib/document-template/header-footer"
import { cn } from "@/lib/utils"

type DocumentTemplateA4PaginatedSheetProps = {
    hasHeader: boolean
    hasFooter: boolean
    headerHtml: string
    footerHtml: string
    watermark?: DocumentTemplateWatermark | null
    children: ReactNode
    className?: string
}

function measureElementHeight(element: HTMLElement | null): number {
    if (!element) {
        return 0
    }

    return element.getBoundingClientRect().height
}

export const DocumentTemplateA4PaginatedSheet = memo(function DocumentTemplateA4PaginatedSheet({
    hasHeader,
    hasFooter,
    headerHtml,
    footerHtml,
    watermark,
    children,
    className,
}: DocumentTemplateA4PaginatedSheetProps) {
    const clipPathId = useId().replace(/:/g, "")
    const editorRef = useRef<HTMLDivElement>(null)
    const headerMeasureRef = useRef<HTMLDivElement>(null)
    const footerMeasureRef = useRef<HTMLDivElement>(null)

    const [headerHeightPx, setHeaderHeightPx] = useState(0)
    const [footerHeightPx, setFooterHeightPx] = useState(0)
    const [editorHeightPx, setEditorHeightPx] = useState(0)

    const horizontalPaddingPx = mmToPx(A4_PAGE_PADDING_X_MM)
    const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM)
    const pageWidthPx = mmToPx(A4_PAGE_WIDTH_MM)
    const bodyWidthPx = pageWidthPx - horizontalPaddingPx * 2

    const bodySlotHeightPx = useMemo(
        () =>
            calculateA4BodySlotHeightPx({
                hasHeader,
                hasFooter,
                headerHeightPx,
                footerHeightPx,
                verticalPaddingPx,
            }),
        [footerHeightPx, hasFooter, hasHeader, headerHeightPx, verticalPaddingPx]
    )

    const pageCount = calculateA4PageCount(editorHeightPx, bodySlotHeightPx)
    const stackHeightPx = calculateA4StackHeightPx(pageCount)

    const pageStridePx = A4_PAGE_HEIGHT_PX + A4_PAGE_STACK_GAP_PX
    const editorTopPx =
        verticalPaddingPx + (hasHeader ? headerHeightPx : 0)

    useLayoutEffect(() => {
        const measure = () => {
            setHeaderHeightPx(
                hasHeader ? measureElementHeight(headerMeasureRef.current) : 0
            )
            setFooterHeightPx(
                hasFooter ? measureElementHeight(footerMeasureRef.current) : 0
            )

            const proseMirror = editorRef.current?.querySelector(".ProseMirror")
            const measuredEditorHeight = proseMirror
                ? proseMirror.scrollHeight
                : measureElementHeight(editorRef.current)

            setEditorHeightPx(Math.max(measuredEditorHeight, bodySlotHeightPx))
        }

        measure()

        const targets: HTMLElement[] = []
        if (headerMeasureRef.current) targets.push(headerMeasureRef.current)
        if (footerMeasureRef.current) targets.push(footerMeasureRef.current)
        if (editorRef.current) targets.push(editorRef.current)

        const proseMirror = editorRef.current?.querySelector(".ProseMirror")
        if (proseMirror instanceof HTMLElement) {
            targets.push(proseMirror)
        }

        const observer = new ResizeObserver(measure)
        targets.forEach((target) => observer.observe(target))

        return () => observer.disconnect()
    }, [
        bodySlotHeightPx,
        footerHtml,
        hasFooter,
        hasHeader,
        headerHtml,
        children,
    ])

    return (
        <div className={cn(A4_DOCUMENT_SHEET_WRAPPER_CLASS, className)}>
            <div
                className="relative mx-auto"
                style={{
                    width: pageWidthPx,
                    maxWidth: "100%",
                    height: stackHeightPx,
                }}
            >
                <svg width="0" height="0" aria-hidden className="absolute">
                    <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
                        {Array.from({ length: pageCount }).map((_, pageIndex) => (
                            <rect
                                key={`clip-${pageIndex}`}
                                x={horizontalPaddingPx}
                                y={
                                    pageIndex * pageStridePx +
                                    verticalPaddingPx +
                                    (hasHeader ? headerHeightPx : 0)
                                }
                                width={bodyWidthPx}
                                height={bodySlotHeightPx}
                            />
                        ))}
                    </clipPath>
                </svg>

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

                {Array.from({ length: pageCount }).map((_, pageIndex) => (
                    <div
                        key={`a4-page-${pageIndex}`}
                        className={cn(
                            A4_DOCUMENT_PAGE_CLASS,
                            "absolute left-0 flex flex-col overflow-hidden bg-white",
                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                        )}
                        style={{
                            top: pageIndex * pageStridePx,
                            height: A4_PAGE_HEIGHT_PX,
                        }}
                    >
                        <DocumentPageWatermark watermark={watermark} />
                        {hasHeader ? (
                            <div
                                className="relative z-10 shrink-0 bg-white"
                                dangerouslySetInnerHTML={{ __html: headerHtml }}
                            />
                        ) : null}
                        <div
                            className="relative z-0 min-h-0 flex-1"
                            style={{ height: bodySlotHeightPx, maxHeight: bodySlotHeightPx }}
                            aria-hidden
                        />
                        {hasFooter ? (
                            <div
                                className="relative z-10 mt-auto shrink-0 bg-white"
                                dangerouslySetInnerHTML={{ __html: footerHtml }}
                            />
                        ) : null}
                    </div>
                ))}

                <div
                    className="absolute left-0 top-0 z-20"
                    style={{
                        width: pageWidthPx,
                        height: stackHeightPx,
                        clipPath: `url(#${clipPathId})`,
                    }}
                >
                    <div
                        ref={editorRef}
                        style={{
                            paddingLeft: horizontalPaddingPx,
                            paddingRight: horizontalPaddingPx,
                            paddingTop: editorTopPx,
                            minHeight: bodySlotHeightPx,
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
})
