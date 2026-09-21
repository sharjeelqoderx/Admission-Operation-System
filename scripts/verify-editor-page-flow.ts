import {
    areVisualPageFlowPlansEqual,
    calculateEditorBodyLayoutMetrics,
    computePageCountFromResolvedPlan,
    computeVisualPageFlowPlan,
    getA4SheetBand,
    getEditorVisualPageStridePx,
    resolveA4SheetLayout,
    resolveBlockFlowTarget,
    resolveEditorRegionHeights,
    shouldRunEditorLayoutForTransaction,
} from "../lib/document-template/a4-editor-pagination"
import {
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_PADDING_Y_MM,
    mmToPx,
} from "../lib/document-template/a4-document"
import { DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX } from "../lib/document-template/header-footer"

const verticalPaddingPx = mmToPx(A4_PAGE_PADDING_Y_MM)
const headerContentPx = 52
const footerContentPx = 80
const sheetLayout = resolveA4SheetLayout({
    hasHeader: true,
    hasFooter: true,
    headerHeightPx: headerContentPx,
    footerHeightPx: footerContentPx,
})
const bodyMetrics = calculateEditorBodyLayoutMetrics({
    hasHeader: true,
    hasFooter: true,
    headerHeightPx: headerContentPx,
    footerHeightPx: footerContentPx,
})
const maxBodyHeightPx = sheetLayout.bodyHeightPx
const pageStridePx = sheetLayout.flowStridePx

let passed = 0
let failed = 0

function assert(name: string, condition: boolean) {
    if (condition) {
        console.log("PASS:", name)
        passed += 1
        return
    }

    console.error("FAIL:", name)
    failed += 1
}

// 1. Automatic pagination
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "p1", kind: "content", height: maxBodyHeightPx - 40 },
            { key: "p2", kind: "content", height: 120 },
        ],
        sheetLayout,
    })
    assert("auto pagination creates page 2", plan.pageCount >= 2)
    assert("overflow block gets margin push", (plan.overflowMarginTopByKey.p2 ?? 0) > 0)
}

// 2. Manual page break
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "before", kind: "content", height: 200 },
            { key: "break", kind: "manual-break", height: 0 },
            { key: "after", kind: "content", height: 200 },
        ],
        sheetLayout,
    })
    assert("manual break advances to page 2", plan.pageCount >= 2)
    assert("manual break gets fill height", (plan.manualFillHeightByKey.break ?? 0) > 0)
    assert("content after break is preserved", plan.overflowMarginTopByKey.after === undefined)
}

// 3. Image block moves whole
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "text", kind: "content", height: maxBodyHeightPx - 30 },
            { key: "image", kind: "content", height: 180 },
        ],
        sheetLayout,
    })
    assert("image block moves to next page", (plan.overflowMarginTopByKey.image ?? 0) > 0)
    assert(
        "image block is not split",
        Object.keys(plan.overflowMarginTopByKey).filter((key) => key !== "text").length === 1
    )
}

// 4. Header/footer body slot
{
    assert(
        "body slot leaves room for header/footer",
        maxBodyHeightPx < A4_PAGE_HEIGHT_PX - verticalPaddingPx * 2
    )
}

// 5. Legacy auto breaks ignored
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "p1", kind: "content", height: 100 },
            { key: "legacy", kind: "legacy-auto-break", height: 0 },
            { key: "p2", kind: "content", height: 100 },
        ],
        sheetLayout,
    })
    assert("legacy auto break ignored", plan.manualFillHeightByKey.legacy === undefined)
}

// 6. Selection-only transactions must not trigger layout
{
    assert(
        "selection-only update skips layout",
        shouldRunEditorLayoutForTransaction({
            docChanged: false,
            getMeta: () => undefined,
        }) === false
    )
    assert(
        "content update triggers layout",
        shouldRunEditorLayoutForTransaction({
            docChanged: true,
            getMeta: () => undefined,
        }) === true
    )
}

// 7. Identical plans are detected (stable page count on focus)
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "p1", kind: "content", height: 200 },
            { key: "p2", kind: "content", height: 200 },
        ],
        sheetLayout,
    })
    assert("identical plans compare equal", areVisualPageFlowPlansEqual(plan, { ...plan }))
}

