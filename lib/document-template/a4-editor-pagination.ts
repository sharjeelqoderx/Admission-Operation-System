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
    pageCount: number
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
        return { overflowMarginTopByKey, manualFillHeightByKey, pageCount: 1 }
    }

    let flowY = 0
    let maxContentBottomPx = 0

    blocks.forEach((block, blockIndex) => {
        if (block.kind === "legacy-auto-break") {
            return
        }

        if (block.kind === "manual-break") {
            const pageIndex = getPageIndexForLayoutY(flowY, sheetLayout)
            const nextBodyStart = getA4SheetBand(pageIndex + 1, sheetLayout).bodyStartPx
            manualFillHeightByKey[block.key] = Math.max(0, nextBodyStart - flowY)
            const hasContentAfter = blocks
                .slice(blockIndex + 1)
                .some(
                    (next) =>
                        next.kind !== "legacy-auto-break" &&
                        (next.kind !== "content" || next.height > 0)
                )
            if (hasContentAfter) {
                flowY = nextBodyStart
            }
            maxContentBottomPx = Math.max(maxContentBottomPx, flowY)
            return
        }

        const blockHeight = block.height

        if (blockHeight <= 0) {
            return
        }

        // Virtual layout Y decides breaks and margins. Do not use live DOM offsetTop:
        // after a paste, natural DOM tops are packed at the top of the sheet and would
        // cancel real page pushes (text then paints through the gap and looks sliced).
        const layoutTopPx = flowY
        const flowTarget = resolveBlockFlowTarget(layoutTopPx, blockHeight, sheetLayout)
        let marginTop = 0

        if (flowTarget.needsPush) {
            marginTop = Math.max(0, flowTarget.targetBodyStartPx - layoutTopPx)
            // Top body inset is applied via editor paddingTop — not decoration margin.
            if (
                blockIndex === 0 &&
                flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
            ) {
                marginTop = 0
            }
            // Never invent more than one page-jump of space (prevents huge empty holes).
            marginTop = Math.min(
                marginTop,
                sheetLayout.visualStridePx + sheetLayout.editorTopPx
            )
        }

        if (marginTop > 0.5) {
            overflowMarginTopByKey[block.key] = marginTop
        }

        let placedTopPx = flowTarget.needsPush ? flowTarget.targetBodyStartPx : layoutTopPx
        if (
            blockIndex === 0 &&
            flowTarget.needsPush &&
            flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
        ) {
            placedTopPx = sheetLayout.editorTopPx
        }
        let placedBottomPx = placedTopPx + blockHeight

        // Correct under-measured blocks (e.g. signature/stamp tables) that still overflow the body slot.
        const placedPageIndex = getPageIndexForLayoutY(placedTopPx, sheetLayout)
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
            marginTop = Math.max(marginTop, targetStart - layoutTopPx)
            if (marginTop > 0) {
                overflowMarginTopByKey[block.key] = marginTop
            } else {
                delete overflowMarginTopByKey[block.key]
            }
            placedTopPx = targetStart
            placedBottomPx = targetStart + blockHeight
        }

        flowY = placedBottomPx
        maxContentBottomPx = Math.max(maxContentBottomPx, placedBottomPx)
    })

    return {
        overflowMarginTopByKey,
        manualFillHeightByKey,
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
        return { overflowMarginTopByKey: {}, manualFillHeightByKey: {}, pageCount: 1 }
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

    let flowY = 0
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
                flowY += fill
            }
            maxBottomPx = Math.max(maxBottomPx, flowY)
            return
        }

        if (block.height <= 0) {
            return
        }

        const layoutTopPx = flowY
        const marginTop = plan.overflowMarginTopByKey[block.key] ?? 0

        let placedTopPx = layoutTopPx
        if (marginTop > 0) {
            placedTopPx = layoutTopPx + marginTop
        } else {
            const flowTarget = resolveBlockFlowTarget(layoutTopPx, block.height, sheetLayout)
            placedTopPx = flowTarget.needsPush ? flowTarget.targetBodyStartPx : layoutTopPx
            if (
                blockIndex === 0 &&
                flowTarget.needsPush &&
                flowTarget.targetBodyStartPx === sheetLayout.editorTopPx
            ) {
                placedTopPx = sheetLayout.editorTopPx
            }
        }

        let placedBottomPx = placedTopPx + block.height

        const placedPageIndex = getPageIndexForLayoutY(placedTopPx, sheetLayout)
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

            placedBottomPx = getA4SheetBand(targetPage, sheetLayout).bodyStartPx + block.height
        }

        flowY = placedBottomPx
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
        pageCount: computePageCountFromContentExtent(extent, pageStridePx, maxBodyHeightPx),
    }
}

export type ApplyEditorVisualPageFlowOptions = {
    proseMirror: HTMLElement
    sheetLayout: A4SheetLayout
    previousPlan?: VisualPageFlowPlan | null
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
    const { proseMirror, sheetLayout, previousPlan = null } = options

    // Force a layout read so height measurements are current after paste/edit.
    proseMirror.getBoundingClientRect()
    void proseMirror.offsetHeight

    const plan = buildEditorVisualPageFlowPlan({
        proseMirror,
        sheetLayout,
    })

    for (let iteration = 0; iteration < 4; iteration += 1) {
        if (!refineVisualPageFlowPlan({ proseMirror, plan, sheetLayout })) {
            break
        }
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
