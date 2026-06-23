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
                { class: "document-page-break-label" },
                "— Page break — next letter starts on a new page —",
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
