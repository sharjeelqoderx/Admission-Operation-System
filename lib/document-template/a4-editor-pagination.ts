import {
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    A4_PAGE_PADDING_Y_MM,
    DOCUMENT_PAGE_BREAK_CLASS,
    mmToPx,
} from "@/lib/document-template/a4-document"
import {
    DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX,
    DOCUMENT_TEMPLATE_HEADER_LOGO_MAX_HEIGHT_PX,
} from "@/lib/document-template/header-footer"

/** Minimum footer block height before real measure is available. */
export const DOCUMENT_TEMPLATE_FOOTER_MIN_HEIGHT_PX = 80

export const DOCUMENT_TEMPLATE_LAYOUT_TRANSACTION_META = "documentTemplateLayout"

const PAGE_FLOW_ATTR = "data-doc-page-flow"
const BODY_OVERFLOW_TOLERANCE_PX = 2
/** Keep last line fully above the footer / bottom padding mask (no half-cut glyphs). */
const BODY_FOOTER_SAFETY_PX = 28
/** Minimum height for empty paragraphs/lines in pagination. */
const MIN_FLOW_BLOCK_HEIGHT_PX = 22

function bodyBottomClearancePx(_layout: A4SheetLayout, _blockHeightPx: number): number {
    // Last-line reserve is already baked into bodyEnd via footerZone/editorBottom.
    // Extra clearance here only created early pushes and empty mid-page gaps.
    return 0
}

export type EditorBodyLayoutMetrics = {
    editorTopPx: number
    editorBottomPx: number
    maxBodyHeightPx: number
    pageStridePx: number
    headerZonePx: number
    footerZonePx: number
    footerChromePx: number
}

/** Fixed A4 sheet bands: header (top) → body → footer (bottom) on every page. */
export type A4SheetLayout = {
    pageHeightPx: number
    pageGapPx: number
    /** Distance between tops of consecutive A4 sheets in the editor stack. */
    visualStridePx: number
    /** Virtual body-flow step: body + footer band + gap + header band. */
    flowStridePx: number
    verticalPaddingPx: number
    headerZonePx: number
    /** Bottom band used for bodyEnd / masks (includes last-line reserve). */
    footerZonePx: number
    /** Actual footer HTML overlay height (no last-line reserve). */
    footerChromePx: number
    bodyHeightPx: number
    editorTopPx: number
    editorBottomPx: number
    hasHeader: boolean
    hasFooter: boolean
}

export type A4SheetBand = {
    pageIndex: number
    pageTopPx: number
    bodyStartPx: number
    bodyEndPx: number
    footerTopPx: number
    pageBottomPx: number
    gapStartPx: number
    gapEndPx: number
}

export type BlockFlowTarget = {
    pageIndex: number
    targetBodyStartPx: number
    needsPush: boolean
}

/** Measures header/footer region height (padding included; header margin gap is added separately). */
export function measureDocumentTemplateRegionContentHeight(
    element: HTMLElement | null
): number {
    if (!element) {
        return 0
    }

    const region =
        element.firstElementChild instanceof HTMLElement
            ? element.firstElementChild
            : element

    return Math.max(region.offsetHeight, region.scrollHeight, region.getBoundingClientRect().height)
}

export function resolveEditorRegionHeights(options: {
    hasHeader: boolean
    hasFooter: boolean
    headerHeightPx: number
    footerHeightPx: number
}): { headerHeightPx: number; footerHeightPx: number } {
    return {
        headerHeightPx: options.hasHeader
            ? Math.max(
                  options.headerHeightPx,
                  DOCUMENT_TEMPLATE_HEADER_LOGO_MAX_HEIGHT_PX + 12
              )
            : 0,
        footerHeightPx: options.hasFooter
            ? Math.max(options.footerHeightPx, DOCUMENT_TEMPLATE_FOOTER_MIN_HEIGHT_PX)
            : 0,
    }
}

/**
 * Page layout: HEADER ZONE → BODY → FOOTER ZONE per sheet.
 * Header/footer zones (and their gaps) are outside the body flow.
 *
 * Always reserves one line above the footer/bottom padding so the last body line
 * cannot sit half-under the white mask (the "hidden at page end" bug).
 */
export function calculateEditorBodyLayoutMetrics(options: {
    hasHeader: boolean
    hasFooter: boolean
    headerHeightPx: number
    footerHeightPx: number
}): EditorBodyLayoutMetrics {
    const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM)
    const headerContentPx = options.hasHeader ? options.headerHeightPx : 0
    const footerContentPx = options.hasFooter ? options.footerHeightPx : 0
    const headerBodyGapPx = options.hasHeader ? DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX : 0
    const lastLineReservePx = MIN_FLOW_BLOCK_HEIGHT_PX

    const headerZonePx = verticalPaddingPx + headerContentPx + headerBodyGapPx
    const footerChromePx = options.hasFooter ? verticalPaddingPx + footerContentPx : 0
    // Mask/bodyEnd include last-line reserve; footer HTML uses footerChromePx only.
    const footerZonePx = options.hasFooter
        ? footerChromePx + lastLineReservePx
        : 0

    const editorTopPx = options.hasHeader ? headerZonePx : verticalPaddingPx
    const editorBottomPx = options.hasFooter
        ? footerZonePx
        : verticalPaddingPx + lastLineReservePx

    const maxBodyHeightPx = Math.max(120, A4_PAGE_HEIGHT_PX - editorTopPx - editorBottomPx)

    const pageStridePx =
        maxBodyHeightPx +
        (options.hasFooter ? footerZonePx : editorBottomPx) +
        A4_PAGE_STACK_GAP_PX +
        headerZonePx

    return {
        editorTopPx,
        editorBottomPx,
        maxBodyHeightPx,
        pageStridePx,
        headerZonePx,
        footerZonePx,
        footerChromePx,
    }
}

/** Single source of truth for A4 sheet geometry (header/body/footer bands). */
export function resolveA4SheetLayout(options: {
    hasHeader: boolean
    hasFooter: boolean
    headerHeightPx: number
    footerHeightPx: number
}): A4SheetLayout {
    const regions = resolveEditorRegionHeights(options)
    const metrics = calculateEditorBodyLayoutMetrics({
        hasHeader: options.hasHeader,
        hasFooter: options.hasFooter,
        headerHeightPx: regions.headerHeightPx,
        footerHeightPx: regions.footerHeightPx,
    })

    const visualStridePx = A4_PAGE_HEIGHT_PX + A4_PAGE_STACK_GAP_PX

    return {
        pageHeightPx: A4_PAGE_HEIGHT_PX,
        pageGapPx: A4_PAGE_STACK_GAP_PX,
        visualStridePx,
        flowStridePx: metrics.pageStridePx,
        verticalPaddingPx: mmToPx(A4_PAGE_PADDING_Y_MM),
        headerZonePx: metrics.headerZonePx,
        footerZonePx: metrics.footerZonePx,
        footerChromePx: metrics.footerChromePx,
        bodyHeightPx: metrics.maxBodyHeightPx,
        editorTopPx: metrics.editorTopPx,
        editorBottomPx: metrics.editorBottomPx,
        hasHeader: options.hasHeader,
        hasFooter: options.hasFooter,
    }
}