// 8. Enter on last body line — next block must clear footer band
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "fill", kind: "content", height: maxBodyHeightPx - 12 },
            { key: "next-line", kind: "content", height: 24 },
        ],
        sheetLayout,
    })
    const nextLineMargin = plan.overflowMarginTopByKey["next-line"] ?? 0
    const gapToPageTwoBody = pageStridePx - maxBodyHeightPx
    assert("next line after full page gets pushed", nextLineMargin > 0)
    assert("next line starts on page 2", plan.pageCount >= 2)
    assert(
        "next line margin is not double-pushed past page 2 body",
        nextLineMargin < gapToPageTwoBody + 48
    )
    assert(
        "resolved plan count includes overflow margin",
        computePageCountFromResolvedPlan({
            blocks: [
                { key: "fill", kind: "content", height: maxBodyHeightPx - 12 },
                { key: "next-line", kind: "content", height: 24 },
            ],
            plan,
            sheetLayout,
        }) >= 2
    )
}

// 9. Exact page fill — following block snaps past footer/header gap
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "p1", kind: "content", height: maxBodyHeightPx },
            { key: "p2", kind: "content", height: 24 },
        ],
        sheetLayout,
    })
    const gapToPageTwoBody = pageStridePx - maxBodyHeightPx
    assert(
        "block after exact fill clears footer gap",
        (plan.overflowMarginTopByKey.p2 ?? 0) >= gapToPageTwoBody - 2
    )
}

// 10. Body slot formula reserves header + footer + margins + header gap
{
    assert(
        "region heights use minimum fallbacks",
        resolveEditorRegionHeights({
            hasHeader: true,
            hasFooter: true,
            headerHeightPx: 0,
            footerHeightPx: 0,
        }).footerHeightPx > 0
    )
    assert(
        "available body height excludes header/footer/gap",
        bodyMetrics.maxBodyHeightPx ===
            A4_PAGE_HEIGHT_PX -
                verticalPaddingPx * 2 -
                headerContentPx -
                footerContentPx -
                DOCUMENT_TEMPLATE_HEADER_BODY_GAP_PX
    )
    assert(
        "page stride spans full sheet plus stack gap",
        Math.abs(pageStridePx - getEditorVisualPageStridePx()) < 1
    )
}

// 10b. A4 sheet bands — header/body/footer zones per page
{
    const page0 = getA4SheetBand(0, sheetLayout)
    const page1 = getA4SheetBand(1, sheetLayout)

    assert(
        "body height equals band between header and footer",
        Math.abs(page0.bodyEndPx - page0.bodyStartPx - sheetLayout.bodyHeightPx) < 1
    )
    assert(
        "footer aligns to sheet bottom",
        Math.abs(page0.pageBottomPx - A4_PAGE_HEIGHT_PX) < 1
    )
    assert(
        "page 2 starts after sheet plus gap",
        Math.abs(page1.pageTopPx - (A4_PAGE_HEIGHT_PX + sheetLayout.pageGapPx)) < 1
    )
    assert(
        "flow stride matches visual sheet stride",
        Math.abs(sheetLayout.flowStridePx - sheetLayout.visualStridePx) < 1
    )

    const enterNearFooter = resolveBlockFlowTarget(page0.bodyEndPx - 8, 24, sheetLayout)
    assert("enter near footer needs page break", enterNearFooter.needsPush)
    assert("enter near footer targets page 2", enterNearFooter.pageIndex === 1)
    assert(
        "enter lands at page 2 body start below header",
        Math.abs(enterNearFooter.targetBodyStartPx - page1.bodyStartPx) < 1
    )
}

// 10c. Second Enter on page 2 — normal line spacing, no extra page-break margin
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "fill", kind: "content", height: maxBodyHeightPx - 12 },
            { key: "p2-line-1", kind: "content", height: 24 },
            { key: "p2-line-2", kind: "content", height: 24 },
        ],
        sheetLayout,
    })
    assert("first page-2 line gets break margin", (plan.overflowMarginTopByKey["p2-line-1"] ?? 0) > 0)
    assert(
        "second page-2 line has no break margin",
        plan.overflowMarginTopByKey["p2-line-2"] === undefined
    )
    assert("two lines on page 2 stay on two pages", plan.pageCount === 2)
}

