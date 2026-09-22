"use client"

/**
 * Unified document template editor — TipTap body, A4 pagination, header/footer/assets sheets.
 * Edit page entry: DocumentEditorPage
 */

import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    type ReactNode,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style"
import ImageResize from "tiptap-extension-resize-image"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    AlignVerticalJustifyStart,
    ArrowLeft,
    Bold,
    Braces,
    Columns3,
    Droplets,
    FolderOpen,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    ImagePlus,
    Italic,
    Link2,
    List,
    ListOrdered,
    Loader2,
    Minus,
    Palette,
    PanelBottom,
    PanelTop,
    Pilcrow,
    Plus,
    Redo2,
    RotateCw,
    Save,
    Search,
    SeparatorHorizontal,
    Settings2,
    Strikethrough,
    Table2,
    Type,
    UnderlineIcon,
    Undo2,
} from "lucide-react"
import { toast } from "sonner"
import { Typography } from "@/components/shared/Typography"
import { DetailPageSkeleton } from "@/components/shared/page-skeleton"
import { ErrorView } from "@/components/shared/error-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_MULTI_PAGE_STACK_CLASS,
    A4_DOCUMENT_PAGE_SHELL_CLASS,
    A4_PAGE_HEIGHT_PX,
    A4_PAGE_STACK_GAP_PX,
    A4_PAGE_PADDING_X_MM,
    A4_PAGE_PADDING_Y_MM,
    A4_PAGE_WIDTH_MM,
    DEFAULT_CENTER_LOGO_WIDTH,
    DEFAULT_TEMPLATE_BODY_HTML,
    DOCUMENT_IMAGE_CLASS,
    DOCUMENT_LOGO_LINE_CLASS,
    buildDocumentHeadingBlock,
    buildHeaderImageBlock,
    buildImageHtml,
    buildLogoImageHtml,
    buildLogoLineBlock,
    DOCUMENT_LOGO_CLASS,
    mmToPx,
    stripAutoPageBreakMarkers,
} from "@/lib/document-template/a4-document"
import {
    applyEditorVisualPageFlow,
    correctVisualPageFlowPlanFromPaintedGeometry,
    DOCUMENT_TEMPLATE_LAYOUT_TRANSACTION_META,
    getA4SheetBand,
    isDocumentTemplateLayoutSyncActive,
    isDocumentTemplateLayoutTransaction,
    measureDocumentTemplateRegionContentHeight,
    measureVisualContentExtent,
    resolveA4SheetLayout,
    resolveEditorPageCount,
    shouldRunEditorLayoutForTransaction,
    type A4SheetLayout,
    type VisualPageFlowPlan,
} from "@/lib/document-template/a4-editor-pagination"
import { DOCUMENT_PAGE_FLOW_META } from "@/lib/document-template/tiptap-document-page-flow"
import { calculateA4StackHeightPx } from "@/lib/document-template/a4-pagination"
import {
    fetchDocumentTemplate,
    fetchDocumentTemplateProgramOptions,
} from "@/lib/document-template/client"
import { ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE } from "@/lib/document-template/checklist-items"
import {
    TEMPLATE_DATE_INSERT_OPTIONS,
    EMPTY_DOCUMENT_TEMPLATE_DATES,
    getTemplateDateInsertOptionById,
    getTemplateDateInsertOptionLabel,
    type DocumentTemplateDates,
} from "@/lib/document-template/date-variables"
import {
    buildFooterHtml,
    buildHeaderHtml,
    composeDocumentLayout,
    DEFAULT_FOOTER_FIELDS,
    DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES,
    getDefaultHeaderFields,
    parseDocumentLayout,
    parseFooterHtml,
    parseHeaderHtml,
    type DocumentTemplateFooterFields,
    type DocumentTemplateHeaderFields,
} from "@/lib/document-template/header-footer"
import { isDefaultHeaderContactText, TEMPLATE_LOCALE_OPTIONS } from "@/lib/document-template/locale"
import { DocumentPageBreak } from "@/lib/document-template/tiptap-document-page-break"
import { DocumentPageFlow } from "@/lib/document-template/tiptap-document-page-flow"
import { DocumentHeading } from "@/lib/document-template/tiptap-document-heading"
import { DocumentParagraph } from "@/lib/document-template/tiptap-document-paragraph"
import {
    DOCUMENT_TEMPLATE_FONT_SIZE_STEP,
    clampDocumentTemplateFontSizePx,
    formatDocumentTemplateFontSizePx,
    getDocumentTemplateFontSizeOptions,
    parseDocumentTemplateFontSizePx,
} from "@/lib/document-template/tiptap-document-font-size"
import {
    DEFAULT_DOCUMENT_TEMPLATE_WATERMARK,
    EMPTY_DOCUMENT_TEMPLATE_WATERMARK,
    isWatermarkVisible,
    resolveWatermarkImageSrc,
    type DocumentTemplateWatermark,
    type DocumentTemplateWatermarkPosition,
} from "@/lib/document-template/watermark"
import {
    DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY,
    DOCUMENT_TEMPLATES_QUERY_KEY,
    documentTemplateQueryKey,
    syncTemplateProgramsInOptionsCache,
    upsertDocumentTemplateInCache,
} from "@/lib/document-template/query-cache"
import {
    TEMPLATE_DYNAMIC_SECTIONS,
    TEMPLATE_GREETING_VARIABLES,
    TEMPLATE_MERGE_VARIABLES,
} from "@/lib/document-template/variables"
import type {
    DocumentTemplateAsset,
    DocumentTemplateDetailResponse,
    DocumentTemplateListItem,
    DocumentTemplatesListResponse,
    TemplateLocale,
} from "@/types/schemas/document-template"
import { DocumentTemplateDetailError } from "./document-template-detail-error"
import { DocumentPageWatermark } from "./document-center-logo-placeholder"
import { DocumentTemplateAttachedPrograms } from "./document-template-attached-programs"
import { DocumentTemplateProgramSelect } from "./document-template-program-select"
import { cn } from "@/lib/utils"

// ─── Assets API ─────────────────────────────────────────────────────────────

export const DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY = ["document-template-assets"] as const

/** Editor panels (sheets) sit above toolbar, page chrome, and canvas overlays. */
const EDITOR_SHEET_OVERLAY_CLASS = "z-[100]"
const EDITOR_SHEET_CONTENT_CLASS = "z-[100]"

type AssetIntent = "header" | "header-logo" | "inline" | "logo" | "watermark"

async function fetchAssets(): Promise<DocumentTemplateAsset[]> {
    const res = await fetch("/api/document-template/assets")
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json?.error ?? "Failed to load assets")
    return json.data
}

async function uploadAsset(file: File): Promise<DocumentTemplateAsset> {
    const form = new FormData()
    form.set("file", file)
    const res = await fetch("/api/document-template/assets", { method: "POST", body: form })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json?.error ?? "Upload failed")
    return json.data
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTemplateCourseIds(t: DocumentTemplateListItem): string[] {
    if (t.course_ids?.length) return t.course_ids
    if (t.program_id) return [t.program_id]
    return []
}

