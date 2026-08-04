"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import ImageResize from "tiptap-extension-resize-image"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Columns3,
    ListChecks,
    Bold,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    ImageUp,
    Italic,
    Link2,
    List,
    ListOrdered,
    Pilcrow,
    PanelBottom,
    PanelTop,
    Redo2,
    SeparatorHorizontal,
    Strikethrough,
    Table2,
    Type,
    UnderlineIcon,
    Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Typography } from "@/components/shared/Typography"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    DEFAULT_CENTER_LOGO_WIDTH,
    DOCUMENT_IMAGE_CLASS,
    DOCUMENT_LOGO_LINE_CLASS,
    buildDocumentHeadingBlock,
    buildHeaderImageBlock,
    buildLogoImageHtml,
    buildLogoLineBlock,
} from "@/lib/document-template/a4-document"
import { DocumentPageBreak } from "@/lib/document-template/tiptap-document-page-break"
import { DocumentTemplateA4PaginatedSheet } from "./document-template-a4-paginated-sheet"
import { TEMPLATE_DYNAMIC_SECTIONS, TEMPLATE_MERGE_VARIABLES } from "@/lib/document-template/variables"
import { DocumentParagraph } from "@/lib/document-template/tiptap-document-paragraph"
import {
    buildFooterHtml,
    buildHeaderHtml,
    composeDocumentLayout,
    DEFAULT_FOOTER_FIELDS,
    DEFAULT_HEADER_FIELDS,
    parseDocumentLayout,
    parseFooterHtml,
    parseHeaderHtml,
    type DocumentTemplateFooterFields,
    type DocumentTemplateHeaderFields,
} from "@/lib/document-template/header-footer"
import type { DocumentTemplateAsset } from "@/types/schemas/document-template"
import {
    DocumentTemplateAssetsModal,
    type DocumentTemplateAssetIntent,
} from "./document-template-assets-modal"
import { cn } from "@/lib/utils"

type DocumentTemplateEditorProps = {
    content: string
    editable?: boolean
    onChange?: (html: string) => void
    className?: string
}

