import {
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    resolvePageSegmentLocales,
    splitTemplateBodyIntoPageSegments,
    stripAutoPageBreakMarkers,
} from "@/lib/document-template/a4-document"
import type { TemplateLocale } from "@/lib/document-template/locale"
import { DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX } from "@/lib/document-template/header-footer"

export function calculateA4PageCount(contentHeightPx: number, bodySlotHeightPx?: number): number {
    if (!Number.isFinite(contentHeightPx) || contentHeightPx <= 0) {
        return 1
    }

    const slotHeight =
        bodySlotHeightPx && bodySlotHeightPx > 0 ? bodySlotHeightPx : A4_PAGE_HEIGHT_PX

    return Math.max(1, Math.ceil(contentHeightPx / slotHeight))
}

export function calculateA4BodySlotHeightPx(options: {
    hasHeader: boolean
    hasFooter: boolean
    headerHeightPx: number
    footerHeightPx: number
    verticalPaddingPx: number
}): number {
    const headerContentPx = options.hasHeader ? options.headerHeightPx : 0
    const footerContentPx = options.hasFooter ? options.footerHeightPx : 0
    const headerBodyGapPx = options.hasHeader ? DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX : 0

    const topReservePx =
        options.verticalPaddingPx + headerContentPx + headerBodyGapPx
    const bottomReservePx = options.verticalPaddingPx + footerContentPx

    return Math.max(120, A4_PAGE_HEIGHT_PX - topReservePx - bottomReservePx)
}

export function calculateA4StackHeightPx(pageCount: number): number {
    const safeCount = Math.max(1, pageCount)
    return safeCount * A4_PAGE_HEIGHT_PX + (safeCount - 1) * A4_PAGE_STACK_GAP_PX
}

type PaginateHtmlOptions = {
    containerWidthPx: number
    contentClassName: string
    maxBodyHeightPx: number
}

function createMeasurementContainer(options: PaginateHtmlOptions): HTMLDivElement {
    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.left = "-10000px"
    container.style.top = "0"
    container.style.visibility = "hidden"
    container.style.pointerEvents = "none"
    container.style.width = `${options.containerWidthPx}px`
    container.className = options.contentClassName
    document.body.appendChild(container)
    return container
}

function measureBlockHeight(block: HTMLElement, options: PaginateHtmlOptions): number {
    const container = createMeasurementContainer(options)
    container.innerHTML = block.outerHTML
    const measured = container.firstElementChild

    let height = container.scrollHeight

    if (measured instanceof HTMLElement) {
        height = Math.max(height, measured.offsetHeight, measured.scrollHeight)

        measured.querySelectorAll<HTMLElement>("img, figure, .document-image-float").forEach(
            (element) => {
                height = Math.max(height, element.offsetHeight, element.scrollHeight)
            }
        )
    }

    container.remove()
    return height
}

function distributeBlocksByHeight(
    normalized: string,
    options: PaginateHtmlOptions
): string[] {
    const measureRoot = createMeasurementContainer(options)
    measureRoot.innerHTML = normalized

    const blocks = Array.from(measureRoot.children) as HTMLElement[]
    measureRoot.remove()

    if (blocks.length === 0) {
        return [normalized]
    }

    const pages: string[] = []
    let currentBlocks: HTMLElement[] = []
    let currentHeight = 0

    const flushPage = () => {
        if (currentBlocks.length === 0) {
            return
        }

        pages.push(currentBlocks.map((block) => block.outerHTML).join(""))
        currentBlocks = []
        currentHeight = 0
    }

    for (const block of blocks) {
        const blockHeight = measureBlockHeight(block, options)
        const exceedsPage =
            currentBlocks.length > 0 && currentHeight + blockHeight > options.maxBodyHeightPx

        if (exceedsPage) {
            flushPage()
        }

        if (blockHeight > options.maxBodyHeightPx && currentBlocks.length === 0) {
            pages.push(block.outerHTML)
            continue
        }

        currentBlocks.push(block)
        currentHeight += blockHeight
    }

    flushPage()

    return pages.length > 0 ? pages : [normalized]
}

function paginateSegmentByA4Height(
    segmentHtml: string,
    options: PaginateHtmlOptions
): string[] {
    const normalized = segmentHtml.trim()
    if (!normalized) {
        return [""]
    }

    if (typeof document === "undefined") {
        return [normalized]
    }

    return distributeBlocksByHeight(normalized, options)
}

export type PaginatedBodyPage = {
    html: string
    /** Language of the page (follows the page-break markers). */
    locale: TemplateLocale
}

/**
 * Splits body HTML into A4-sized pages. Manual page-break markers take
 * priority (one page per marker segment); each segment that overflows a
 * single page is additionally split by measured height so no content is
 * clipped in preview or print. Overflow pages inherit the language of the
 * segment they came from.
 */
export function paginateBodyHtmlByA4HeightWithLocale(
    bodyHtml: string,
    options: PaginateHtmlOptions,
    templateLocale: TemplateLocale = "en"
): PaginatedBodyPage[] {
    const normalizedBody = stripAutoPageBreakMarkers(bodyHtml)
    const segments = splitTemplateBodyIntoPageSegments(normalizedBody)
    const locales = resolvePageSegmentLocales(segments, templateLocale)

    return segments.flatMap((segment, index) =>
        paginateSegmentByA4Height(segment.html, options).map((html) => ({
            html,
            locale: locales[index],
        }))
    )
}

export function paginateBodyHtmlByA4Height(
    bodyHtml: string,
    options: PaginateHtmlOptions
): string[] {
    return paginateBodyHtmlByA4HeightWithLocale(bodyHtml, options).map((page) => page.html)
}