function IconBtn({
    label,
    onClick,
    active,
    disabled,
    children,
}: {
    label: string
    onClick: () => void
    active?: boolean
    disabled?: boolean
    children: ReactNode
}) {
    return (
        <Button
            type="button"
            variant={active ? "default" : "ghost"}
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}

const TEXT_COLORS = ["#111827", "#2563eb", "#dc2626", "#059669", "#6b7280", "#7c3aed", "#d97706"]

const FOOTER_COLS = [
    { key: "column1" as const, de: "Adresse", en: "Address" },
    { key: "column2" as const, de: "Kontakt", en: "Contact" },
    { key: "column3" as const, de: "Geschäftsführung", en: "Management" },
    { key: "column4" as const, de: "Register", en: "Legal" },
]

// ─── Fixed A4 page shell — header zone → body slot → footer zone (297mm total) ─

const A4EditorPageShell = memo(function A4EditorPageShell({
    sheetLayout,
    watermark,
}: {
    sheetLayout: A4SheetLayout
    watermark: DocumentTemplateWatermark
}) {
    const {
        headerZonePx,
        footerZonePx,
        verticalPaddingPx,
        bodyHeightPx,
        hasHeader,
        hasFooter,
    } = sheetLayout

    const topReservePx = hasHeader ? headerZonePx : verticalPaddingPx
    const bottomReservePx = hasFooter ? footerZonePx : verticalPaddingPx

    return (
        <div
            className={cn(A4_DOCUMENT_PAGE_SHELL_CLASS, "relative flex flex-col overflow-hidden shadow-md")}
            style={{ height: A4_PAGE_HEIGHT_PX }}
        >
            <DocumentPageWatermark watermark={watermark} />
            <div className="shrink-0 bg-white" style={{ height: topReservePx }} aria-hidden />
            <div
                className="relative min-h-0 shrink-0 bg-white"
                style={{ height: bodyHeightPx }}
                aria-hidden
            />
            <div className="mt-auto shrink-0 bg-white" style={{ height: bottomReservePx }} aria-hidden />
        </div>
    )
})

// ─── Paginated canvas ─────────────────────────────────────────────────────────

const EditorCanvas = memo(function EditorCanvas({
    editor,
    hasHeader,
    hasFooter,
    headerHtml,
    footerHtml,
    watermark,
    children,
}: {
    editor: Editor | null
    hasHeader: boolean
    hasFooter: boolean
    headerHtml: string
    footerHtml: string
    watermark: DocumentTemplateWatermark
    children: ReactNode
}) {
    const editorRef = useRef<HTMLDivElement>(null)
    const layoutRootRef = useRef<HTMLDivElement>(null)
    const headerMeasureRef = useRef<HTMLDivElement>(null)
    const footerMeasureRef = useRef<HTMLDivElement>(null)
    const layoutRef = useRef({
        pageCount: 1,
        stackHeightPx: A4_PAGE_HEIGHT_PX,
        editorHeightPx: A4_PAGE_HEIGHT_PX,
        sheetLayout: resolveA4SheetLayout({
            hasHeader,
            hasFooter,
            headerHeightPx: 0,
            footerHeightPx: 0,
        }),
    })
    const lastPlanRef = useRef<VisualPageFlowPlan | null>(null)
    const isLayoutingRef = useRef(false)
    const layoutQuietUntilRef = useRef(0)
    const layoutFrameRef = useRef<number | null>(null)
    const layoutDebounceRef = useRef<number | null>(null)
    const [, bump] = useReducer((n: number) => n + 1, 0)

    const padX = mmToPx(A4_PAGE_PADDING_X_MM)
    const pageW = mmToPx(A4_PAGE_WIDTH_MM)
    const bodyW = pageW - padX * 2

    const applyMetrics = useCallback(
        (opts: { pageCount: number; sheetLayout: A4SheetLayout; editorHeightPx?: number }) => {
            const stack = calculateA4StackHeightPx(opts.pageCount)
            const editorHeightPx = Math.max(stack, opts.editorHeightPx ?? stack)
            const c = layoutRef.current
            if (
                c.pageCount === opts.pageCount &&
                c.stackHeightPx === stack &&
                c.editorHeightPx === editorHeightPx &&
                c.sheetLayout.flowStridePx === opts.sheetLayout.flowStridePx &&
                c.sheetLayout.bodyHeightPx === opts.sheetLayout.bodyHeightPx &&
                c.sheetLayout.headerZonePx === opts.sheetLayout.headerZonePx &&
                c.sheetLayout.footerZonePx === opts.sheetLayout.footerZonePx
            ) {
                return
            }
            layoutRef.current = {
                pageCount: opts.pageCount,
                stackHeightPx: stack,
                editorHeightPx,
                sheetLayout: opts.sheetLayout,
            }
            bump()
        },
        []
    )

    const runLayout = useCallback(() => {
        if (isLayoutingRef.current) return
        isLayoutingRef.current = true
        try {
            const sheetLayout = resolveA4SheetLayout({
                hasHeader,
                hasFooter,
                headerHeightPx: hasHeader
                    ? measureDocumentTemplateRegionContentHeight(headerMeasureRef.current)
                    : 0,
                footerHeightPx: hasFooter
                    ? measureDocumentTemplateRegionContentHeight(footerMeasureRef.current)
                    : 0,
            })

            const pm = editorRef.current?.querySelector<HTMLElement>(".ProseMirror")
            if (!pm) {
                applyMetrics({ pageCount: 1, sheetLayout })
                return
            }

            const layoutRoot = layoutRootRef.current
            const result =
                sheetLayout.bodyHeightPx > 0 && layoutRoot
                    ? applyEditorVisualPageFlow({
                          proseMirror: pm,
                          sheetLayout,
                          previousPlan: lastPlanRef.current,
                      })
                    : {
                          pageCount: 1,
                          plan: lastPlanRef.current ?? {
                              overflowMarginTopByKey: {},
                              manualFillHeightByKey: {},
                              pageCount: 1,
                          },
                          planChanged: false,
                          flowBlocks: [],
                          blockElements: [],
                      }

            const dispatchPlan = (plan: VisualPageFlowPlan) => {
                if (!editor) return
                editor.view.dispatch(
                    editor.state.tr
                        .setMeta(DOCUMENT_PAGE_FLOW_META, plan)
                        .setMeta(DOCUMENT_TEMPLATE_LAYOUT_TRANSACTION_META, true)
                )
            }

            if (editor && result.planChanged) {
                dispatchPlan(result.plan)
            }

            // Paint-correct: push-only passes (no margin shrink — that hid text again).
            if (editor && pm && layoutRoot && sheetLayout.bodyHeightPx > 0) {
                for (let pass = 0; pass < 4; pass += 1) {
                    pm.getBoundingClientRect()
                    void pm.offsetHeight
                    if (
                        !correctVisualPageFlowPlanFromPaintedGeometry({
                            proseMirror: pm,
                            layoutRoot,
                            plan: result.plan,
                            sheetLayout,
                        })
                    ) {
                        break
                    }
                    dispatchPlan(result.plan)
                    result.planChanged = true
                }
            }

            lastPlanRef.current = result.plan

            const syncLayoutMetrics = () => {
                if (!pm || !layoutRoot) {
                    applyMetrics({ pageCount: result.pageCount, sheetLayout })
                    return
                }

                const pageCount = resolveEditorPageCount({
                    blocks: result.flowBlocks,
                    plan: result.plan,
                    sheetLayout,
                    blockElements: result.blockElements,
                    proseMirror: pm,
                    layoutRoot,
                })
                const contentExtentPx = measureVisualContentExtent(pm, layoutRoot)
                const stackHeightPx = calculateA4StackHeightPx(pageCount)

                applyMetrics({
                    pageCount,
                    sheetLayout,
                    editorHeightPx: Math.max(stackHeightPx, Math.ceil(contentExtentPx)),
                })
            }

            syncLayoutMetrics()
        } finally {
            // Keep ResizeObserver quiet until after paint settles — otherwise
            // decoration height changes re-enter layout and the page vibrates.
            layoutQuietUntilRef.current = performance.now() + 120
            isLayoutingRef.current = false
        }
    }, [applyMetrics, editor, hasFooter, hasHeader])

    const schedule = useCallback(
        (urgent = false) => {
            const run = () => {
                if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current)
                layoutFrameRef.current = requestAnimationFrame(() => {
                    layoutFrameRef.current = null
                    runLayout()
                })
            }

            if (urgent) {
                if (layoutDebounceRef.current) {
                    window.clearTimeout(layoutDebounceRef.current)
                    layoutDebounceRef.current = null
                }
                if (layoutFrameRef.current) {
                    cancelAnimationFrame(layoutFrameRef.current)
                }
                layoutFrameRef.current = requestAnimationFrame(() => {
                    layoutFrameRef.current = null
                    runLayout()
                })
                return
            }

            if (layoutDebounceRef.current) {
                window.clearTimeout(layoutDebounceRef.current)
            }
            layoutDebounceRef.current = window.setTimeout(() => {
                layoutDebounceRef.current = null
                run()
            }, 48)
        },
        [runLayout]
    )

    useLayoutEffect(() => {
        lastPlanRef.current = null
        schedule(true)
        const obs = new ResizeObserver(() => {
            if (isLayoutingRef.current) return
            if (performance.now() < layoutQuietUntilRef.current) return
            schedule()
        })
        ;[headerMeasureRef.current, footerMeasureRef.current].forEach((el) => el && obs.observe(el))
        const pm = editorRef.current?.querySelector<HTMLElement>(".ProseMirror")
        if (pm) {
            obs.observe(pm)
        }
        return () => {
            if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current)
            if (layoutDebounceRef.current) window.clearTimeout(layoutDebounceRef.current)
            obs.disconnect()
        }
    }, [editor, footerHtml, hasFooter, hasHeader, headerHtml, schedule])

    useEffect(() => {
        if (!editor) return
        const onCreate = () => schedule()
        const onUpdate = ({ transaction }: { transaction: { docChanged?: boolean; getMeta: (k: string) => unknown } }) => {
            if (shouldRunEditorLayoutForTransaction(transaction)) schedule(true)
        }
        editor.on("create", onCreate)
        editor.on("update", onUpdate)
        return () => {
            editor.off("create", onCreate)
            editor.off("update", onUpdate)
        }
    }, [editor, schedule])

    const { pageCount, stackHeightPx, editorHeightPx, sheetLayout } = layoutRef.current

    useEffect(() => {
        const pm = editorRef.current?.querySelector<HTMLElement>(".ProseMirror")
        if (!pm) return
        const onLoad = () => schedule(true)
        pm.querySelectorAll("img").forEach((img) => {
            if (!img.complete) img.addEventListener("load", onLoad, { once: true })
        })
    }, [editor, schedule, editorHeightPx, pageCount, stackHeightPx])
    return (
        <div className="relative z-0 isolate flex justify-center bg-[#eef1f5] py-8 px-4">
            <div ref={layoutRootRef} className="relative mx-auto" style={{ width: pageW, maxWidth: "100%" }}>
                {hasHeader ? (
                    <div
                        ref={headerMeasureRef}
                        className={cn("pointer-events-none absolute -left-[10000px] opacity-0", DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES)}
                        style={{ width: bodyW }}
                        dangerouslySetInnerHTML={{ __html: headerHtml }}
                        aria-hidden
                    />
                ) : null}
                {hasFooter ? (
                    <div
                        ref={footerMeasureRef}
                        className={cn("pointer-events-none absolute -left-[10000px] opacity-0", DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES)}
                        style={{ width: bodyW }}
                        dangerouslySetInnerHTML={{ __html: footerHtml }}
                        aria-hidden
                    />
                ) : null}

                <div
                    className={A4_DOCUMENT_MULTI_PAGE_STACK_CLASS}
                    style={{ gap: A4_PAGE_STACK_GAP_PX }}
                >
                    {Array.from({ length: pageCount }, (_, i) => (
                        <A4EditorPageShell key={i} sheetLayout={sheetLayout} watermark={watermark} />
                    ))}
                </div>

                <div className="absolute left-0 top-0 z-10 w-full" style={{ height: editorHeightPx }}>
                    <div
                        ref={editorRef}
                        style={{
                            paddingTop: sheetLayout.editorTopPx,
                            paddingLeft: padX,
                            paddingRight: padX,
                            minHeight: editorHeightPx,
                        }}
                    >
                        {children}
                    </div>
                </div>

                {/* Reserved bands — hide body text in header/footer zones and inter-page gaps. */}
                <div
                    className="pointer-events-none absolute left-0 top-0 z-[12] w-full"
                    style={{ height: editorHeightPx }}
                    aria-hidden
                >
                    {Array.from({ length: pageCount }, (_, pageIndex) => {
                        const band = getA4SheetBand(pageIndex, sheetLayout)
                        const maskTopReserve = hasHeader || pageIndex > 0
                        return (
                            <div key={pageIndex}>
                                {maskTopReserve ? (
                                    <div
                                        className="absolute left-0 bg-white"
                                        style={{
                                            top: band.pageTopPx,
                                            height: band.bodyStartPx - band.pageTopPx,
                                            width: pageW,
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="absolute left-0 bg-white"
                                    style={{
                                        top: band.footerTopPx,
                                        height: band.pageBottomPx - band.footerTopPx,
                                        width: pageW,
                                    }}
                                />
                                {pageIndex < pageCount - 1 ? (
                                    <div
                                        className="absolute left-0 bg-[#eef1f5]"
                                        style={{
                                            top: band.gapStartPx,
                                            height: band.gapEndPx - band.gapStartPx,
                                            width: pageW,
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>

                {/* Header + footer on every page — above body masks so chrome stays visible. */}
                {hasHeader || hasFooter ? (
                    <div
                        className="pointer-events-none absolute left-0 top-0 z-[15] w-full"
                        style={{ height: editorHeightPx }}
                        aria-hidden
                    >
                        {Array.from({ length: pageCount }, (_, pageIndex) => {
                            const band = getA4SheetBand(pageIndex, sheetLayout)
                            const topReservePx = hasHeader
                                ? sheetLayout.headerZonePx
                                : sheetLayout.verticalPaddingPx
                            const bottomReservePx = hasFooter
                                ? sheetLayout.footerZonePx
                                : sheetLayout.verticalPaddingPx

                            return (
                                <div
                                    key={pageIndex}
                                    className="absolute left-0 w-full"
                                    style={{ top: band.pageTopPx, height: A4_PAGE_HEIGHT_PX }}
                                >
                                    {hasHeader ? (
                                        <div
                                            className={cn(
                                                "absolute left-0 right-0 overflow-hidden bg-white",
                                                DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                            )}
                                            style={{
                                                top: 0,
                                                height: topReservePx,
                                                paddingTop: sheetLayout.verticalPaddingPx,
                                                paddingLeft: padX,
                                                paddingRight: padX,
                                                boxSizing: "border-box",
                                            }}
                                            dangerouslySetInnerHTML={{ __html: headerHtml }}
                                        />
                                    ) : null}
                                    {hasFooter ? (
                                        <div
                                            className={cn(
                                                "absolute left-0 right-0 overflow-hidden bg-white",
                                                DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                            )}
                                            style={{
                                                bottom: 0,
                                                height: bottomReservePx,
                                                paddingLeft: padX,
                                                paddingRight: padX,
                                                paddingBottom: sheetLayout.verticalPaddingPx,
                                                boxSizing: "border-box",
                                            }}
                                            dangerouslySetInnerHTML={{ __html: footerHtml }}
                                        />
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    )
})

// ─── Core editor ──────────────────────────────────────────────────────────────

type DocumentEditorProps = {
    bodyHtml: string
    locale: TemplateLocale
    templateDates: DocumentTemplateDates
    watermark: DocumentTemplateWatermark
    onBodyChange: (html: string) => void
    onTemplateDatesChange: (d: DocumentTemplateDates) => void
    onWatermarkChange: (w: DocumentTemplateWatermark) => void
}

export const DocumentEditor = memo(function DocumentEditor({
    bodyHtml,
    locale,
    templateDates,
    watermark,
    onBodyChange,
    onTemplateDatesChange,
    onWatermarkChange,
}: DocumentEditorProps) {
    const initial = parseDocumentLayout(bodyHtml)
    const layoutRef = useRef({
        hasHeader: Boolean(initial.headerHtml),
        hasFooter: Boolean(initial.footerHtml),
        headerFields: initial.headerHtml
            ? (parseHeaderHtml(initial.headerHtml) ?? getDefaultHeaderFields(locale))
            : getDefaultHeaderFields(locale),
        footerFields: initial.footerHtml
            ? (parseFooterHtml(initial.footerHtml) ?? DEFAULT_FOOTER_FIELDS)
            : DEFAULT_FOOTER_FIELDS,
    })
    const lastEmit = useRef<string | null>(null)

    const [hasHeader, setHasHeader] = useState(layoutRef.current.hasHeader)
    const [hasFooter, setHasFooter] = useState(layoutRef.current.hasFooter)
    const [headerFields, setHeaderFields] = useState(layoutRef.current.headerFields)
    const [footerFields, setFooterFields] = useState(layoutRef.current.footerFields)

    const [sheet, setSheet] = useState<"header" | "footer" | "watermark" | "assets" | "variables" | null>(null)
    const [assetIntent, setAssetIntent] = useState<AssetIntent | null>(null)
    const assetIntentRef = useRef<AssetIntent | null>(null)
    const returnSheetRef = useRef<typeof sheet>(null)
    const [assetSearch, setAssetSearch] = useState("")
    const [dateOptionId, setDateOptionId] = useState(TEMPLATE_DATE_INSERT_OPTIONS[0].id)
    const [dateValue, setDateValue] = useState("")

    layoutRef.current = { hasHeader, hasFooter, headerFields, footerFields }

    const handleImageFileRef = useRef<(file: File) => void>(() => {})

    const emit = useCallback(
        (rawBody: string) => {
            const { hasHeader: h, hasFooter: f, headerFields: hf, footerFields: ff } = layoutRef.current
            const composed = composeDocumentLayout({
                headerHtml: h ? buildHeaderHtml(hf) : null,
                bodyHtml: stripAutoPageBreakMarkers(rawBody),
                footerHtml: f ? buildFooterHtml(ff) : null,
            })
            lastEmit.current = composed
            onBodyChange(composed)
        },
        [onBodyChange]
    )

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, paragraph: false, link: { openOnClick: false } }),
            DocumentHeading.configure({ levels: [1, 2, 3] }),
            DocumentParagraph,
            DocumentPageBreak,
            DocumentPageFlow,
            Placeholder.configure({ placeholder: "Start writing…" }),
            TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
            TextStyle,
            Color.configure({ types: ["textStyle"] }),
            FontSize,
            ImageResize.configure({
                inline: false,
                allowBase64: false,
                minWidth: 48,
                maxWidth: 680,
                HTMLAttributes: { class: DOCUMENT_IMAGE_CLASS, "data-keep-ratio": "true" },
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: stripAutoPageBreakMarkers(initial.bodyHtml),
        immediatelyRender: false,
        onUpdate: ({ editor: e, transaction }) => {
            if (isDocumentTemplateLayoutSyncActive() || isDocumentTemplateLayoutTransaction(transaction)) return
            emit(e.getHTML())
        },
        editorProps: {
            attributes: { class: A4_DOCUMENT_CONTENT_CLASS },
            handlePaste: (_view, event) => {
                const items = event.clipboardData?.items
                if (!items) return false
                for (const item of items) {
                    if (!item.type.startsWith("image/")) continue
                    const file = item.getAsFile()
                    if (!file) continue
                    event.preventDefault()
                    handleImageFileRef.current(file)
                    return true
                }
                return false
            },
            handleDrop: (_view, event, _slice, moved) => {
                if (moved) return false
                const file = Array.from(event.dataTransfer?.files ?? []).find((f) =>
                    f.type.startsWith("image/")
                )
                if (!file) return false
                event.preventDefault()
                handleImageFileRef.current(file)
                return true
            },
        },
    })

    useEffect(() => {
        if (!editor || bodyHtml === lastEmit.current) return
        const layout = parseDocumentLayout(bodyHtml)
        setHasHeader(Boolean(layout.headerHtml))
        setHasFooter(Boolean(layout.footerHtml))
        if (layout.headerHtml) setHeaderFields(parseHeaderHtml(layout.headerHtml) ?? getDefaultHeaderFields(locale))
        if (layout.footerHtml) setFooterFields(parseFooterHtml(layout.footerHtml) ?? DEFAULT_FOOTER_FIELDS)
        const norm = stripAutoPageBreakMarkers(layout.bodyHtml)
        if (editor.getHTML() !== norm) editor.commands.setContent(norm, { emitUpdate: false })
    }, [bodyHtml, editor, locale])

    useEffect(() => {
        if (!editor || !hasHeader) return
        const cur = layoutRef.current.headerFields
        if (!isDefaultHeaderContactText(cur.contactText)) return
        const next = getDefaultHeaderFields(locale).contactText
        if (cur.contactText === next) return
        const updated = { ...cur, contactText: next }
        setHeaderFields(updated)
        layoutRef.current.headerFields = updated
        emit(editor.getHTML())
    }, [editor, emit, hasHeader, locale])

    const patchHeader = useCallback(
        (next: DocumentTemplateHeaderFields) => {
            setHeaderFields(next)
            layoutRef.current.headerFields = next
            emit(editor?.getHTML() ?? "")
        },
        [editor, emit]
    )

    const patchFooter = useCallback(
        (next: DocumentTemplateFooterFields) => {
            setFooterFields(next)
            layoutRef.current.footerFields = next
            emit(editor?.getHTML() ?? "")
        },
        [editor, emit]
    )

    const setHeaderOn = useCallback(
        (on: boolean) => {
            if (on) {
                const f = getDefaultHeaderFields(locale)
                setHasHeader(true)
                setHeaderFields(f)
                layoutRef.current = { ...layoutRef.current, hasHeader: true, headerFields: f }
            } else {
                setHasHeader(false)
                layoutRef.current.hasHeader = false
            }
            emit(editor?.getHTML() ?? "")
        },
        [editor, emit, locale]
    )

    const setFooterOn = useCallback(
        (on: boolean) => {
            if (on) {
                setHasFooter(true)
                setFooterFields(DEFAULT_FOOTER_FIELDS)
                layoutRef.current = { ...layoutRef.current, hasFooter: true, footerFields: DEFAULT_FOOTER_FIELDS }
            } else {
                setHasFooter(false)
                layoutRef.current.hasFooter = false
            }
            emit(editor?.getHTML() ?? "")
        },
        [editor, emit]
    )

    const patchWatermark = useCallback(
        (patch: Partial<DocumentTemplateWatermark>) => {
            onWatermarkChange({ ...watermark, ...patch })
        },
        [onWatermarkChange, watermark]
    )

    const setWatermarkOn = useCallback(
        (on: boolean) => {
            onWatermarkChange(on ? { ...watermark, enabled: true } : { ...watermark, enabled: false })
        },
        [onWatermarkChange, watermark]
    )

    const openAssets = useCallback(
        (intent: AssetIntent | null, returnTo: typeof sheet = null) => {
            returnSheetRef.current = returnTo
            assetIntentRef.current = intent
            setAssetIntent(intent)
            setSheet("assets")
        },
        []
    )

    const insertImageBlock = useCallback(
        (url: string, className = DOCUMENT_IMAGE_CLASS) => {
            if (!editor) return
            const html = `<p style="text-align: center;">${buildImageHtml(url, {
                className,
                alt: "Document image",
            })}</p>`
            editor.chain().focus().insertContent(html).run()
        },
        [editor]
    )

    const insertLogo = useCallback(
        (url: string) => {
            if (!editor) return
            const { $from } = editor.state.selection
            if ($from.parent.type.name === "paragraph") {
                const hasLine = String($from.parent.attrs.class ?? "").includes(DOCUMENT_LOGO_LINE_CLASS)
                if (!hasLine) {
                    editor
                        .chain()
                        .focus()
                        .updateAttributes("paragraph", { class: DOCUMENT_LOGO_LINE_CLASS })
                        .insertContent(buildLogoImageHtml(url))
                        .run()
                    return
                }
            }
            insertImageBlock(url, `${DOCUMENT_LOGO_CLASS} ${DOCUMENT_IMAGE_CLASS}`.trim())
        },
        [editor, insertImageBlock]
    )

    const applyAsset = useCallback(
        (asset: DocumentTemplateAsset, intent: AssetIntent) => {
            if (intent === "header-logo") patchHeader({ ...headerFields, logoUrl: asset.url })
            else if (intent === "logo") insertLogo(asset.url)
            else if (intent === "watermark") {
                onWatermarkChange({ ...watermark, enabled: true, image_url: asset.url })
            } else if (intent === "header") editor?.chain().focus().insertContentAt(0, buildHeaderImageBlock(asset.url)).run()
            else insertImageBlock(asset.url)

            const returnTo = returnSheetRef.current
            returnSheetRef.current = null
            setSheet(returnTo)
            assetIntentRef.current = null
            setAssetIntent(null)
            editor?.commands.focus()
        },
        [editor, headerFields, insertImageBlock, insertLogo, onWatermarkChange, patchHeader, watermark]
    )

    const queryClient = useQueryClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const applyAssetRef = useRef(applyAsset)
    applyAssetRef.current = applyAsset

    const assetsQuery = useQuery({
        queryKey: DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY,
        queryFn: fetchAssets,
        enabled: sheet === "assets",
    })

    const uploadMut = useMutation({
        mutationFn: uploadAsset,
        onSuccess: (asset) => {
            queryClient.invalidateQueries({ queryKey: DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY })
            toast.success("Asset uploaded")
            const intent = assetIntentRef.current
            if (intent) {
                applyAssetRef.current(asset, intent)
            }
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
    })

    const uploadImageAttachment = useCallback(
        async (file: File) => {
            const asset = await uploadAsset(file)
            queryClient.invalidateQueries({ queryKey: DOCUMENT_TEMPLATE_ASSETS_QUERY_KEY })
            return asset
        },
        [queryClient]
    )

    const insertUploadedImage = useCallback(
        async (file: File) => {
            try {
                const asset = await uploadImageAttachment(file)
                insertImageBlock(asset.url)
                toast.success("Image added to assets and inserted")
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Upload failed")
            }
        },
        [insertImageBlock, uploadImageAttachment]
    )

    useEffect(() => {
        handleImageFileRef.current = (file) => {
            void insertUploadedImage(file)
        }
    }, [insertUploadedImage])

    const filteredAssets = useMemo(() => {
        const list = assetsQuery.data ?? []
        const q = assetSearch.trim().toLowerCase()
        return q ? list.filter((a) => a.name.toLowerCase().includes(q)) : list
    }, [assetSearch, assetsQuery.data])

    const dateOption = getTemplateDateInsertOptionById(dateOptionId) ?? TEMPLATE_DATE_INSERT_OPTIONS[0]

    useEffect(() => {
        if (!dateOption.configKey) {
            setDateValue("")
            return
        }
        setDateValue(templateDates[dateOption.configKey] ?? "")
    }, [dateOption.configKey, dateOptionId, templateDates])

    const insertVar = useCallback(
        (key: string) => {
            editor?.chain().focus().insertContent(`{{${key}}}`).run()
            setSheet(null)
        },
        [editor]
    )

    const insertDate = useCallback(() => {
        if (dateOption.configKey && dateValue.trim()) {
            onTemplateDatesChange({ ...templateDates, [dateOption.configKey]: dateValue })
        }
        insertVar(dateOption.mergeKey)
    }, [dateOption, dateValue, insertVar, onTemplateDatesChange, templateDates])

    const fontSize = editor
        ? clampDocumentTemplateFontSizePx(parseDocumentTemplateFontSizePx(editor.getAttributes("textStyle").fontSize as string))
        : 14
    const textColor = (editor?.getAttributes("textStyle").color as string) ?? "#111827"

    if (!editor) return null

    const headerHtml = buildHeaderHtml(headerFields)
    const footerHtml = buildFooterHtml(footerFields)

    return (
        <div className="relative flex flex-col">
            {/* Toolbar — above canvas; below side sheets (z-[100]). */}
            <div className="sticky top-0 z-30 border-b bg-background/95 px-3 py-2 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-0.5">
                    <IconBtn label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-3.5" /></IconBtn>
                    <IconBtn label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-3.5" /></IconBtn>
                    <IconBtn label="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-3.5" /></IconBtn>
                    <IconBtn label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="size-3.5" /></IconBtn>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => editor.chain().focus().insertContent(buildDocumentHeadingBlock()).run()}><Type className="size-3.5" />Title</Button>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <IconBtn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></IconBtn>
                    <IconBtn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></IconBtn>
                    <IconBtn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-3.5" /></IconBtn>
                    <IconBtn label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-3.5" /></IconBtn>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <IconBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></IconBtn>
                    <IconBtn label="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-3.5" /></IconBtn>
                    <IconBtn label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="size-3.5" /></IconBtn>
                    <IconBtn label="Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="size-3.5" /></IconBtn>
                    <IconBtn label="Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="size-3.5" /></IconBtn>
                    <IconBtn label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="size-3.5" /></IconBtn>
                    <IconBtn label="Link" onClick={() => {
                        const prev = editor.getAttributes("link").href as string | undefined
                        const url = window.prompt("URL", prev ?? "https://")
                        if (url === null) return
                        if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run()
                        else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
                    }}><Link2 className="size-3.5" /></IconBtn>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <IconBtn label="Decrease font" disabled={fontSize <= 8} onClick={() => editor.chain().focus().setFontSize(formatDocumentTemplateFontSizePx(fontSize - DOCUMENT_TEMPLATE_FONT_SIZE_STEP)).run()}><Minus className="size-3.5" /></IconBtn>
                    <Select value={String(fontSize)} onValueChange={(v) => editor.chain().focus().setFontSize(formatDocumentTemplateFontSizePx(Number(v))).run()}>
                        <SelectTrigger className="h-7 w-[72px] px-2 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-40 max-h-48">
                            {getDocumentTemplateFontSizeOptions().map((s) => (
                                <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <IconBtn label="Increase font" disabled={fontSize >= 72} onClick={() => editor.chain().focus().setFontSize(formatDocumentTemplateFontSizePx(fontSize + DOCUMENT_TEMPLATE_FONT_SIZE_STEP)).run()}><Plus className="size-3.5" /></IconBtn>
                    {TEXT_COLORS.map((c) => (
                        <button key={c} type="button" aria-label={`Color ${c}`} className={cn("size-5 rounded-full border", textColor === c && "ring-2 ring-brand-secondary")} style={{ backgroundColor: c }} onClick={() => editor.chain().focus().setColor(c).run()} />
                    ))}
                    <label className="relative inline-flex size-6 cursor-pointer items-center justify-center rounded border">
                        <Palette className="size-3 text-muted-foreground" />
                        <input type="color" value={textColor} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
                    </label>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => openAssets("inline")}><ImageIcon className="size-3.5" />Image</Button>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="size-3.5" />Table</Button>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => { editor.chain().focus().insertContent(buildLogoLineBlock({ align: "left" })).run(); openAssets("logo") }}><Columns3 className="size-3.5" />Logo</Button>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => editor.chain().focus().insertDocumentPageBreak().run()}><SeparatorHorizontal className="size-3.5" />Break</Button>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => setSheet("variables")}><Braces className="size-3.5" />Variables</Button>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <Button type="button" variant={hasHeader ? "secondary" : "ghost"} size="xs" className="gap-1" onClick={() => setSheet("header")}><PanelTop className="size-3.5" />Header</Button>
                    <Button type="button" variant={hasFooter ? "secondary" : "ghost"} size="xs" className="gap-1" onClick={() => setSheet("footer")}><PanelBottom className="size-3.5" />Footer</Button>
                    <Button type="button" variant="ghost" size="xs" className="gap-1" onClick={() => openAssets(null)}><FolderOpen className="size-3.5" />Assets</Button>
                    <Button
                        type="button"
                        variant={isWatermarkVisible(watermark) ? "secondary" : "ghost"}
                        size="xs"
                        className="gap-1"
                        onClick={() => setSheet("watermark")}
                    >
                        <Droplets className="size-3.5" />
                        Watermark
                    </Button>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <IconBtn label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-3.5" /></IconBtn>
                    <IconBtn label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-3.5" /></IconBtn>
                </div>
            </div>

            <EditorCanvas
                editor={editor}
                hasHeader={hasHeader}
                hasFooter={hasFooter}
                headerHtml={headerHtml}
                footerHtml={footerHtml}
                watermark={watermark}
            >
                <EditorContent editor={editor} />
            </EditorCanvas>

            {/* Header sheet */}
            <Sheet open={sheet === "header"} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-md")}
                >
                    <SheetHeader><SheetTitle>Header</SheetTitle><SheetDescription>Repeats on every page — outside the body.</SheetDescription></SheetHeader>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                            <Typography as="span" font="small">Enabled</Typography>
                            <Button size="sm" variant={hasHeader ? "default" : "outline"} onClick={() => setHeaderOn(!hasHeader)}>{hasHeader ? "On" : "Off"}</Button>
                        </div>
                        {hasHeader ? (
                            <>
                                <div className="overflow-x-auto rounded-lg border bg-white">
                                    <div
                                        className={cn(
                                            "w-[180mm] max-w-none shrink-0 p-3",
                                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                        )}
                                        dangerouslySetInnerHTML={{ __html: headerHtml }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-1" onClick={() => openAssets("header-logo")}><ImagePlus className="size-3.5" />{headerFields.logoUrl ? "Change" : "Add"} logo</Button>
                                    {headerFields.logoUrl ? <Button variant="ghost" size="sm" onClick={() => patchHeader({ ...headerFields, logoUrl: "" })}>Remove</Button> : null}
                                </div>
                                <div className="space-y-1">
                                    <Typography as="label" font="small">Contact text</Typography>
                                    <Textarea rows={3} value={headerFields.contactText} onChange={(e) => patchHeader({ ...headerFields, contactText: e.target.value })} />
                                </div>
                            </>
                        ) : null}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Footer sheet */}
            <Sheet open={sheet === "footer"} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-md")}
                >
                    <SheetHeader><SheetTitle>Footer</SheetTitle><SheetDescription>Four columns — repeats on every page.</SheetDescription></SheetHeader>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                            <Typography as="span" font="small">Enabled</Typography>
                            <Button size="sm" variant={hasFooter ? "default" : "outline"} onClick={() => setFooterOn(!hasFooter)}>{hasFooter ? "On" : "Off"}</Button>
                        </div>
                        {hasFooter ? (
                            <>
                                <div className="overflow-x-auto rounded-lg border bg-white">
                                    <div
                                        className={cn(
                                            "w-[180mm] max-w-none shrink-0 p-3",
                                            DOCUMENT_TEMPLATE_HEADER_FOOTER_STYLES
                                        )}
                                        dangerouslySetInnerHTML={{ __html: footerHtml }}
                                    />
                                </div>
                                {FOOTER_COLS.map(({ key, de, en }) => (
                                    <div key={key} className="space-y-1">
                                        <Typography as="label" font="small">{locale === "de" ? de : en}</Typography>
                                        <Textarea rows={4} className="text-xs" value={footerFields[key]} onChange={(e) => patchFooter({ ...footerFields, [key]: e.target.value })} />
                                    </div>
                                ))}
                            </>
                        ) : null}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Watermark sheet */}
            <Sheet open={sheet === "watermark"} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-md")}
                >
                    <SheetHeader>
                        <SheetTitle>Watermark</SheetTitle>
                        <SheetDescription>Background image on every page — behind body text.</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                            <Typography as="span" font="small">Enabled</Typography>
                            <Button
                                size="sm"
                                variant={isWatermarkVisible(watermark) ? "default" : "outline"}
                                onClick={() => setWatermarkOn(!isWatermarkVisible(watermark))}
                            >
                                {isWatermarkVisible(watermark) ? "On" : "Off"}
                            </Button>
                        </div>

                        {isWatermarkVisible(watermark) ? (
                            <>
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={resolveWatermarkImageSrc(watermark)}
                                        alt=""
                                        className="mx-auto max-h-40 w-full object-contain"
                                        style={{
                                            opacity: watermark.opacity,
                                            transform: `rotate(${watermark.rotation_deg}deg)`,
                                        }}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => openAssets("watermark", "watermark")}
                                    >
                                        <ImagePlus className="size-3.5" />
                                        {watermark.image_url ? "Change image" : "Choose image"}
                                    </Button>
                                    {watermark.image_url ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => patchWatermark({ image_url: null })}
                                        >
                                            Remove image
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Typography as="label" font="small">Opacity</Typography>
                                        <Typography as="span" font="small" className="text-muted-foreground">
                                            {Math.round(watermark.opacity * 100)}%
                                        </Typography>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Typography as="span" font="small" className="shrink-0 text-muted-foreground">
                                            Low
                                        </Typography>
                                        <input
                                            type="range"
                                            min={0.05}
                                            max={0.5}
                                            step={0.01}
                                            value={watermark.opacity}
                                            className="h-2 w-full cursor-pointer accent-brand-secondary"
                                            onChange={(e) =>
                                                patchWatermark({ opacity: Number(e.target.value) })
                                            }
                                        />
                                        <Typography as="span" font="small" className="shrink-0 text-muted-foreground">
                                            High
                                        </Typography>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Typography as="label" font="small">Position</Typography>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(
                                            [
                                                {
                                                    value: "top" as const,
                                                    label: "Top",
                                                    icon: AlignVerticalJustifyStart,
                                                },
                                                {
                                                    value: "center" as const,
                                                    label: "Center",
                                                    icon: AlignVerticalJustifyCenter,
                                                },
                                                {
                                                    value: "bottom" as const,
                                                    label: "Bottom",
                                                    icon: AlignVerticalJustifyEnd,
                                                },
                                            ] satisfies Array<{
                                                value: DocumentTemplateWatermarkPosition
                                                label: string
                                                icon: typeof AlignVerticalJustifyCenter
                                            }>
                                        ).map(({ value, label, icon: Icon }) => (
                                            <Button
                                                key={value}
                                                type="button"
                                                size="sm"
                                                variant={watermark.position === value ? "default" : "outline"}
                                                className="gap-1"
                                                onClick={() => patchWatermark({ position: value })}
                                            >
                                                <Icon className="size-3.5" />
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Typography as="label" font="small">Rotation</Typography>
                                        <Typography as="span" font="small" className="text-muted-foreground">
                                            {watermark.rotation_deg}°
                                        </Typography>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RotateCw className="size-4 shrink-0 text-muted-foreground" />
                                        <input
                                            type="range"
                                            min={-180}
                                            max={180}
                                            step={1}
                                            value={watermark.rotation_deg}
                                            className="h-2 w-full cursor-pointer accent-brand-secondary"
                                            onChange={(e) =>
                                                patchWatermark({ rotation_deg: Number(e.target.value) })
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[0, 45, 90, -45].map((deg) => (
                                            <Button
                                                key={deg}
                                                type="button"
                                                size="xs"
                                                variant={watermark.rotation_deg === deg ? "default" : "outline"}
                                                onClick={() => patchWatermark({ rotation_deg: deg })}
                                            >
                                                {deg}°
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Assets sheet */}
            <Sheet
                open={sheet === "assets"}
                onOpenChange={(o) => {
                    if (!o) {
                        returnSheetRef.current = null
                        setSheet(null)
                        assetIntentRef.current = null
                        setAssetIntent(null)
                    }
                }}
            >
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-lg")}
                >
                    <SheetHeader>
                        <SheetTitle>{assetIntent ? "Choose asset" : "Assets"}</SheetTitle>
                        <SheetDescription>
                            {assetIntent
                                ? "Select an image from the library or upload a new one."
                                : "All template images live in media/assets. Use Image, Logo, Header, or Watermark to insert."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-4">
                        <div className="flex shrink-0 gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input className="h-8 pl-8 text-xs" placeholder="Search…" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} />
                            </div>
                            <Button size="sm" className="gap-1" disabled={uploadMut.isPending} onClick={() => fileRef.current?.click()}>
                                {uploadMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                                Upload
                            </Button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadMut.mutate(f) }} />
                        </div>
                        {assetsQuery.isLoading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : null}
                        {assetsQuery.isError ? <ErrorView message={assetsQuery.error instanceof Error ? assetsQuery.error.message : "Failed to load"} /> : null}
                        {!assetsQuery.isLoading && !assetsQuery.isError && filteredAssets.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
                                <ImageIcon className="size-8 text-muted-foreground" />
                                <Typography as="p" font="small" className="text-muted-foreground">
                                    No assets yet. Upload an image to add it to the library.
                                </Typography>
                            </div>
                        ) : null}
                        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-3">
                            {filteredAssets.map((asset) => (
                                <button
                                    key={asset.path}
                                    type="button"
                                    disabled={!assetIntent}
                                    className={cn(
                                        "overflow-hidden rounded-lg border bg-background text-left transition-shadow",
                                        assetIntent
                                            ? "cursor-pointer hover:ring-2 hover:ring-brand-secondary/30"
                                            : "cursor-default opacity-90"
                                    )}
                                    onClick={() => assetIntent && applyAsset(asset, assetIntent)}
                                >
                                    <div className="aspect-[4/3] bg-muted/30 p-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={asset.url} alt={asset.name} className="size-full object-contain" />
                                    </div>
                                    <Typography as="p" font="small" className="truncate border-t px-2 py-1 text-[11px]">{asset.name}</Typography>
                                </button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Variables sheet */}
            <Sheet open={sheet === "variables"} onOpenChange={(o) => !o && setSheet(null)}>
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-md")}
                >
                    <SheetHeader><SheetTitle>Variables</SheetTitle><SheetDescription>Inserted at cursor in the body.</SheetDescription></SheetHeader>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                        <div className="space-y-2">
                            <Typography as="span" font="small" className="font-medium uppercase text-muted-foreground">Salutation</Typography>
                            <div className="flex flex-wrap gap-1">{TEMPLATE_GREETING_VARIABLES.map((v) => (
                                <Button key={v.key} variant="outline" size="xs" onClick={() => insertVar(v.key)}>{`{{${v.key}}}`}</Button>
                            ))}</div>
                        </div>
                        <div className="space-y-2">
                            <Typography as="span" font="small" className="font-medium uppercase text-muted-foreground">Fields</Typography>
                            <div className="flex flex-wrap gap-1">{TEMPLATE_MERGE_VARIABLES.filter((v) => !TEMPLATE_GREETING_VARIABLES.some((g) => g.key === v.key)).map((v) => (
                                <Button key={v.key} variant="outline" size="xs" onClick={() => insertVar(v.key)}>{`{{${v.key}}}`}</Button>
                            ))}</div>
                        </div>
                        <div className="space-y-2">
                            <Typography as="span" font="small" className="font-medium uppercase text-muted-foreground">Dates</Typography>
                            <div className="flex flex-wrap gap-2">
                                <Select value={dateOptionId} onValueChange={setDateOptionId}>
                                    <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="z-40">{TEMPLATE_DATE_INSERT_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={o.id}>{getTemplateDateInsertOptionLabel(o, locale)}</SelectItem>
                                    ))}</SelectContent>
                                </Select>
                                {dateOption.configKey ? <Input type="date" className="h-8 w-36 text-xs" value={dateValue} onChange={(e) => setDateValue(e.target.value)} /> : null}
                                <Button size="xs" variant="outline" disabled={Boolean(dateOption.configKey) && !dateValue.trim()} onClick={insertDate}>Insert</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Typography as="span" font="small" className="font-medium uppercase text-muted-foreground">Sections</Typography>
                            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => insertVar(ADMISSION_REQUIREMENTS_CHECKLIST_VARIABLE)}>Admission checklist</Button>
                            {TEMPLATE_DYNAMIC_SECTIONS.map((s) => (
                                <Button key={s.key} variant="outline" size="sm" className="w-full justify-start" onClick={() => insertVar(s.key)}>{s.label}</Button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
})

// ─── Edit page ────────────────────────────────────────────────────────────────

export const DocumentEditorPage = memo(function DocumentEditorPage({ templateId }: { templateId: string }) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const templateQuery = useQuery({
        queryKey: documentTemplateQueryKey(templateId),
        queryFn: () => fetchDocumentTemplate(templateId),
        enabled: Boolean(templateId),
    })

    const template = templateQuery.data?.data

    const programOptionsQuery = useQuery({
        queryKey: [...DOCUMENT_TEMPLATE_PROGRAM_OPTIONS_QUERY_KEY, templateId],
        queryFn: () => fetchDocumentTemplateProgramOptions(templateId),
        enabled: Boolean(templateId),
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    })

    const [title, setTitle] = useState("")
    const [bodyHtml, setBodyHtml] = useState("")
    const [locale, setLocale] = useState<TemplateLocale>("en")
    const [templateDates, setTemplateDates] = useState<DocumentTemplateDates>({ ...EMPTY_DOCUMENT_TEMPLATE_DATES })
    const [watermark, setWatermark] = useState<DocumentTemplateWatermark>({ ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK })
    const [programIds, setProgramIds] = useState<string[]>([])
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [loadedTemplateKey, setLoadedTemplateKey] = useState<string | null>(null)

    useEffect(() => {
        if (!template) return
        const key = `${template.id}-${template.updated_at}`
        if (loadedTemplateKey === key) return
        setTitle(template.title)
        setBodyHtml(template.body_html || DEFAULT_TEMPLATE_BODY_HTML)
        setLocale(template.locale ?? "en")
        setTemplateDates(template.template_dates ?? { ...EMPTY_DOCUMENT_TEMPLATE_DATES })
        setWatermark(template.watermark ?? { ...DEFAULT_DOCUMENT_TEMPLATE_WATERMARK })
        setProgramIds(getTemplateCourseIds(template))
        setLoadedTemplateKey(key)
    }, [loadedTemplateKey, template])

    const saveMut = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/document-template/${templateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    body_html: bodyHtml,
                    locale,
                    template_dates: templateDates,
                    watermark,
                    course_ids: programIds,
                }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? "Save failed")
            return json as DocumentTemplateDetailResponse
        },
        onSuccess: (response) => {
            const cached = queryClient.getQueryData<DocumentTemplatesListResponse>(DOCUMENT_TEMPLATES_QUERY_KEY)
            const prev = cached?.data.find((r) => r.id === templateId)
            upsertDocumentTemplateInCache(queryClient, response.data)
            syncTemplateProgramsInOptionsCache(queryClient, prev, response.data)
            queryClient.setQueryData(documentTemplateQueryKey(templateId), response)
        },
    })

    const linkedPrograms = useMemo(() => {
        const labelById = new Map<string, string>()
        for (const course of template?.courses ?? []) {
            labelById.set(course.id, course.label)
        }
        for (const option of programOptionsQuery.data ?? []) {
            labelById.set(option.id, option.label)
        }
        return programIds.map((id) => ({
            id,
            label: labelById.get(id) ?? id,
        }))
    }, [programIds, programOptionsQuery.data, template?.courses])

    const handleSave = useCallback(async () => {
        setFormError(null)
        if (!title.trim()) { setFormError("Title is required."); return }
        if (!programIds.length) { setFormError("Select at least one program."); return }
        const id = toast.loading("Saving…")
        try {
            await saveMut.mutateAsync()
            toast.success("Saved", { id })
            router.push(`/dashboard/templates/${templateId}`)
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Save failed"
            setFormError(msg)
            toast.error(msg, { id })
        }
    }, [programIds.length, router, saveMut, templateId, title])

    if (templateQuery.isLoading || !template || loadedTemplateKey !== `${template.id}-${template.updated_at}`) {
        return <DetailPageSkeleton />
    }

    if (templateQuery.isError || !template) {
        return (
            <DocumentTemplateDetailError
                message={templateQuery.error instanceof Error ? templateQuery.error.message : "Not found"}
                onRetry={() => templateQuery.refetch()}
            />
        )
    }

    return (
        <div className="flex flex-col bg-background">
            <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2">
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" asChild>
                    <Link href={`/dashboard/templates/${templateId}`}>
                        <ArrowLeft className="size-4" />
                        Back
                    </Link>
                </Button>
                <Input
                    value={title}
                    className="h-9 max-w-md flex-1 border-transparent bg-transparent text-base font-medium shadow-none focus-visible:border-border"
                    placeholder="Template title"
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Typography as="span" font="small" className="hidden shrink-0 text-muted-foreground sm:inline">
                    {saveMut.isPending ? "Saving…" : saveMut.isSuccess ? "Saved" : ""}
                </Typography>
                <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
                    <Settings2 className="size-4" />
                </Button>
                <Button size="sm" className="gap-1.5 shrink-0" disabled={saveMut.isPending} onClick={handleSave}>
                    <Save className="size-4" />
                    Save
                </Button>
            </header>

            {formError ? <div className="px-4 pt-2"><ErrorView message={formError} /></div> : null}

            <div className="border-b bg-muted/20 px-4 py-3">
                <DocumentTemplateAttachedPrograms programs={linkedPrograms} />
            </div>

            <DocumentEditor
                bodyHtml={bodyHtml}
                locale={locale}
                templateDates={templateDates}
                watermark={watermark}
                onBodyChange={setBodyHtml}
                onTemplateDatesChange={setTemplateDates}
                onWatermarkChange={setWatermark}
            />

            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetContent
                    side="right"
                    overlayClassName={EDITOR_SHEET_OVERLAY_CLASS}
                    className={cn(EDITOR_SHEET_CONTENT_CLASS, "sm:max-w-md")}
                >
                    <SheetHeader><SheetTitle>Template settings</SheetTitle><SheetDescription>Language and program assignment.</SheetDescription></SheetHeader>
                    <div className="space-y-4 px-4 pb-4">
                        <div className="space-y-2">
                            <Typography as="label" font="small">Letter language</Typography>
                            <Select value={locale} onValueChange={(v) => setLocale(v as TemplateLocale)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{TEMPLATE_LOCALE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}</SelectContent>
                            </Select>
                        </div>
                        <DocumentTemplateProgramSelect
                            value={programIds}
                            excludeTemplateId={templateId}
                            assignedPrograms={linkedPrograms}
                            onChange={setProgramIds}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
})
