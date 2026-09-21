import { Node, mergeAttributes } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"
import { DOCUMENT_PAGE_BREAK_CLASS } from "@/lib/document-template/a4-document"

function findPageBreakPosNear(doc: ProseMirrorNode, anchor: number) {
    let breakPos: number | null = null

    doc.nodesBetween(
        Math.max(0, anchor - 4),
        Math.min(doc.content.size, anchor + 4),
        (node, pos) => {
            if (node.type.name === "documentPageBreak") {
                breakPos = pos
            }
        }
    )

    return breakPos
}

export const DocumentPageBreak = Node.create({
    name: "documentPageBreak",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            auto: {
                default: false,
                parseHTML: (element) => element.getAttribute("data-auto-page-break") === "true",
                renderHTML: (attributes) =>
                    attributes.auto ? { "data-auto-page-break": "true" } : {},
            },
        }
    },

    parseHTML() {
        return [{ tag: `div.${DOCUMENT_PAGE_BREAK_CLASS}` }]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                class: DOCUMENT_PAGE_BREAK_CLASS,
                "data-page-break": "true",
                contenteditable: "false",
            }),
        ]
    },

    addCommands() {
        return {
            insertDocumentPageBreak:
                () =>
                ({ chain, state }) => {
                    const insertPos = state.selection.from

                    return chain()
                        .insertContentAt(insertPos, {
                            type: this.name,
                            attrs: { auto: false },
                        })
                        .command(({ tr, dispatch }) => {
                            if (!dispatch) {
                                return true
                            }

                            const breakPos = findPageBreakPosNear(tr.doc, insertPos)

                            if (breakPos === null) {
                                dispatch(tr)
                                return true
                            }

                            const breakNode = tr.doc.nodeAt(breakPos)

                            if (!breakNode) {
                                dispatch(tr)
                                return true
                            }

                            const afterBreak = breakPos + breakNode.nodeSize
                            tr.setSelection(
                                TextSelection.near(tr.doc.resolve(afterBreak), 1)
                            )
                            dispatch(tr)
                            return true
                        })
                        .focus()
                        .scrollIntoView()
                        .run()
                },
        }
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                const { selection } = editor.state

                if (
                    selection instanceof NodeSelection &&
                    selection.node.type.name === this.name
                ) {
                    const afterBreak = selection.from + selection.node.nodeSize
                    editor
                        .chain()
                        .setTextSelection(afterBreak)
                        .focus()
                        .scrollIntoView()
                        .run()
                    return true
                }

                return false
            },
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