/** Layout-root coordinates for one A4 sheet (header zone, body slot, footer zone). */
export function getA4SheetBand(pageIndex: number, layout: A4SheetLayout): A4SheetBand {
    const pageTopPx = pageIndex * layout.visualStridePx
    const topReservePx = layout.hasHeader
        ? layout.headerZonePx
        : layout.verticalPaddingPx
    // Use editorBottomPx so the last-line reserve is always masked (footer or plain).
    const bottomReservePx = layout.hasFooter
        ? layout.footerZonePx
        : layout.editorBottomPx
    const bodyStartPx = pageTopPx + topReservePx
    const bodyEndPx = pageTopPx + layout.pageHeightPx - bottomReservePx

    return {
        pageIndex,
        pageTopPx,
        bodyStartPx,
        bodyEndPx,
        footerTopPx: bodyEndPx,
        pageBottomPx: pageTopPx + layout.pageHeightPx,
        gapStartPx: pageTopPx + layout.pageHeightPx,
        gapEndPx: pageTopPx + layout.pageHeightPx + layout.pageGapPx,
    }
}

/** Page index for a layout-root Y coordinate (handles footer/gap/header bands). */
export function getPageIndexForLayoutY(y: number, layout: A4SheetLayout): number {
    if (y <= BODY_OVERFLOW_TOLERANCE_PX) {
        return 0
    }

    let pageIndex = 0

    while (pageIndex < 64) {
        const band = getA4SheetBand(pageIndex, layout)
        if (y < band.gapEndPx - BODY_OVERFLOW_TOLERANCE_PX) {
            return pageIndex
        }
        pageIndex += 1
    }

    return 63
}

/** Page frames needed from the bottom edge of laid-out content. */
export function computePageCountFromLayoutExtent(
    contentBottomPx: number,
    layout: A4SheetLayout
): number {
    const firstPageBodyEndPx = getA4SheetBand(0, layout).bodyEndPx

    if (contentBottomPx <= firstPageBodyEndPx + BODY_OVERFLOW_TOLERANCE_PX) {
        return 1
    }

    return getPageIndexForLayoutY(contentBottomPx, layout) + 1
}

/** Which page body slot a block belongs in, and whether it must be pushed down. */
export function resolveBlockFlowTarget(
    naturalTopPx: number,
    blockHeightPx: number,
    layout: A4SheetLayout
): BlockFlowTarget {
    const pageIndex = getPageIndexForLayoutY(naturalTopPx, layout)
    const band = getA4SheetBand(pageIndex, layout)

    if (naturalTopPx >= band.gapStartPx - BODY_OVERFLOW_TOLERANCE_PX) {
        const nextBand = getA4SheetBand(pageIndex + 1, layout)
        return {
            pageIndex: pageIndex + 1,
            targetBodyStartPx: nextBand.bodyStartPx,
            needsPush: true,
        }
    }

    if (naturalTopPx < band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX) {
        return {
            pageIndex,
            targetBodyStartPx: band.bodyStartPx,
            needsPush: true,
        }
    }

    // Never allow even 1px into the bottom mask — that reads as half-cut text.
    const bodyFitLimitPx = band.bodyEndPx - bodyBottomClearancePx(layout, blockHeightPx)

    if (naturalTopPx + blockHeightPx <= bodyFitLimitPx) {
        return {
            pageIndex,
            targetBodyStartPx: band.bodyStartPx,
            needsPush: false,
        }
    }

    // Tall blocks (taller than one body slot) must keep flowing from a valid body
    // start — pushing them wholesale empties the current page. Mid-block spacers
    // skip footer/gap/header; short blocks still move as a whole.
    const startsInBody =
        naturalTopPx >= band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX &&
        naturalTopPx < bodyFitLimitPx
    if (
        blockHeightPx > layout.bodyHeightPx + BODY_OVERFLOW_TOLERANCE_PX &&
        startsInBody
    ) {
        return {
            pageIndex,
            targetBodyStartPx: band.bodyStartPx,
            needsPush: false,
        }
    }

    const nextBand = getA4SheetBand(pageIndex + 1, layout)
    return {
        pageIndex: pageIndex + 1,
        targetBodyStartPx: nextBand.bodyStartPx,
        needsPush: true,
    }
}

function pageBodyStart(pageIndex: number, pageStridePx: number): number {
    return pageIndex * pageStridePx
}

function pageBodyEnd(
    pageIndex: number,
    pageStridePx: number,
    maxBodyHeightPx: number
): number {
    return pageBodyStart(pageIndex, pageStridePx) + maxBodyHeightPx
}

/** Page index for a body-flow Y coordinate. */
export function getPageIndexForContentY(
    y: number,
    pageStridePx: number,
    maxBodyHeightPx: number
): number {
    if (y <= BODY_OVERFLOW_TOLERANCE_PX) {
        return 0
    }

    let pageIndex = 0

    while (
        pageBodyStart(pageIndex + 1, pageStridePx) <=
        y + BODY_OVERFLOW_TOLERANCE_PX
    ) {
        pageIndex += 1
    }

    const bodyEnd = pageBodyEnd(pageIndex, pageStridePx, maxBodyHeightPx)
    const nextBodyStart = pageBodyStart(pageIndex + 1, pageStridePx)

    if (y > bodyEnd && y < nextBodyStart) {
        return pageIndex
    }

    return pageIndex
}

/** Footer/header bands between pages are not body content — clamp extent for page count. */
function normalizeContentExtentToBodyFlow(
    y: number,
    pageStridePx: number,
    maxBodyHeightPx: number
): number {
    if (y <= BODY_OVERFLOW_TOLERANCE_PX) {
        return 0
    }

    let pageIndex = 0

    while (true) {
        const bodyEnd = pageBodyEnd(pageIndex, pageStridePx, maxBodyHeightPx)
        const nextBodyStart = pageBodyStart(pageIndex + 1, pageStridePx)

        if (y <= bodyEnd + BODY_OVERFLOW_TOLERANCE_PX) {
            return y
        }

        if (y < nextBodyStart) {
            return bodyEnd
        }

        pageIndex += 1
    }
}