// 11. Trailing manual page break must not create a blank page
{
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "only", kind: "content", height: 200 },
            { key: "trail-break", kind: "manual-break", height: 0 },
        ],
        sheetLayout,
    })
    assert("trailing manual break keeps single page", plan.pageCount === 1)
}

// 12. Tall unsplit block must not create a trailing blank page
{
    const plan = computeVisualPageFlowPlan({
        blocks: [{ key: "tall", kind: "content", height: maxBodyHeightPx + 120 }],
        sheetLayout,
    })
    assert("tall block stays on one rendered page", plan.pageCount === 1)
}

// 13. Empty document stays on one page
{
    const plan = computeVisualPageFlowPlan({
        blocks: [],
        sheetLayout,
    })
    assert("empty blocks still render one page", plan.pageCount === 1)
}

// 14. Header/footer alone must not create extra pages
{
    const headerOnlyLayout = resolveA4SheetLayout({
        hasHeader: true,
        hasFooter: false,
        headerHeightPx: headerContentPx,
        footerHeightPx: 0,
    })
    const footerOnlyLayout = resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: true,
        headerHeightPx: 0,
        footerHeightPx: footerContentPx,
    })

    const headerOnlyPlan = computeVisualPageFlowPlan({
        blocks: [{ key: "p", kind: "content", height: 24 }],
        sheetLayout: headerOnlyLayout,
    })
    const footerOnlyPlan = computeVisualPageFlowPlan({
        blocks: [{ key: "p", kind: "content", height: 24 }],
        sheetLayout: footerOnlyLayout,
    })

    assert("header alone keeps one page", headerOnlyPlan.pageCount === 1)
    assert("footer alone keeps one page", footerOnlyPlan.pageCount === 1)
}

// 15. Minimal body with header and footer enabled
{
    const plan = computeVisualPageFlowPlan({
        blocks: [{ key: "p", kind: "content", height: 24 }],
        sheetLayout,
    })
    assert("minimal body with header/footer stays one page", plan.pageCount === 1)
    assert(
        "first block uses editor top padding not break margin",
        plan.overflowMarginTopByKey["p"] === undefined
    )
}

// 15b. Page 2+ first line uses the same top offset as page 1
{
    const plainLayout = resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: false,
        headerHeightPx: 0,
        footerHeightPx: 0,
    })
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "fill", kind: "content", height: plainLayout.bodyHeightPx - 12 },
            { key: "page-two", kind: "content", height: 24 },
        ],
        sheetLayout: plainLayout,
    })
    const pageTwoBand = getA4SheetBand(1, plainLayout)
    const pageTwoMargin = plan.overflowMarginTopByKey["page-two"] ?? 0
    const pageOneTopOffset = plainLayout.editorTopPx
    const pageTwoTopOffset = pageTwoBand.bodyStartPx - pageTwoBand.pageTopPx

    assert(
        "page 1 and page 2 share the same body top offset",
        Math.abs(pageOneTopOffset - pageTwoTopOffset) < 1
    )
    assert(
        "page 2 line lands at the same offset from its sheet top",
        Math.abs(pageTwoMargin - (pageTwoBand.bodyStartPx - (plainLayout.editorTopPx + plainLayout.bodyHeightPx - 12))) < 48
    )
}

function assertMultiPageLayout(
    name: string,
    layout: ReturnType<typeof resolveA4SheetLayout>
) {
    const plan = computeVisualPageFlowPlan({
        blocks: [
            { key: "fill", kind: "content", height: layout.bodyHeightPx - 12 },
            { key: "p2-line-1", kind: "content", height: 24 },
            { key: "p2-line-2", kind: "content", height: 24 },
        ],
        sheetLayout: layout,
    })

    assert(`${name} overflow creates page 2`, plan.pageCount >= 2)
    assert(`${name} first page-2 line pushed`, (plan.overflowMarginTopByKey["p2-line-1"] ?? 0) > 0)
    assert(
        `${name} second page-2 line has normal spacing`,
        plan.overflowMarginTopByKey["p2-line-2"] === undefined
    )
    assert(
        `${name} resolved plan page count`,
        computePageCountFromResolvedPlan({
            blocks: [
                { key: "fill", kind: "content", height: layout.bodyHeightPx - 12 },
                { key: "p2-line-1", kind: "content", height: 24 },
                { key: "p2-line-2", kind: "content", height: 24 },
            ],
            plan,
            sheetLayout: layout,
        }) >= 2
    )
}

