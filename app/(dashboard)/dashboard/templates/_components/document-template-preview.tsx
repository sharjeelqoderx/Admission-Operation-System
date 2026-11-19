"use client"

import {
    memo,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { createPortal } from "react-dom"
import { Typography } from "@/components/shared/Typography"
import { useClientReady } from "@/hooks/useClientReady"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    A4_PAGE_PADDING_X_MM,
    A4_PAGE_PADDING_Y_MM,
    A4_PAGE_WIDTH_MM,
    mmToPx,
    prepareDocumentBodyHtmlForStaticRender,
} from "@/lib/document-template/a4-document"
import {
    measureDocumentTemplateRegionContentHeight,
    measureDocumentTemplateStackedRegionsHeight,
} from "@/lib/document-template/a4-editor-pagination"
import { calculateA4BodySlotHeightPx } from "@/lib/document-template/a4-pagination"
import {
    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
    paginateTemplateLayoutByA4Height,
    parseDocumentLayout,
    type DocumentTemplatePageSlice,
} from "@/lib/document-template/header-footer"
import {
    renderTemplateHtmlByPageLocale,
    buildTemplatePreviewSampleData,
    type TemplatePreviewProgram,
} from "@/lib/document-template/variables"
import type { AdmissionRequirementId } from "@/lib/document-template/checklist-items"
import { DOCUMENT_TEMPLATE_FOOTER_MIN_HEIGHT_PX } from "@/lib/document-template/a4-editor-pagination"
import { DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX } from "@/lib/document-template/signature-stamp"
import type { DocumentTemplateDates } from "@/lib/document-template/date-variables"
import type { DocumentTemplateWatermark } from "@/lib/document-template/watermark"
import type { TemplateLocale } from "@/types/schemas/document-template"
import { DocumentTemplateA4PageFrame } from "./document-template-a4-page-frame"
import { cn } from "@/lib/utils"

type DocumentTemplatePreviewProps = {
    title: string
    bodyHtml: string
    locale?: TemplateLocale
    templateDates?: DocumentTemplateDates | null
    watermark?: DocumentTemplateWatermark | null
    useSampleData?: boolean
    /** Template checklist rows — the preview checklist follows them. */
    checklistItems?: AdmissionRequirementId[] | null
    /** A program linked to the template: its real name / campus replace dummy sample text. */
    previewProgram?: TemplatePreviewProgram | null
    className?: string
    printable?: boolean
}