/** Page frames needed for body content — ignores header/footer reserved bands. */
export function computePageCountFromContentExtent(
    contentExtentY: number,
    pageStridePx: number,
    maxBodyHeightPx: number
): number {
    const normalizedExtent = normalizeContentExtentToBodyFlow(
        contentExtentY,
        pageStridePx,
        maxBodyHeightPx
    )

    if (normalizedExtent <= BODY_OVERFLOW_TOLERANCE_PX) {
        return 1
    }

    return Math.max(
        1,
        getPageIndexForContentY(normalizedExtent, pageStridePx, maxBodyHeightPx) + 1
    )
}

/** Move virtual Y out of footer/header reserved bands between page bodies. */
function snapVirtualYToPageBody(options: {
    pageIndex: number
    virtualY: number
    pageStridePx: number
    maxBodyHeightPx: number
}): { pageIndex: number; virtualY: number } {
    let { pageIndex, virtualY } = options
    const { pageStridePx, maxBodyHeightPx } = options

    while (virtualY >= pageBodyEnd(pageIndex, pageStridePx, maxBodyHeightPx)) {
        pageIndex += 1
    }

    const bodyStart = pageBodyStart(pageIndex, pageStridePx)
    if (virtualY < bodyStart) {
        virtualY = bodyStart
    }

    return { pageIndex, virtualY }
}

let layoutSyncDepth = 0

export function isDocumentTemplateLayoutSyncActive(): boolean {
    return layoutSyncDepth > 0
}

export function isDocumentTemplateLayoutTransaction(transaction: {
    getMeta: (key: string) => unknown
    docChanged?: boolean
}): boolean {
    return (
        isDocumentTemplateLayoutSyncActive() ||
        transaction.getMeta(DOCUMENT_TEMPLATE_LAYOUT_TRANSACTION_META) === true
    )
}

/** True when layout should rerun — content/size changed, not selection/focus alone. */
export function shouldRunEditorLayoutForTransaction(transaction: {
    getMeta: (key: string) => unknown
    docChanged?: boolean
}): boolean {
    if (isDocumentTemplateLayoutTransaction(transaction)) {
        return false
    }

    return transaction.docChanged === true
}

export type VisualPageFlowBlockKind = "content" | "manual-break" | "legacy-auto-break"

export type VisualPageFlowBlock = {
    key: string
    kind: VisualPageFlowBlockKind
    height: number
}

export type VisualPageFlowPlan = {
    overflowMarginTopByKey: Record<string, number>
    manualFillHeightByKey: Record<string, number>
    /**
     * In-flow spacers that skip footer + page-gap + next header inside a tall
     * block. Positions are ProseMirror doc positions (widget before that pos).
     */
    lineSpacers: Array<{ pos: number; heightPx: number }>
    pageCount: number
}

const EMPTY_VISUAL_PAGE_FLOW_PLAN: VisualPageFlowPlan = {
    overflowMarginTopByKey: {},
    manualFillHeightByKey: {},
    lineSpacers: [],
    pageCount: 1,
}

/** Distance from a page body end to the next page body start (masked band). */
export function pageBoundarySkipPx(layout: A4SheetLayout): number {
    return Math.max(0, layout.visualStridePx - layout.bodyHeightPx)
}

/**
 * Advance layout Y through a tall block, inserting virtual page-boundary skips
 * so following blocks land on the correct page (matches line-spacer widgets).
 */
function advanceLayoutYThroughBlock(
    layoutTopPx: number,
    blockHeightPx: number,
    layout: A4SheetLayout
): { layoutBottomPx: number; skipCount: number; totalSkipPx: number } {
    let y = layoutTopPx
    let remaining = blockHeightPx
    let skipCount = 0
    let totalSkipPx = 0
    let guard = 0

    while (remaining > 0.5 && guard < 64) {
        guard += 1
        const pageIndex = getPageIndexForLayoutY(y, layout)
        const band = getA4SheetBand(pageIndex, layout)

        if (y >= band.bodyEndPx - BODY_OVERFLOW_TOLERANCE_PX) {
            const nextStart = getA4SheetBand(pageIndex + 1, layout).bodyStartPx
            const skip = Math.max(0, nextStart - y)
            y = nextStart
            if (skip > 0.5) {
                skipCount += 1
                totalSkipPx += skip
            }
            continue
        }

        if (y < band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX) {
            const skip = Math.max(0, band.bodyStartPx - y)
            y = band.bodyStartPx
            if (skip > 0.5) {
                skipCount += 1
                totalSkipPx += skip
            }
            continue
        }

        const fit = band.bodyEndPx - y
        const take = Math.min(remaining, fit)
        y += take
        remaining -= take

        if (remaining > 0.5) {
            const nextStart = getA4SheetBand(pageIndex + 1, layout).bodyStartPx
            const skip = Math.max(0, nextStart - y)
            y = nextStart
            if (skip > 0.5) {
                skipCount += 1
                totalSkipPx += skip
            }
        }
    }

    return { layoutBottomPx: y, skipCount, totalSkipPx }
}

/**
 * Pure page-flow planner — walks blocks in order so only the first block on a
 * new page receives a break margin (later lines keep normal line spacing).
 * Margins are derived from virtual layout Y only (not live DOM offsetTop).
 */
