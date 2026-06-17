"use client"

import { memo, useCallback, useEffect, useRef } from "react"
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
import { useMutation } from "@tanstack/react-query"
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
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
    Redo2,
    Strikethrough,
    Table2,
    Type,
    UnderlineIcon,
    Undo2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/shared/Typography"
import { ErrorView } from "@/components/shared/error-view"
import { DocumentCenterLogoPlaceholder } from "./document-center-logo-placeholder"
import {
    A4_DOCUMENT_CONTENT_CLASS,
    A4_DOCUMENT_PAGE_CLASS,
    A4_DOCUMENT_SHEET_WRAPPER_CLASS,
    DEFAULT_CENTER_LOGO_WIDTH,
    DOCUMENT_CENTER_LOGO_CLASS,
    DOCUMENT_HEADER_IMAGE_CLASS,
    DOCUMENT_IMAGE_CLASS,
    buildCenterLogoBlock,
    buildDocumentHeadingBlock,
    buildImageHtml,
    hasCenterLogo,
} from "@/lib/document-template/a4-document"
import { TEMPLATE_MERGE_VARIABLES } from "@/lib/document-template/variables"
import { cn } from "@/lib/utils"

type DocumentTemplateEditorProps = {
    content: string
    editable?: boolean
    onChange?: (html: string) => void
    className?: string
}

async function uploadTemplateImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.set("file", file)

    const res = await fetch("/api/document-template/upload-image", {
        method: "POST",
        body: formData,
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
        throw new Error(json?.error ?? "Failed to upload image")
    }

    return json.data.url as string
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
    const headerImageInputRef = useRef<HTMLInputElement>(null)
    const inlineImageInputRef = useRef<HTMLInputElement>(null)
    const centerLogoInputRef = useRef<HTMLInputElement>(null)

    const uploadImageMutation = useMutation({
        mutationFn: uploadTemplateImage,
    })

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
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
                inline: false,
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
        content,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML())
        },
        editorProps: {
            attributes: {
                class: A4_DOCUMENT_CONTENT_CLASS,
            },
        },
    })

    useEffect(() => {
        if (!editor) return
        if (editor.getHTML() !== content) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
    }, [content, editor])

    useEffect(() => {
        if (!editor) return
        editor.setEditable(editable)
    }, [editable, editor])

    const upsertCenterLogo = useCallback(
        (url: string, width = DEFAULT_CENTER_LOGO_WIDTH) => {
            if (!editor) return

            const html = editor.getHTML()
            const centerLogoBlock = buildCenterLogoBlock(url, width)

            if (hasCenterLogo(html)) {
                const updated = html.replace(
                    /<p[^>]*>\s*<img[^>]*class="[^"]*(document-center-logo|document-default-icon)[^"]*"[^>]*>\s*<\/p>/i,
                    centerLogoBlock
                )

                editor.commands.setContent(updated, { emitUpdate: true })
                return
            }

            const headerMatch = html.match(
                /<img[^>]*class="[^"]*document-header-image[^"]*"[^>]*>/i
            )

            if (headerMatch) {
                const insertPos = html.indexOf(headerMatch[0]) + headerMatch[0].length
                editor.commands.setContent(
                    `${html.slice(0, insertPos)}${centerLogoBlock}${html.slice(insertPos)}`,
                    { emitUpdate: true }
                )
                return
            }

            editor.chain().focus().insertContentAt(0, centerLogoBlock).run()
        },
        [editor]
    )

    const insertImage = useCallback(
        (url: string, options?: { asHeader?: boolean; width?: number }) => {
            if (!editor) return

            const imageHtml = buildImageHtml(url, {
                className: options?.asHeader ? DOCUMENT_HEADER_IMAGE_CLASS : DOCUMENT_IMAGE_CLASS,
                alt: options?.asHeader ? "Document header" : "Document image",
                width: options?.width,
            })

            if (options?.asHeader) {
                editor.chain().focus().insertContentAt(0, imageHtml).run()
                return
            }

            editor.chain().focus().insertContent(imageHtml).run()
        },
        [editor]
    )

    const handleImageUpload = useCallback(
        async (
            file: File,
            options?: { asHeader?: boolean; asCenterLogo?: boolean; width?: number }
        ) => {
            const toastId = toast.loading(
                options?.asCenterLogo
                    ? "Uploading center logo..."
                    : options?.asHeader
                      ? "Uploading header image..."
                      : "Uploading image..."
            )

            try {
                const url = await uploadImageMutation.mutateAsync(file)

                if (options?.asCenterLogo) {
                    upsertCenterLogo(url, options.width)
                } else {
                    insertImage(url, options)
                }

                toast.success("Image uploaded successfully.", { id: toastId })
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "Failed to upload image",
                    { id: toastId }
                )
            }
        },
        [insertImage, upsertCenterLogo, uploadImageMutation]
    )

    const onHeaderImageSelected = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return
            await handleImageUpload(file, { asHeader: true })
        },
        [handleImageUpload]
    )

    const onInlineImageSelected = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return
            await handleImageUpload(file)
        },
        [handleImageUpload]
    )

    const onCenterLogoSelected = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (!file) return
            await handleImageUpload(file, { asCenterLogo: true })
        },
        [handleImageUpload]
    )

    const insertDocumentHeading = useCallback(() => {
        editor?.chain().focus().insertContent(buildDocumentHeadingBlock()).run()
    }, [editor])

    const insertVariable = useCallback(
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

    const isUploading = uploadImageMutation.isPending
    const showCenterPlaceholder = !hasCenterLogo(editor.getHTML())

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
                            disabled={isUploading}
                            onClick={() => headerImageInputRef.current?.click()}
                        >
                            <ImageUp className="size-3.5" />
                            Header image
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            disabled={isUploading}
                            onClick={() => centerLogoInputRef.current?.click()}
                        >
                            <ImageIcon className="size-3.5" />
                            Center logo
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="gap-1.5"
                            disabled={isUploading}
                            onClick={() => inlineImageInputRef.current?.click()}
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

                    <Typography as="p" font="small" className="text-muted-foreground">
                        A faint center logo placeholder is shown until you upload a center logo.
                        Click any image to resize it.
                    </Typography>

                    <input
                        ref={headerImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={onHeaderImageSelected}
                    />
                    <input
                        ref={centerLogoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={onCenterLogoSelected}
                    />
                    <input
                        ref={inlineImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={onInlineImageSelected}
                    />

                    {uploadImageMutation.isError ? (
                        <ErrorView
                            message={
                                uploadImageMutation.error instanceof Error
                                    ? uploadImageMutation.error.message
                                    : "Failed to upload image"
                            }
                        />
                    ) : null}

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
                </div>
            ) : null}

            <div className={A4_DOCUMENT_SHEET_WRAPPER_CLASS}>
                <div className={A4_DOCUMENT_PAGE_CLASS}>
                    {showCenterPlaceholder ? <DocumentCenterLogoPlaceholder /> : null}
                    <div className="relative z-10">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    )
})