export const DocumentTemplatePreview = memo(function DocumentTemplatePreview({
    title,
    bodyHtml,
    locale = "en",
    templateDates = null,
    watermark = null,
    useSampleData = true,
    checklistItems = null,
    previewProgram = null,
    className,
    printable = false,
}: DocumentTemplatePreviewProps) {
    const isClientReady = useClientReady()
    const headerMeasureRef = useRef<HTMLDivElement>(null)
    const footerMeasureRef = useRef<HTMLDivElement>(null)
    const bodyMeasureRef = useRef<HTMLDivElement>(null)

    const renderedHtml = useMemo(
        () => {
            const withVariables = useSampleData
                ? renderTemplateHtmlByPageLocale(
                      bodyHtml,
                      (pageLocale) =>
                          buildTemplatePreviewSampleData(pageLocale, templateDates, {
                              checklistItems,
                              program: previewProgram,
                          }),
                      locale
                  )
                : bodyHtml
            return prepareDocumentBodyHtmlForStaticRender(withVariables)
        },
        [bodyHtml, checklistItems, locale, previewProgram, templateDates, useSampleData]
    )

    const layout = useMemo(() => parseDocumentLayout(renderedHtml), [renderedHtml])

    const [pages, setPages] = useState<DocumentTemplatePageSlice[]>([])
    const [isPaginated, setIsPaginated] = useState(false)

    const bodyWidthPx = mmToPx(A4_PAGE_WIDTH_MM) - mmToPx(A4_PAGE_PADDING_X_MM) * 2
    const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM)

    const runPagination = useCallback(() => {
        if (typeof document === "undefined") {
            return
        }

        const hasHeader = Boolean(layout.headerHtml)
        const hasFooter = Boolean(layout.footerHtml)
        const hasSignatureStamp = Boolean(layout.signatureStampHtml)
        const hasBottomChrome = hasFooter || hasSignatureStamp
        const headerHeightPx = hasHeader
            ? measureDocumentTemplateRegionContentHeight(headerMeasureRef.current)
            : 0
        // Signature block + footer are stacked in one measure container: sum them all
        // (the first child alone left the footer out and clipped body text).
        const measuredBottomPx = hasBottomChrome
            ? measureDocumentTemplateStackedRegionsHeight(footerMeasureRef.current)
            : 0
        const minBottomPx =
            (hasSignatureStamp ? DOCUMENT_TEMPLATE_SIGNATURE_STAMP_MIN_HEIGHT_PX : 0) +
            (hasFooter ? DOCUMENT_TEMPLATE_FOOTER_MIN_HEIGHT_PX : 0)
        const footerHeightPx = hasBottomChrome ? Math.max(measuredBottomPx, minBottomPx) : 0

        if (hasHeader && headerHeightPx <= 0) {
            return
        }

        if (hasBottomChrome && measuredBottomPx <= 0) {
            return
        }

        const maxBodyHeightPx = calculateA4BodySlotHeightPx({
            hasHeader,
            hasFooter: hasBottomChrome,
            headerHeightPx,
            footerHeightPx,
            verticalPaddingPx,
        })

        const nextPages = paginateTemplateLayoutByA4Height(renderedHtml, {
            containerWidthPx: bodyWidthPx,
            contentClassName: A4_DOCUMENT_CONTENT_CLASS,
            maxBodyHeightPx,
        }, locale)

        setPages(nextPages)
        setIsPaginated(true)
    }, [
        bodyWidthPx,
        locale,
        layout.footerHtml,
        layout.headerHtml,
        layout.signatureStampHtml,
        renderedHtml,
        verticalPaddingPx,
    ])

    useLayoutEffect(() => {
        setIsPaginated(false)

        const targets = [
            headerMeasureRef.current,
            footerMeasureRef.current,
            bodyMeasureRef.current,
        ].filter(Boolean) as HTMLElement[]

        const observer = new ResizeObserver(() => runPagination())
        targets.forEach((target) => observer.observe(target))

        const bindImageLoadListeners = () => {
            targets.forEach((container) => {
                container.querySelectorAll("img").forEach((image) => {
                    if (image.complete) {
                        return
                    }

                    image.addEventListener("load", runPagination, { once: true })
                })
            })
        }

        runPagination()
        bindImageLoadListeners()

        const rafId = requestAnimationFrame(() => {
            runPagination()
            bindImageLoadListeners()
        })
        const timeoutId = window.setTimeout(() => {
            runPagination()
            bindImageLoadListeners()
        }, 300)
        const handleWindowLoad = () => runPagination()
        window.addEventListener("load", handleWindowLoad)

        return () => {
            observer.disconnect()
            cancelAnimationFrame(rafId)
            window.clearTimeout(timeoutId)
            window.removeEventListener("load", handleWindowLoad)
        }
    }, [runPagination])

    const renderPage = (page: DocumentTemplatePageSlice, key: string, print: boolean) => (
        <DocumentTemplateA4PageFrame
            key={key}
            lang={page.locale}
            headerHtml={page.headerHtml}
            signatureStampHtml={page.signatureStampHtml}
            footerHtml={page.footerHtml}
            bodyHtml={page.bodyHtml}
            watermark={watermark}
            className={print ? "document-template-print-page" : undefined}
        />
    )

    return (
        <div className={cn("space-y-4", className)}>
            {layout.headerHtml ? (
                <div
                    ref={headerMeasureRef}
                    className={cn(
                        "pointer-events-none absolute left-[-10000px] top-0 opacity-0",
                        DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                    )}
                    style={{ width: bodyWidthPx }}
                    dangerouslySetInnerHTML={{ __html: layout.headerHtml }}
                    aria-hidden
                />
            ) : null}
            {layout.signatureStampHtml || layout.footerHtml ? (
                <div
                    ref={footerMeasureRef}
                    className={cn(
                        "pointer-events-none absolute left-[-10000px] top-0 opacity-0",
                        DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                    )}
                    style={{ width: bodyWidthPx }}
                    dangerouslySetInnerHTML={{
                        __html: `${layout.signatureStampHtml ?? ""}${layout.footerHtml ?? ""}`,
                    }}
                    aria-hidden
                />
            ) : null}
            {layout.bodyHtml ? (
                <div
                    ref={bodyMeasureRef}
                    className={cn(
                        "pointer-events-none absolute left-[-10000px] top-0 opacity-0",
                        A4_DOCUMENT_CONTENT_CLASS
                    )}
                    style={{ width: bodyWidthPx }}
                    dangerouslySetInnerHTML={{ __html: layout.bodyHtml }}
                    aria-hidden
                />
            ) : null}
            <Typography as="h3" font="title">
                {title}
            </Typography>
            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                {isPaginated && pages.length > 0 ? (
                    <div className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}>
                        {pages.map((page, index) =>
                            renderPage(page, `template-page-${index}`, false)
                        )}
                    </div>
                ) : (
                    <div className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}>
                        <DocumentTemplateA4PageFrame
                            headerHtml={layout.headerHtml}
                            signatureStampHtml={layout.signatureStampHtml}
                            footerHtml={layout.footerHtml}
                            watermark={watermark}
                        />
                    </div>
                )}
            </div>
            {printable && isClientReady && isPaginated
                ? createPortal(
                      <div className="document-template-print-root">
                          {pages.map((page, index) =>
                              renderPage(page, `template-print-page-${index}`, true)
                          )}
                      </div>,
                      document.body
                  )
                : null}
        </div>
    )
})