export function computeVisualPageFlowPlan(options: {
    blocks: VisualPageFlowBlock[]
    sheetLayout: A4SheetLayout
    /** @deprecated Ignored — kept for call-site compatibility. */
    blockElements?: HTMLElement[]
}): VisualPageFlowPlan {
    const { blocks, sheetLayout } = options
    const overflowMarginTopByKey: Record<string, number> = {}
    const manualFillHeightByKey: Record<string, number> = {}

    if (sheetLayout.bodyHeightPx <= 0 || blocks.length === 0) {
        return {
            overflowMarginTopByKey,
            manualFillHeightByKey,
            lineSpacers: [],
            pageCount: 1,
        }
    }

    let contentY = 0
    let maxContentBottomPx = 0

    blocks.forEach((block, blockIndex) => {
        if (block.kind === "legacy-auto-break") {
            return
        }

        if (block.kind === "manual-break") {
            const layoutY = contentY + sheetLayout.editorTopPx
            const pageIndex = getPageIndexForLayoutY(layoutY, sheetLayout)
            const nextBodyStart = getA4SheetBand(pageIndex + 1, sheetLayout).bodyStartPx
            const nextContentY = Math.max(0, nextBodyStart - sheetLayout.editorTopPx)
            manualFillHeightByKey[block.key] = Math.max(0, nextContentY - contentY)
            const hasContentAfter = blocks
                .slice(blockIndex + 1)
                .some(
                    (next) =>
                        next.kind !== "legacy-auto-break" &&
                        (next.kind !== "content" || next.height > 0)
                )
            if (hasContentAfter) {
                contentY = nextContentY
            }
            maxContentBottomPx = Math.max(
                maxContentBottomPx,
                contentY + sheetLayout.editorTopPx
            )
            return
        }

        const blockHeight = block.height

        if (blockHeight <= 0) {
            return
        }

        // Content-box Y (0 at first line) + editorTopPx = layout-root Y.
        // Decoration apply margin-top in the content box — keep that space consistent.
        const layoutTopPx = contentY + sheetLayout.editorTopPx
        const flowTarget = resolveBlockFlowTarget(layoutTopPx, blockHeight, sheetLayout)
        let marginTop = 0
        let placedContentY = contentY

        if (flowTarget.needsPush) {
            if (
                blockIndex === 0 &&
                flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
            ) {
                // Page-1 top inset is paddingTop — never a decoration margin.
                marginTop = 0
                placedContentY = 0
            } else {
                // Exact jump to the next body slot. Never cap this — a short cap
                // leaves the block straddling footer/gap (hidden text) and lands
                // mid-page on the next sheet (extra empty hole).
                const contentTargetY = Math.max(
                    0,
                    flowTarget.targetBodyStartPx - sheetLayout.editorTopPx
                )
                marginTop = Math.max(0, contentTargetY - contentY)
                placedContentY = contentY + marginTop
            }
        }

        if (marginTop > 0.5) {
            overflowMarginTopByKey[block.key] = marginTop
        }

        let placedBottomPx = placedContentY + blockHeight + sheetLayout.editorTopPx

        // If a normal-sized block still spills past the body slot, move it wholly.
        const placedLayoutTop = placedContentY + sheetLayout.editorTopPx
        const placedPageIndex = getPageIndexForLayoutY(placedLayoutTop, sheetLayout)
        const placedBand = getA4SheetBand(placedPageIndex, sheetLayout)

        if (
            blockHeight <= sheetLayout.bodyHeightPx &&
            placedBottomPx > placedBand.bodyEndPx
        ) {
            let targetPage = placedPageIndex + 1

            while (
                targetPage < 64 &&
                getA4SheetBand(targetPage, sheetLayout).bodyEndPx -
                    getA4SheetBand(targetPage, sheetLayout).bodyStartPx <
                    blockHeight
            ) {
                targetPage += 1
            }

            const targetStart = getA4SheetBand(targetPage, sheetLayout).bodyStartPx
            const contentTargetY = Math.max(0, targetStart - sheetLayout.editorTopPx)
            marginTop = Math.max(0, contentTargetY - contentY)
            if (marginTop > 0.5) {
                overflowMarginTopByKey[block.key] = marginTop
            } else {
                delete overflowMarginTopByKey[block.key]
            }
            placedContentY = contentTargetY
            placedBottomPx = placedContentY + blockHeight + sheetLayout.editorTopPx
            contentY = placedContentY + blockHeight
        } else if (blockHeight > sheetLayout.bodyHeightPx) {
            // Tall block keeps flowing; virtual Y skips masked page boundaries so
            // the next block aligns to a real body slot (line-spacer widgets match).
            const advanced = advanceLayoutYThroughBlock(
                placedLayoutTop,
                blockHeight,
                sheetLayout
            )
            placedBottomPx = advanced.layoutBottomPx
            contentY = Math.max(0, placedBottomPx - sheetLayout.editorTopPx)
        } else {
            contentY = placedContentY + blockHeight
        }

        maxContentBottomPx = Math.max(maxContentBottomPx, placedBottomPx)
    })

    return {
        overflowMarginTopByKey,
        manualFillHeightByKey,
        lineSpacers: [],
        pageCount: computePageCountFromLayoutExtent(maxContentBottomPx, sheetLayout),
    }
}

export function areVisualPageFlowPlansEqual(
    left: VisualPageFlowPlan,
    right: VisualPageFlowPlan
): boolean {
    if (left.pageCount !== right.pageCount) {
        return false
    }

    const leftSpacers = left.lineSpacers ?? []
    const rightSpacers = right.lineSpacers ?? []
    if (leftSpacers.length !== rightSpacers.length) {
        return false
    }
    for (let i = 0; i < leftSpacers.length; i += 1) {
        if (
            leftSpacers[i].pos !== rightSpacers[i].pos ||
            Math.abs(leftSpacers[i].heightPx - rightSpacers[i].heightPx) > 0.5
        ) {
            return false
        }
    }

    const keys = new Set([
        ...Object.keys(left.overflowMarginTopByKey),
        ...Object.keys(right.overflowMarginTopByKey),
        ...Object.keys(left.manualFillHeightByKey),
        ...Object.keys(right.manualFillHeightByKey),
    ])

    for (const key of keys) {
        if (
            (left.overflowMarginTopByKey[key] ?? 0) !==
            (right.overflowMarginTopByKey[key] ?? 0)
        ) {
            return false
        }

        if (
            (left.manualFillHeightByKey[key] ?? 0) !==
            (right.manualFillHeightByKey[key] ?? 0)
        ) {
            return false
        }
    }

    return true
}

function readBlockMarginBottom(block: HTMLElement): number {
    const marginBottom = Number.parseFloat(getComputedStyle(block).marginBottom)
    return Number.isFinite(marginBottom) ? marginBottom : 0
}

function readAppliedFlowMarginTop(block: HTMLElement): number {
    const computed = Number.parseFloat(getComputedStyle(block).marginTop)
    if (Number.isFinite(computed) && computed > 0) {
        return computed
    }

    const inline = Number.parseFloat(block.style.marginTop)
    return Number.isFinite(inline) ? inline : 0
}

/** One blank line in the live DOM — matches Google Docs Enter (min-height line). */
function measureEmptyParagraphFlowHeight(block: HTMLElement): number {
    const renderedHeight = block.getBoundingClientRect().height
    if (renderedHeight > 0) {
        return renderedHeight + readBlockMarginBottom(block)
    }

    const style = getComputedStyle(block)
    const fontSize = Number.parseFloat(style.fontSize) || 14
    const lineHeightRaw = style.lineHeight
    const lineHeight =
        lineHeightRaw === "normal"
            ? fontSize * 1.15
            : Number.parseFloat(lineHeightRaw) || fontSize * 1.15

    return lineHeight + readBlockMarginBottom(block)
}

/** Empty prose paragraphs (often created by Enter) must not reserve page body space. */
function isEmptyFlowParagraph(block: HTMLElement): boolean {
    if (block.tagName !== "P") {
        return false
    }

    if (block.querySelector("img,figure,table,video,iframe")) {
        return false
    }

    const text = block.textContent?.replace(/\u200B/g, "").trim() ?? ""
    if (text.length > 0) {
        return false
    }

    return true
}

