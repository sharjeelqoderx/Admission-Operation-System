import {
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    splitTemplateBodyIntoPages,
} from "@/lib/document-template/a4-document"

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
    const headerHeight = options.hasHeader ? options.headerHeightPx : 0
    const footerHeight = options.hasFooter ? options.footerHeightPx : 0

    return Math.max(
        120,
        A4_PAGE_HEIGHT_PX -
            options.verticalPaddingPx * 2 -
            headerHeight -
            footerHeight
    )
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
    const height = container.scrollHeight
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

/**
 * Splits body HTML into A4-sized pages. Manual page-break markers take
 * priority (one page per marker segment); each segment that overflows a
 * single page is additionally split by measured height so no content is
 * clipped in preview or print.
 */
export function paginateBodyHtmlByA4Height(
    bodyHtml: string,
    options: PaginateHtmlOptions
): string[] {
    const manualPages = splitTemplateBodyIntoPages(bodyHtml)

    if (manualPages.length > 1) {
        return manualPages.flatMap((page) => paginateSegmentByA4Height(page, options))
    }

    return paginateSegmentByA4Height(manualPages[0] ?? "", options)
}
