import { Node, mergeAttributes } from "@tiptap/core"
import { DOCUMENT_PAGE_BREAK_CLASS } from "@/lib/document-template/a4-document"

export const DocumentPageBreak = Node.create({
    name: "documentPageBreak",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    parseHTML() {
        return [{ tag: `div.${DOCUMENT_PAGE_BREAK_CLASS}` }]
    },

    renderHTML() {
        return [
            "div",
            mergeAttributes({
                class: DOCUMENT_PAGE_BREAK_CLASS,
                "data-page-break": "true",
                contenteditable: "false",
            }),
            [
                "span",
                { class: "document-page-break-badge" },
                [
                    "span",
                    { class: "document-page-break-badge-text", "data-page-break-badge-text": "true" },
                    "— Page break —",
                ],
                [
                    "span",
                    {
                        class: "document-page-break-action",
                        "data-page-break-action": "remove",
                        title:
                            "Remove this page break — the content flows together onto one page",
                    },
                    "Remove break",
                ],
                [
                    "span",
                    {
                        class: "document-page-break-action",
                        "data-page-break-action": "delete-page",
                        "data-page-break-action-label": "true",
                        title:
                            "Delete this page break and all content of the page after it (Ctrl+Z to undo)",
                    },
                    "Delete page",
                ],
            ],
        ]
    },

    addCommands() {
        return {
            insertDocumentPageBreak:
                () =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                    }),
        }
    },
})

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        documentPageBreak: {
            insertDocumentPageBreak: () => ReturnType
        }
    }
}