/** Measured footprint for one body block — same rules for paragraphs and headings. */
function measureImageContributionHeight(
    block: HTMLElement,
    blockTop: number,
    image: HTMLElement
): number {
    const imageRect = image.getBoundingClientRect()
    if (imageRect.height > 1) {
        return imageRect.bottom - blockTop
    }

    if (!(image instanceof HTMLImageElement)) {
        return Math.max(image.offsetHeight, image.scrollHeight)
    }

    const attrHeight = Number.parseFloat(image.getAttribute("height") ?? "")
    const styleHeight = Number.parseFloat(image.style.height)
    const fallbackHeight = Math.max(
        Number.isFinite(attrHeight) ? attrHeight : 0,
        Number.isFinite(styleHeight) ? styleHeight : 0,
        image.offsetHeight,
        image.scrollHeight
    )

    if (image.naturalHeight > 0 && image.naturalWidth > 0) {
        const displayWidth =
            imageRect.width > 1
                ? imageRect.width
                : image.clientWidth > 0
                  ? image.clientWidth
                  : image.naturalWidth
        return Math.max(
            fallbackHeight,
            (image.naturalHeight / image.naturalWidth) * displayWidth
        )
    }

    return fallbackHeight
}

/** Measured footprint for one body block — same rules for paragraphs and headings. */
function measureBlockFlowFootprint(block: HTMLElement): number {
    if (isLegacyAutoPageBreakElement(block) || isManualPageBreakElement(block)) {
        return 0
    }

    if (isEmptyFlowParagraph(block)) {
        return measureEmptyParagraphFlowHeight(block)
    }

    const blockRect = block.getBoundingClientRect()
    let height =
        Math.max(blockRect.height, block.scrollHeight) + readBlockMarginBottom(block)

    block.querySelectorAll<HTMLElement>(
        "img, figure, table, .document-image-float, .document-sign-stamp-row, [data-resize-image-ui]"
    ).forEach((element) => {
        const contribution =
            element instanceof HTMLImageElement || element.tagName === "IMG"
                ? measureImageContributionHeight(block, blockRect.top, element)
                : (() => {
                      const elementRect = element.getBoundingClientRect()
                      if (elementRect.height > 1) {
                          return elementRect.bottom - blockRect.top
                      }
                      return element.offsetTop + Math.max(element.offsetHeight, element.scrollHeight)
                  })()
        height = Math.max(height, contribution)
    })

    if (
        block.matches("table.document-sign-stamp-table, .document-sign-stamp-row") ||
        block.querySelector("table.document-sign-stamp-table, .document-sign-stamp-row")
    ) {
        height = Math.max(height, blockRect.height, block.scrollHeight)
    }

    // Pagination spacer widgets are in-flow chrome — not content height.
    block
        .querySelectorAll<HTMLElement>('[data-doc-page-flow-spacer="true"]')
        .forEach((spacer) => {
            height -= spacer.offsetHeight
        })

    return Math.max(height, MIN_FLOW_BLOCK_HEIGHT_PX)
}

function isManualPageBreakElement(element: HTMLElement): boolean {
    return (
        element.classList.contains(DOCUMENT_PAGE_BREAK_CLASS) &&
        element.getAttribute("data-auto-page-break") !== "true"
    )
}

function isLegacyAutoPageBreakElement(element: HTMLElement): boolean {
    return element.getAttribute("data-auto-page-break") === "true"
}

function blockKindForElement(element: HTMLElement): VisualPageFlowBlockKind {
    if (isLegacyAutoPageBreakElement(element)) {
        return "legacy-auto-break"
    }

    if (isManualPageBreakElement(element)) {
        return "manual-break"
    }

    return "content"
}

export function clearEditorVisualPageFlow(proseMirror: HTMLElement) {
    Array.from(proseMirror.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) {
            return
        }

        child.removeAttribute(PAGE_FLOW_ATTR)

        if (isManualPageBreakElement(child)) {
            child.style.height = ""
            child.style.margin = ""
            child.style.padding = ""
            child.style.overflow = ""
            return
        }

        if (isLegacyAutoPageBreakElement(child)) {
            child.style.height = "0"
            child.style.margin = "0"
            child.style.padding = "0"
            child.style.overflow = "hidden"
            child.style.display = "none"
            return
        }

        child.style.marginTop = ""
    })
}

export function clearPageBreakHeights(proseMirror: HTMLElement | null) {
    if (!proseMirror) {
        return
    }

    clearEditorVisualPageFlow(proseMirror)
}

function collectFlowBlocks(proseMirror: HTMLElement): VisualPageFlowBlock[] {
    const blockElements = Array.from(proseMirror.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
    )

    return blockElements.map((child, index) => {
        const kind = blockKindForElement(child)

        return {
            key: child.getAttribute("data-doc-flow-key") ?? `block-${index}`,
            kind,
            height:
                kind === "manual-break" || kind === "legacy-auto-break"
                    ? 0
                    : measureBlockFlowFootprint(child),
        }
    })
}

type BuildEditorVisualPageFlowPlanOptions = {
    proseMirror: HTMLElement
    sheetLayout: A4SheetLayout
}

/** Measures natural block heights, compensating for existing pagination margin pushes. */
export function buildEditorVisualPageFlowPlan(
    options: BuildEditorVisualPageFlowPlanOptions
): VisualPageFlowPlan {
    const { proseMirror, sheetLayout } = options

    const blockElements = Array.from(proseMirror.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
    )

    blockElements.forEach((block, index) => {
        block.setAttribute("data-doc-flow-key", `block-${index}`)
    })

    const flowBlocks = collectFlowBlocks(proseMirror)

    if (flowBlocks.length === 0) {
        return {
            overflowMarginTopByKey: {},
            manualFillHeightByKey: {},
            lineSpacers: [],
            pageCount: 1,
        }
    }

    return computeVisualPageFlowPlan({
        blocks: flowBlocks,
        sheetLayout,
        blockElements,
    })
}

function measureBlockLayoutHeight(block: HTMLElement): number {
    if (isManualPageBreakElement(block)) {
        const fill = Number.parseFloat(getComputedStyle(block).height)
        return Number.isFinite(fill) && fill > 0 ? fill : 0
    }

    if (isEmptyFlowParagraph(block)) {
        return measureEmptyParagraphFlowHeight(block)
    }

    return measureBlockFlowFootprint(block)
}

/** Bottom edge of rendered content relative to the page stack root (px). */
export function measureVisualContentExtent(
    proseMirror: HTMLElement,
    layoutRoot: HTMLElement
): number {
    const rootTop = layoutRoot.getBoundingClientRect().top
    let maxBottom = 0

    Array.from(proseMirror.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) {
            return
        }

        if (isLegacyAutoPageBreakElement(child)) {
            return
        }

        maxBottom = Math.max(maxBottom, child.getBoundingClientRect().bottom - rootTop)
    })

    return maxBottom
}

/**
 * Page count from the final flow plan (overflow margins included).
 * DOM extent alone can stay on page 1 until decoration layout is flushed.
 */