// 16. Multi-page with header + footer
assertMultiPageLayout("header+footer", sheetLayout)

// 17. Multi-page with header only
assertMultiPageLayout(
    "header only",
    resolveA4SheetLayout({
        hasHeader: true,
        hasFooter: false,
        headerHeightPx: headerContentPx,
        footerHeightPx: 0,
    })
)

// 18. Multi-page with footer only
assertMultiPageLayout(
    "footer only",
    resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: true,
        headerHeightPx: 0,
        footerHeightPx: footerContentPx,
    })
)

// 19. Multi-page with neither header nor footer
assertMultiPageLayout(
    "plain",
    resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: false,
        headerHeightPx: 0,
        footerHeightPx: 0,
    })
)

// 20. Empty paragraphs between headings must not trigger early page breaks
{
    const plainLayout = resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: false,
        headerHeightPx: 0,
        footerHeightPx: 0,
    })
    const lineHeightPx = 46
    const blocks: Array<{ key: string; kind: "content"; height: number }> = []

    for (let index = 0; index < 18; index += 1) {
        blocks.push({ key: `h-${index}`, kind: "content", height: lineHeightPx })
        blocks.push({ key: `p-${index}`, kind: "content", height: 0 })
    }

    const plan = computeVisualPageFlowPlan({
        blocks,
        sheetLayout: plainLayout,
    })

    assert("headings with empty paragraphs stay on one page", plan.pageCount === 1)
}

// 20b. Page-2 break margin uses DOM top so sheet body offset matches page 1
{
    const plainLayout = resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: false,
        headerHeightPx: 0,
        footerHeightPx: 0,
    })
    const lineHeightPx = 46
    const linesThatFitPage1 = Math.floor(
        (plainLayout.bodyHeightPx - 1) / lineHeightPx
    )
    const blocks: Array<{ key: string; kind: "content"; height: number }> = []

    for (let index = 0; index < linesThatFitPage1 + 1; index += 1) {
        blocks.push({ key: `line-${index}`, kind: "content", height: lineHeightPx })
    }

    const plan = computeVisualPageFlowPlan({
        blocks,
        sheetLayout: plainLayout,
    })
    const pageTwoBand = getA4SheetBand(1, plainLayout)
    const pageTwoFirstKey = `line-${linesThatFitPage1}`
    const pageTwoMargin = plan.overflowMarginTopByKey[pageTwoFirstKey] ?? 0
    const pageOneTopOffset = plainLayout.editorTopPx
    const pageTwoTopOffset = pageTwoBand.bodyStartPx - pageTwoBand.pageTopPx
    const domTopBeforeBreak =
        plainLayout.editorTopPx + linesThatFitPage1 * lineHeightPx

    assert("page 2 first line gets overflow margin", pageTwoMargin > 0)
    assert(
        "page 2 margin lands at same body offset as page 1",
        Math.abs(pageOneTopOffset - pageTwoTopOffset) < 1
    )
    assert(
        "page 2 margin is based on DOM top before break",
        Math.abs(pageTwoMargin - (pageTwoBand.bodyStartPx - domTopBeforeBreak)) < 1
    )
}

// 21. Mixed headings and paragraphs share one page body slot
{
    const plainLayout = resolveA4SheetLayout({
        hasHeader: false,
        hasFooter: false,
        headerHeightPx: 0,
        footerHeightPx: 0,
    })
    const blocks: Array<{ key: string; kind: "content"; height: number }> = []

    for (let index = 0; index < 10; index += 1) {
        blocks.push({ key: `h-${index}`, kind: "content", height: 46 })
        blocks.push({ key: `p-${index}`, kind: "content", height: 28 })
        blocks.push({ key: `gap-${index}`, kind: "content", height: 0 })
    }

    const plan = computeVisualPageFlowPlan({
        blocks,
        sheetLayout: plainLayout,
    })

    assert("mixed headings and paragraphs stay on one page", plan.pageCount === 1)
}

console.log("")
console.log(`Results: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