function ToolbarButton({
    onClick,
    active,
    disabled,
    label,
    children,
}: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    label: string
    children: React.ReactNode
}) {
    return (
        <Button
            type="button"
            variant={active ? "default" : "outline"}
            size="icon-xs"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}

export const DocumentTemplateEditor = memo(function DocumentTemplateEditor({
    content,
    editable = true,
    onChange,
    className,
}: DocumentTemplateEditorProps) {
    const initialLayout = parseDocumentLayout(content)

    const [assetsModalOpen, setAssetsModalOpen] = useState(false)
    const [assetsModalIntent, setAssetsModalIntent] = useState<DocumentTemplateAssetIntent | null>(
        null
    )
    const [hasHeader, setHasHeader] = useState(() => Boolean(initialLayout.headerHtml))
    const [hasFooter, setHasFooter] = useState(() => Boolean(initialLayout.footerHtml))
    const [headerFields, setHeaderFields] = useState<DocumentTemplateHeaderFields>(() =>
        initialLayout.headerHtml
            ? (parseHeaderHtml(initialLayout.headerHtml) ?? DEFAULT_HEADER_FIELDS)
            : DEFAULT_HEADER_FIELDS
    )
    const [footerFields, setFooterFields] = useState<DocumentTemplateFooterFields>(() =>
        initialLayout.footerHtml
            ? (parseFooterHtml(initialLayout.footerHtml) ?? DEFAULT_FOOTER_FIELDS)
            : DEFAULT_FOOTER_FIELDS
    )

    const layoutRef = useRef({
        hasHeader,
        hasFooter,
        headerFields,
        footerFields,
    })

    layoutRef.current = {
        hasHeader,
        hasFooter,
        headerFields,
        footerFields,
    }

    const emitComposedHtml = useCallback(
        (bodyHtml: string) => {
            const { hasHeader: showHeader, hasFooter: showFooter, headerFields: header, footerFields: footer } =
                layoutRef.current

            onChange?.(
                composeDocumentLayout({
                    headerHtml: showHeader ? buildHeaderHtml(header) : null,
                    bodyHtml,
                    footerHtml: showFooter ? buildFooterHtml(footer) : null,
                })
            )
        },
        [onChange]
    )

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                paragraph: false,
            }),
            DocumentParagraph,
            DocumentPageBreak,
            Placeholder.configure({
                placeholder:
                    "Start writing your A4 document… Use {{variable_name}} for dynamic fields.",
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            ImageResize.configure({
                inline: true,
                allowBase64: false,
                minWidth: 48,
                maxWidth: 680,
                HTMLAttributes: {
                    class: DOCUMENT_IMAGE_CLASS,
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: initialLayout.bodyHtml,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor: currentEditor }) => {
            emitComposedHtml(currentEditor.getHTML())
        },
        editorProps: {
            attributes: {
                class: A4_DOCUMENT_CONTENT_CLASS,
            },
        },
    })

    useEffect(() => {
        if (!editor) return

        const layout = parseDocumentLayout(content)
        setHasHeader(Boolean(layout.headerHtml))
        setHasFooter(Boolean(layout.footerHtml))

        if (layout.headerHtml) {
            setHeaderFields(parseHeaderHtml(layout.headerHtml) ?? DEFAULT_HEADER_FIELDS)
        }

        if (layout.footerHtml) {
            setFooterFields(parseFooterHtml(layout.footerHtml) ?? DEFAULT_FOOTER_FIELDS)
        }

        if (editor.getHTML() !== layout.bodyHtml) {
            editor.commands.setContent(layout.bodyHtml, { emitUpdate: false })
        }
    }, [content, editor])

    useEffect(() => {
        if (!editor) return
        editor.setEditable(editable)
    }, [editable, editor])

    const addDocumentHeader = useCallback(() => {
        setHasHeader(true)
        setHeaderFields(DEFAULT_HEADER_FIELDS)
        layoutRef.current = {
            ...layoutRef.current,
            hasHeader: true,
            headerFields: DEFAULT_HEADER_FIELDS,
        }
        emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
    }, [content, editor, emitComposedHtml])

    const removeDocumentHeader = useCallback(() => {
        setHasHeader(false)
        layoutRef.current = { ...layoutRef.current, hasHeader: false }
        emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
    }, [content, editor, emitComposedHtml])

    const addDocumentFooter = useCallback(() => {
        setHasFooter(true)
        setFooterFields(DEFAULT_FOOTER_FIELDS)
        layoutRef.current = {
            ...layoutRef.current,
            hasFooter: true,
            footerFields: DEFAULT_FOOTER_FIELDS,
        }
        emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
    }, [content, editor, emitComposedHtml])

    const removeDocumentFooter = useCallback(() => {
        setHasFooter(false)
        layoutRef.current = { ...layoutRef.current, hasFooter: false }
        emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
    }, [content, editor, emitComposedHtml])

    const updateHeaderFields = useCallback(
        (next: DocumentTemplateHeaderFields) => {
            setHeaderFields(next)
            layoutRef.current = { ...layoutRef.current, headerFields: next }
            emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
        },
        [content, editor, emitComposedHtml]
    )

    const updateFooterFields = useCallback(
        (next: DocumentTemplateFooterFields) => {
            setFooterFields(next)
            layoutRef.current = { ...layoutRef.current, footerFields: next }
            emitComposedHtml(editor?.getHTML() ?? parseDocumentLayout(content).bodyHtml)
        },
        [content, editor, emitComposedHtml]
    )

    const insertLogoRow = useCallback(
        (align: "left" | "center" | "right" = "left") => {
            editor?.chain().focus().insertContent(buildLogoLineBlock({ align })).run()
        },
        [editor]
    )

    const insertLogoAtCursor = useCallback(
        (url: string, width = DEFAULT_CENTER_LOGO_WIDTH) => {
            if (!editor) return

            const logoHtml = buildLogoImageHtml(url, width)
            const { $from } = editor.state.selection
            const parent = $from.parent

            if (parent.type.name === "paragraph") {
                const hasLogoLineClass = String(parent.attrs.class ?? "").includes(
                    DOCUMENT_LOGO_LINE_CLASS
                )

                if (!hasLogoLineClass) {
                    editor
                        .chain()
                        .focus()
                        .updateAttributes("paragraph", {
                            class: DOCUMENT_LOGO_LINE_CLASS,
                        })
                        .insertContent(logoHtml)
                        .run()
                    return
                }

                editor.chain().focus().insertContent(logoHtml).run()
                return
            }

            editor
                .chain()
                .focus()
                .insertContent(buildLogoLineBlock({ align: "left", logos: [{ url, width }] }))
                .run()
        },
        [editor]
    )

    const alignCurrentLogoRow = useCallback(
        (align: "left" | "center" | "right") => {
            editor?.chain().focus().setTextAlign(align).run()
        },
        [editor]
    )

    const insertImage = useCallback(
        (url: string, options?: { asHeader?: boolean; width?: number }) => {
            if (!editor) return

            if (options?.asHeader) {
                editor
                    .chain()
                    .focus()
                    .insertContentAt(0, buildHeaderImageBlock(url, options.width))
                    .run()
                return
            }

            editor.chain().focus().insertContent(buildLogoImageHtml(url, options?.width)).run()
        },
        [editor]
    )

    const openAssetsModal = useCallback((intent: DocumentTemplateAssetIntent) => {
        setAssetsModalIntent(intent)
        setAssetsModalOpen(true)
    }, [])

    const handleAssetSelect = useCallback(
        (asset: DocumentTemplateAsset, intent: DocumentTemplateAssetIntent) => {
            if (intent === "header-logo") {
                updateHeaderFields({ ...layoutRef.current.headerFields, logoUrl: asset.url })
                return
            }

            if (intent === "logo") {
                insertLogoAtCursor(asset.url)
                return
            }

            insertImage(asset.url, intent === "header" ? { asHeader: true } : undefined)
        },
        [insertImage, insertLogoAtCursor, updateHeaderFields]
    )

    const insertDocumentHeading = useCallback(() => {
        editor?.chain().focus().insertContent(buildDocumentHeadingBlock()).run()
    }, [editor])

    const insertPageBreak = useCallback(() => {
        editor?.chain().focus().insertDocumentPageBreak().run()
    }, [editor])

    const insertVariable = useCallback(
        (key: string) => {
            editor?.chain().focus().insertContent(`{{${key}}}`).run()
        },
        [editor]
    )

    const insertDynamicSection = useCallback(
        (key: string) => {
            editor?.chain().focus().insertContent(`{{${key}}}`).run()
        },
        [editor]
    )

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes("link").href as string | undefined
        const url = window.prompt("Enter URL", previousUrl ?? "https://")
        if (url === null) return
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }, [editor])

    if (!editor) {
        return null
    }

    return (
        <div className={cn("space-y-3", className)}>
            {editable ? (
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography as="span" font="small" className="mr-1 text-muted-foreground uppercase">
                            Heading
                        </Typography>
                        <ToolbarButton
                            label="Heading 1"
                            active={editor.isActive("heading", { level: 1 })}
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 1 }).run()
                            }
                        >
                            <Heading1 className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Heading 2"
                            active={editor.isActive("heading", { level: 2 })}
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 2 }).run()
                            }
                        >
                            <Heading2 className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Heading 3"
                            active={editor.isActive("heading", { level: 3 })}
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 3 }).run()
                            }
                        >
                            <Heading3 className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Normal text"
                            active={editor.isActive("paragraph")}
                            onClick={() => editor.chain().focus().setParagraph().run()}
                        >
                            <Pilcrow className="size-3.5" />
                        </ToolbarButton>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={insertDocumentHeading}
                        >
                            <Type className="size-3.5" />
                            Document title
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <ToolbarButton
                            label="Bold"
                            active={editor.isActive("bold")}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        >
                            <Bold className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Italic"
                            active={editor.isActive("italic")}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        >
                            <Italic className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Underline"
                            active={editor.isActive("underline")}
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                        >
                            <UnderlineIcon className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Strikethrough"
                            active={editor.isActive("strike")}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                        >
                            <Strikethrough className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Bullet list"
                            active={editor.isActive("bulletList")}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        >
                            <List className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Ordered list"
                            active={editor.isActive("orderedList")}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        >
                            <ListOrdered className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Align left"
                            active={editor.isActive({ textAlign: "left" })}
                            onClick={() => editor.chain().focus().setTextAlign("left").run()}
                        >
                            <AlignLeft className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Align center"
                            active={editor.isActive({ textAlign: "center" })}
                            onClick={() => editor.chain().focus().setTextAlign("center").run()}
                        >
                            <AlignCenter className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Align right"
                            active={editor.isActive({ textAlign: "right" })}
                            onClick={() => editor.chain().focus().setTextAlign("right").run()}
                        >
                            <AlignRight className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton label="Add link" onClick={setLink}>
                            <Link2 className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Insert table"
                            onClick={() =>
                                editor
                                    .chain()
                                    .focus()
                                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                                    .run()
                            }
                        >
                            <Table2 className="size-3.5" />
                        </ToolbarButton>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={() => openAssetsModal("header")}
                        >
                            <ImageUp className="size-3.5" />
                            Header image
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={() => openAssetsModal("inline")}
                        >
                            <ImageIcon className="size-3.5" />
                            Insert image
                        </Button>
                        <ToolbarButton
                            label="Undo"
                            disabled={!editor.can().undo()}
                            onClick={() => editor.chain().focus().undo().run()}
                        >
                            <Undo2 className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Redo"
                            disabled={!editor.can().redo()}
                            onClick={() => editor.chain().focus().redo().run()}
                        >
                            <Redo2 className="size-3.5" />
                        </ToolbarButton>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Typography as="span" font="small" className="mr-1 text-muted-foreground uppercase">
                            Header &amp; footer
                        </Typography>
                        {hasHeader ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="gap-1.5"
                                onClick={removeDocumentHeader}
                            >
                                <PanelTop className="size-3.5" />
                                Remove header
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="gap-1.5"
                                onClick={addDocumentHeader}
                            >
                                <PanelTop className="size-3.5" />
                                Add header
                            </Button>
                        )}
                        {hasFooter ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="gap-1.5"
                                onClick={removeDocumentFooter}
                            >
                                <PanelBottom className="size-3.5" />
                                Remove footer
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="gap-1.5"
                                onClick={addDocumentFooter}
                            >
                                <PanelBottom className="size-3.5" />
                                Add footer
                            </Button>
                        )}
                    </div>

                    {hasHeader ? (
                        <div className="space-y-3 rounded-md border border-border/70 bg-background/80 p-3">
                            <Typography as="span" font="small" className="font-semibold uppercase">
                                Document header
                            </Typography>
                            <div className="flex flex-wrap items-start gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="gap-1.5"
                                    onClick={() => openAssetsModal("header-logo")}
                                >
                                    <ImageUp className="size-3.5" />
                                    Attach logo
                                </Button>
                                {headerFields.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={headerFields.logoUrl}
                                        alt="Header logo preview"
                                        className="max-h-12 w-auto object-contain"
                                    />
                                ) : null}
                            </div>
                            <div className="space-y-1.5">
                                <Typography as="label" font="small" className="text-muted-foreground">
                                    Contact text (right side)
                                </Typography>
                                <Textarea
                                    value={headerFields.contactText}
                                    rows={2}
                                    onChange={(event) =>
                                        updateHeaderFields({
                                            ...headerFields,
                                            contactText: event.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ) : null}

                    {hasFooter ? (
                        <div className="space-y-3 rounded-md border border-border/70 bg-background/80 p-3">
                            <Typography as="span" font="small" className="font-semibold uppercase">
                                Document footer (4 columns)
                            </Typography>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {(
                                    [
                                        ["column1", "Column 1"],
                                        ["column2", "Column 2"],
                                        ["column3", "Column 3"],
                                        ["column4", "Column 4"],
                                    ] as const
                                ).map(([key, label]) => (
                                    <div key={key} className="space-y-1.5">
                                        <Typography as="label" font="small" className="text-muted-foreground">
                                            {label}
                                        </Typography>
                                        <Textarea
                                            value={footerFields[key]}
                                            rows={4}
                                            onChange={(event) =>
                                                updateFooterFields({
                                                    ...footerFields,
                                                    [key]: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <Typography as="p" font="small" className="text-muted-foreground">
                        Header and footer stay fixed at the top and bottom of every page — like
                        Google Docs and Word. Only the center area is editable for letter content.
                        When content exceeds one page, a new A4 page is added automatically.
                    </Typography>

                    <div className="flex flex-wrap items-center gap-2">
                        <Typography as="span" font="small" className="mr-1 text-muted-foreground uppercase">
                            Pages
                        </Typography>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={insertPageBreak}
                        >
                            <SeparatorHorizontal className="size-3.5" />
                            Page break
                        </Button>
                    </div>

                    <Typography as="p" font="small" className="text-muted-foreground">
                        Content flows across A4 pages automatically. Use Page break to force the
                        next section onto a new page in preview and PDF.
                    </Typography>

                    <div className="flex flex-wrap items-center gap-2">
                        <Typography as="span" font="small" className="mr-1 text-muted-foreground uppercase">
                            Logo placement
                        </Typography>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={() => insertLogoRow("left")}
                        >
                            <Columns3 className="size-3.5" />
                            Logo row
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            onClick={() => openAssetsModal("logo")}
                        >
                            <ImageIcon className="size-3.5" />
                            Add logo
                        </Button>
                        <ToolbarButton
                            label="Align logo row left"
                            active={editor.isActive({ textAlign: "left" })}
                            onClick={() => alignCurrentLogoRow("left")}
                        >
                            <AlignLeft className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Align logo row center"
                            active={editor.isActive({ textAlign: "center" })}
                            onClick={() => alignCurrentLogoRow("center")}
                        >
                            <AlignCenter className="size-3.5" />
                        </ToolbarButton>
                        <ToolbarButton
                            label="Align logo row right"
                            active={editor.isActive({ textAlign: "right" })}
                            onClick={() => alignCurrentLogoRow("right")}
                        >
                            <AlignRight className="size-3.5" />
                        </ToolbarButton>
                    </div>

                    <Typography as="p" font="small" className="text-muted-foreground">
                        Use Logo row for one line with multiple logos. Click Add logo again in the
                        same row to place more logos side by side. Images are picked from the shared
                        template assets library so you can upload once and reuse them.
                    </Typography>

                    <div className="space-y-2">
                        <Typography as="span" font="small" className="text-muted-foreground uppercase">
                            Insert dynamic field
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_MERGE_VARIABLES.map((variable) => (
                                <Button
                                    key={variable.key}
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => insertVariable(variable.key)}
                                    title={variable.label}
                                >
                                    {`{{${variable.key}}}`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Typography as="span" font="small" className="text-muted-foreground uppercase">
                            Insert dynamic section
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_DYNAMIC_SECTIONS.map((section) => (
                                <Button
                                    key={section.key}
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="gap-1.5"
                                    onClick={() => insertDynamicSection(section.key)}
                                    title={section.description}
                                >
                                    <ListChecks className="size-3.5" />
                                    {section.label}
                                </Button>
                            ))}
                        </div>
                        <Typography as="p" font="small" className="text-muted-foreground">
                            Dynamic sections render full blocks in the letter. The requirements
                            checklist auto-marks each box when the student has verified payment,
                            documents, APS, work experience, or English scores.
                        </Typography>
                    </div>
                </div>
            ) : null}

            <DocumentTemplateA4PaginatedSheet
                hasHeader={hasHeader}
                hasFooter={hasFooter}
                headerHtml={buildHeaderHtml(headerFields)}
                footerHtml={buildFooterHtml(footerFields)}
            >
                <EditorContent editor={editor} />
            </DocumentTemplateA4PaginatedSheet>

            <DocumentTemplateAssetsModal
                open={assetsModalOpen}
                intent={assetsModalIntent}
                onOpenChange={setAssetsModalOpen}
                onSelect={handleAssetSelect}
            />
        </div>
    )
})