export function computePageCountFromResolvedPlan(options: {
    blocks: VisualPageFlowBlock[]
    plan: VisualPageFlowPlan
    sheetLayout: A4SheetLayout
    blockElements?: HTMLElement[]
}): number {
    const { blocks, plan, sheetLayout } = options

    if (blocks.length === 0 || sheetLayout.bodyHeightPx <= 0) {
        return 1
    }

    // Replay in the same content-box space as computeVisualPageFlowPlan
    // (Y=0 at first line; layout Y = contentY + editorTopPx).
    let contentY = 0
    let maxBottomPx = 0

    blocks.forEach((block, blockIndex) => {
        if (block.kind === "legacy-auto-break") {
            return
        }

        if (block.kind === "manual-break") {
            const fill = plan.manualFillHeightByKey[block.key] ?? 0
            const hasContentAfter = blocks
                .slice(blockIndex + 1)
                .some(
                    (next) =>
                        next.kind !== "legacy-auto-break" &&
                        (next.kind !== "content" || next.height > 0)
                )
            if (hasContentAfter && fill > 0) {
                contentY += fill
            }
            maxBottomPx = Math.max(
                maxBottomPx,
                contentY + sheetLayout.editorTopPx
            )
            return
        }

        if (block.height <= 0) {
            return
        }

        const marginTop = plan.overflowMarginTopByKey[block.key] ?? 0
        let placedContentY = contentY + Math.max(0, marginTop)

        if (marginTop <= 0.5) {
            const layoutTopPx = contentY + sheetLayout.editorTopPx
            const flowTarget = resolveBlockFlowTarget(
                layoutTopPx,
                block.height,
                sheetLayout
            )
            if (flowTarget.needsPush) {
                if (
                    blockIndex === 0 &&
                    flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
                ) {
                    placedContentY = 0
                } else {
                    placedContentY = Math.max(
                        0,
                        flowTarget.targetBodyStartPx - sheetLayout.editorTopPx
                    )
                }
            }
        }

        let placedBottomPx =
            placedContentY + block.height + sheetLayout.editorTopPx

        const placedLayoutTop = placedContentY + sheetLayout.editorTopPx
        const placedPageIndex = getPageIndexForLayoutY(
            placedLayoutTop,
            sheetLayout
        )
        const placedBand = getA4SheetBand(placedPageIndex, sheetLayout)

        if (
            block.height <= sheetLayout.bodyHeightPx &&
            placedBottomPx > placedBand.bodyEndPx + BODY_OVERFLOW_TOLERANCE_PX
        ) {
            let targetPage = placedPageIndex + 1

            while (
                targetPage < 64 &&
                getA4SheetBand(targetPage, sheetLayout).bodyEndPx -
                    getA4SheetBand(targetPage, sheetLayout).bodyStartPx <
                    block.height
            ) {
                targetPage += 1
            }

            placedBottomPx =
                getA4SheetBand(targetPage, sheetLayout).bodyStartPx +
                block.height
            placedContentY = Math.max(
                0,
                placedBottomPx - block.height - sheetLayout.editorTopPx
            )
        }

        contentY = placedContentY + block.height
        maxBottomPx = Math.max(maxBottomPx, placedBottomPx)
    })

    return computePageCountFromLayoutExtent(maxBottomPx, sheetLayout)
}

/** Page count from plan replay and/or painted DOM extent — whichever needs more pages. */
export function resolveEditorPageCount(options: {
    blocks: VisualPageFlowBlock[]
    plan: VisualPageFlowPlan
    sheetLayout: A4SheetLayout
    blockElements?: HTMLElement[]
    proseMirror?: HTMLElement | null
    layoutRoot?: HTMLElement | null
}): number {
    const planPageCount = computePageCountFromResolvedPlan({
        blocks: options.blocks,
        plan: options.plan,
        sheetLayout: options.sheetLayout,
        blockElements: options.blockElements,
    })

    if (!options.proseMirror || !options.layoutRoot) {
        return planPageCount
    }

    const extentPx = measureVisualContentExtent(options.proseMirror, options.layoutRoot)
    const domPageCount = computePageCountFromLayoutExtent(extentPx, options.sheetLayout)

    return Math.max(planPageCount, domPageCount)
}

/** Page frames to render — aligned to A4 sheet + gap positions in the editor stack. */
export function computePageCountFromVisualExtent(contentBottomPx: number): number {
    if (contentBottomPx <= A4_PAGE_HEIGHT_PX + BODY_OVERFLOW_TOLERANCE_PX) {
        return 1
    }

    const stride = getEditorVisualPageStridePx()
    return Math.max(1, Math.floor(contentBottomPx / stride) + 1)
}

/** Visual distance between the top of consecutive A4 sheets in the editor stack. */
export function getEditorVisualPageStridePx(): number {
    return A4_PAGE_HEIGHT_PX + A4_PAGE_STACK_GAP_PX
}

/**
 * Refine a page-flow plan using virtual layout positions (same rules as the
 * initial planner). Mutates `plan.overflowMarginTopByKey`.
 */
export function refineVisualPageFlowPlan(options: {
    proseMirror: HTMLElement
    plan: VisualPageFlowPlan
    sheetLayout: A4SheetLayout
}): boolean {
    const { proseMirror, plan, sheetLayout } = options

    let changed = false
    let flowY = 0

    const blocks = Array.from(proseMirror.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
    )

    blocks.forEach((block, index) => {
        if (isLegacyAutoPageBreakElement(block)) {
            return
        }

        if (isManualPageBreakElement(block)) {
            const key = `block-${index}`
            const fill = plan.manualFillHeightByKey[key] ?? 0
            const hasContentAfter = blocks
                .slice(index + 1)
                .some(
                    (next) =>
                        next instanceof HTMLElement &&
                        !isLegacyAutoPageBreakElement(next) &&
                        !isManualPageBreakElement(next)
                )
            if (hasContentAfter) {
                flowY += fill
            }
            return
        }

        const key = `block-${index}`
        const blockHeight = measureBlockLayoutHeight(block)
        if (blockHeight <= 0) {
            return
        }

        const layoutTopPx = flowY
        const currentMargin = plan.overflowMarginTopByKey[key] ?? 0
        const flowTarget = resolveBlockFlowTarget(layoutTopPx, blockHeight, sheetLayout)
        let requiredMargin = flowTarget.needsPush
            ? Math.max(0, flowTarget.targetBodyStartPx - layoutTopPx)
            : 0
        if (
            index === 0 &&
            flowTarget.needsPush &&
            flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
        ) {
            requiredMargin = 0
        }

        if (Math.abs(requiredMargin - currentMargin) > 0.5) {
            if (requiredMargin > 0) {
                plan.overflowMarginTopByKey[key] = requiredMargin
            } else {
                delete plan.overflowMarginTopByKey[key]
            }
            changed = true
        }

        if (
            index === 0 &&
            flowTarget.needsPush &&
            flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
        ) {
            flowY = sheetLayout.editorTopPx + blockHeight
        } else {
            flowY = flowTarget.needsPush
                ? flowTarget.targetBodyStartPx + blockHeight
                : layoutTopPx + blockHeight
        }
    })

    return changed
}

/**
 * After decorations paint, push any block that sits in the header/gap/footer
 * band or (if it fits on one page) overflows the bottom mask.
 *
 * Push-only — never shrink/remove margins here. Shrinking caused text to fall
 * back under the page masks (hidden/clipped lines) and oscillate.
 *
 * Mutates `plan`. Caller must re-apply decorations after a change.
 */
export function correctVisualPageFlowPlanFromPaintedGeometry(options: {
    proseMirror: HTMLElement
    layoutRoot: HTMLElement
    plan: VisualPageFlowPlan
    sheetLayout: A4SheetLayout
}): boolean {
    const { proseMirror, layoutRoot, plan, sheetLayout } = options
    const rootTop = layoutRoot.getBoundingClientRect().top

    const blocks = Array.from(proseMirror.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
    )

    for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index]
        if (isLegacyAutoPageBreakElement(block) || isManualPageBreakElement(block)) {
            continue
        }

        const rect = block.getBoundingClientRect()
        if (rect.height <= 0) {
            continue
        }

        const paintedTopPx = rect.top - rootTop
        const paintedBottomPx = rect.bottom - rootTop
        const paintedHeightPx = paintedBottomPx - paintedTopPx
        const key = `block-${index}`
        const currentMargin = plan.overflowMarginTopByKey[key] ?? 0

        const pageIndex = getPageIndexForLayoutY(paintedTopPx, sheetLayout)
        const band = getA4SheetBand(pageIndex, sheetLayout)
        // Hard clip at the footer/padding edge — any overlap must move to the next page.
        const bodyFitLimitPx =
            band.bodyEndPx - bodyBottomClearancePx(sheetLayout, paintedHeightPx)

        const startsInHeaderZone =
            paintedTopPx < band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX &&
            paintedTopPx >= band.pageTopPx - BODY_OVERFLOW_TOLERANCE_PX
        const startsInFooterOrGap = paintedTopPx >= band.bodyEndPx - BODY_OVERFLOW_TOLERANCE_PX
        // Strict: even 1px under the footer mask counts as overflow (half-cut letters).
        const overflowsBody = paintedBottomPx > band.bodyEndPx - 0.5
        const fitsOneBody =
            paintedHeightPx <= sheetLayout.bodyHeightPx + BODY_OVERFLOW_TOLERANCE_PX
        const nearPageBottom =
            paintedTopPx > bodyFitLimitPx - MIN_FLOW_BLOCK_HEIGHT_PX * 2

        const shouldPush =
            startsInHeaderZone ||
            startsInFooterOrGap ||
            (fitsOneBody && overflowsBody) ||
            // Short remnant stuck against the footer — push whole block to page 2.
            (nearPageBottom && overflowsBody && paintedHeightPx <= sheetLayout.bodyHeightPx)

        if (!shouldPush) {
            continue
        }

        let targetPage = pageIndex
        if (
            startsInFooterOrGap ||
            (fitsOneBody && overflowsBody) ||
            (nearPageBottom && overflowsBody)
        ) {
            targetPage = pageIndex + 1
        }
        if (startsInHeaderZone) {
            targetPage = pageIndex
        }

        if (fitsOneBody) {
            while (
                targetPage < 64 &&
                getA4SheetBand(targetPage, sheetLayout).bodyEndPx -
                    getA4SheetBand(targetPage, sheetLayout).bodyStartPx <
                    paintedHeightPx
            ) {
                targetPage += 1
            }
        }

        const targetStartPx = getA4SheetBand(targetPage, sheetLayout).bodyStartPx
        const deltaPx = targetStartPx - paintedTopPx
        // Hysteresis: ignore sub-pixel noise so we don't vibrate.
        if (deltaPx <= 1) {
            continue
        }

        plan.overflowMarginTopByKey[key] = currentMargin + deltaPx
        return true
    }

    return false
}

function measureContentExtentFromDom(proseMirror: HTMLElement): number {
    let maxBottom = 0

    Array.from(proseMirror.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) {
            return
        }

        if (isLegacyAutoPageBreakElement(child)) {
            return
        }

        const top = child.offsetTop - readAppliedFlowMarginTop(child)
        maxBottom = Math.max(maxBottom, top + measureBlockLayoutHeight(child))
    })

    return maxBottom
}

function captureVisualPageFlowPlanFromDom(options: {
    proseMirror: HTMLElement
    maxBodyHeightPx: number
    pageStridePx: number
}): VisualPageFlowPlan {
    const { proseMirror, maxBodyHeightPx, pageStridePx } = options
    const overflowMarginTopByKey: Record<string, number> = {}
    const manualFillHeightByKey: Record<string, number> = {}

    Array.from(proseMirror.children).forEach((child, index) => {
        if (!(child instanceof HTMLElement)) {
            return
        }

        const key = child.getAttribute("data-doc-flow-key") ?? `block-${index}`

        if (isManualPageBreakElement(child)) {
            const fill = Number.parseFloat(child.style.height)
            if (Number.isFinite(fill) && fill > 0) {
                manualFillHeightByKey[key] = fill
            }
            return
        }

        const marginTop = readAppliedFlowMarginTop(child)
        if (marginTop > 0) {
            overflowMarginTopByKey[key] = marginTop
        }
    })

    const extent = measureContentExtentFromDom(proseMirror)

    return {
        overflowMarginTopByKey,
        manualFillHeightByKey,
        lineSpacers: [],
        pageCount: computePageCountFromContentExtent(extent, pageStridePx, maxBodyHeightPx),
    }
}

/**
 * Merge client rects that share the same visual line (similar top).
 */
function mergeClientRectsIntoLines(rects: DOMRect[]): DOMRect[] {
    if (rects.length === 0) {
        return []
    }

    const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left)
    const lines: DOMRect[] = []
    const lineTolerancePx = 4

    for (const rect of sorted) {
        if (rect.height < 1 || rect.width < 1) {
            continue
        }
        const last = lines[lines.length - 1]
        if (last && Math.abs(rect.top - last.top) <= lineTolerancePx) {
            const left = Math.min(last.left, rect.left)
            const right = Math.max(last.right, rect.right)
            const top = Math.min(last.top, rect.top)
            const bottom = Math.max(last.bottom, rect.bottom)
            lines[lines.length - 1] = new DOMRect(left, top, right - left, bottom - top)
        } else {
            lines.push(rect)
        }
    }

    return lines
}

/** Visible line boxes inside a block (text + replaced elements). */
function measureBlockLineBoxes(block: HTMLElement): DOMRect[] {
    const rects: DOMRect[] = []
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)

    let node = walker.nextNode()
    while (node) {
        if (node.textContent && node.textContent.length > 0) {
            const range = document.createRange()
            range.selectNodeContents(node)
            rects.push(...Array.from(range.getClientRects()))
        }
        node = walker.nextNode()
    }

    block
        .querySelectorAll<HTMLElement>("img, br, table, figure, .document-image-float")
        .forEach((el) => {
            const r = el.getBoundingClientRect()
            if (r.height > 0) {
                rects.push(r)
            }
        })

    if (rects.length === 0) {
        const blockRect = block.getBoundingClientRect()
        if (blockRect.height > 0) {
            return [blockRect]
        }
        return []
    }

    return mergeClientRectsIntoLines(rects)
}

/**
 * Find in-flow spacers that jump lines out of footer/gap/header bands onto the
 * next body slot. One spacer per layout pass (re-run picks up the next page).
 */
export function collectVisualPageFlowLineSpacers(options: {
    proseMirror: HTMLElement
    layoutRoot: HTMLElement
    sheetLayout: A4SheetLayout
    posAtCoords: (coords: { left: number; top: number }) => { pos: number } | null
}): Array<{ pos: number; heightPx: number }> {
    const { proseMirror, layoutRoot, sheetLayout, posAtCoords } = options
    const rootTop = layoutRoot.getBoundingClientRect().top
    const spacers: Array<{ pos: number; heightPx: number }> = []
    const usedPositions = new Set<number>()

    Array.from(proseMirror.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) {
            return
        }
        if (isLegacyAutoPageBreakElement(child) || isManualPageBreakElement(child)) {
            return
        }

        // Skip our own spacer widgets if they appear as children somehow.
        if (child.dataset.docPageFlowSpacer === "true") {
            return
        }

        const blockHeight = measureBlockFlowFootprint(child)
        // Short blocks are handled by whole-block margin push.
        if (blockHeight <= sheetLayout.bodyHeightPx + BODY_OVERFLOW_TOLERANCE_PX) {
            return
        }

        const lines = measureBlockLineBoxes(child)
        for (const line of lines) {
            const lineTop = line.top - rootTop
            const lineBottom = line.bottom - rootTop
            const pageIndex = getPageIndexForLayoutY(lineTop, sheetLayout)
            const band = getA4SheetBand(pageIndex, sheetLayout)

            const intersectsNonBody =
                lineBottom > band.bodyEndPx + 0.5 ||
                lineTop >= band.bodyEndPx - 0.5 ||
                lineTop < band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX

            if (!intersectsNonBody) {
                continue
            }

            let snapStartPx: number
            if (
                lineTop < band.bodyStartPx - BODY_OVERFLOW_TOLERANCE_PX &&
                lineTop >= band.pageTopPx - BODY_OVERFLOW_TOLERANCE_PX
            ) {
                // Line sits in the header band — pull it down to this page body.
                snapStartPx = band.bodyStartPx
            } else {
                // Line intersects footer / gap — jump to the next page body.
                snapStartPx = getA4SheetBand(pageIndex + 1, sheetLayout).bodyStartPx
            }

            const spacerPx = snapStartPx - lineTop
            if (spacerPx <= 1) {
                continue
            }

            const hit = posAtCoords({
                left: line.left + Math.min(4, Math.max(1, line.width / 2)),
                top: line.top + Math.min(4, Math.max(1, line.height / 2)),
            })
            if (!hit) {
                continue
            }

            const pos = hit.pos
            if (usedPositions.has(pos)) {
                continue
            }
            usedPositions.add(pos)
            spacers.push({ pos, heightPx: spacerPx })
            // One spacer per tall block per pass — next layout pass continues.
            break
        }
    })

    return spacers
}

export type ApplyEditorVisualPageFlowOptions = {
    proseMirror: HTMLElement
    sheetLayout: A4SheetLayout
    previousPlan?: VisualPageFlowPlan | null
    layoutRoot?: HTMLElement | null
    posAtCoords?:
        | ((coords: { left: number; top: number }) => { pos: number } | null)
        | null
    /** @deprecated No longer used — plans apply in a single pass to avoid flicker. */
    onPlanPass?: (plan: VisualPageFlowPlan) => void
}

export type ApplyEditorVisualPageFlowResult = {
    pageCount: number
    plan: VisualPageFlowPlan
    planChanged: boolean
    flowBlocks: VisualPageFlowBlock[]
    blockElements: HTMLElement[]
}

/**
 * Google Docs-style pagination: content flows across pages visually without
 * mutating the TipTap document. Skips DOM updates when the plan is unchanged.
 *
 * Important: do NOT clear existing page-flow decorations before measuring.
 * Clearing collapses content into the first page for a paint frame (flicker)
 * and makes live DOM tops look like they "fit", which used to cancel pushes.
 * Block heights are margin-independent; the planner uses virtual layout Y.
 */
export function applyEditorVisualPageFlow(
    options: ApplyEditorVisualPageFlowOptions
): ApplyEditorVisualPageFlowResult {
    const {
        proseMirror,
        sheetLayout,
        previousPlan = null,
        layoutRoot = null,
        posAtCoords = null,
    } = options

    // Force a layout read so height measurements are current after paste/edit.
    proseMirror.getBoundingClientRect()
    void proseMirror.offsetHeight

    const plan = buildEditorVisualPageFlowPlan({
        proseMirror,
        sheetLayout,
    })

    if (layoutRoot && posAtCoords) {
        const found = collectVisualPageFlowLineSpacers({
            proseMirror,
            layoutRoot,
            sheetLayout,
            posAtCoords,
        })
        // Accumulate across passes — each paint can only place the next boundary
        // accurately. Dropping prior spacers collapses earlier page breaks.
        const byPos = new Map<number, { pos: number; heightPx: number }>()
        for (const spacer of previousPlan?.lineSpacers ?? []) {
            if (spacer.heightPx > 0.5) {
                byPos.set(spacer.pos, spacer)
            }
        }
        for (const spacer of found) {
            byPos.set(spacer.pos, spacer)
        }
        plan.lineSpacers = Array.from(byPos.values()).sort((a, b) => a.pos - b.pos)
    }

    const flowBlocks = collectFlowBlocks(proseMirror)
    const blockElements = Array.from(proseMirror.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
    )

    plan.pageCount = computePageCountFromResolvedPlan({
        blocks: flowBlocks,
        plan,
        sheetLayout,
        blockElements,
    })

    const planChanged =
        previousPlan === null || !areVisualPageFlowPlansEqual(previousPlan, plan)

    return {
        pageCount: plan.pageCount,
        plan,
        planChanged,
        flowBlocks,
        blockElements,
    }
}
