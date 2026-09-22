import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { VisualPageFlowPlan } from "@/lib/document-template/a4-editor-pagination"

export const DOCUMENT_PAGE_FLOW_PLUGIN_KEY = new PluginKey("documentPageFlow")

export const DOCUMENT_PAGE_FLOW_META = "documentPageFlowPlan"

const EMPTY_PLAN: VisualPageFlowPlan = {
    overflowMarginTopByKey: {},
    manualFillHeightByKey: {},
    lineSpacers: [],
    pageCount: 1,
}

function createLineSpacerElement(heightPx: number): HTMLElement {
    const el = document.createElement("div")
    el.dataset.docPageFlowSpacer = "true"
    el.className = "doc-page-flow-spacer"
    el.contentEditable = "false"
    el.setAttribute("aria-hidden", "true")
    el.style.cssText = [
        `height:${Math.max(0, heightPx)}px`,
        "margin:0",
        "padding:0",
        "border:0",
        "width:100%",
        "pointer-events:none",
        "user-select:none",
    ].join(";")
    return el
}

function buildDecorationsFromPlan(doc: Parameters<typeof DecorationSet.create>[0], plan: VisualPageFlowPlan) {
    const decorations: Decoration[] = []

    doc.forEach((node, pos, index) => {
        const key = `block-${index}`

        if (node.type.name === "documentPageBreak" && node.attrs.auto) {
            decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                    style: "display: none; height: 0; margin: 0; padding: 0; overflow: hidden;",
                })
            )
            return
        }

        const manualFill = plan.manualFillHeightByKey[key]
        const marginTop = plan.overflowMarginTopByKey[key]

        if (manualFill !== undefined) {
            decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                    style: `height: ${manualFill}px; margin: 0; padding: 0; overflow: hidden;`,
                })
            )
            return
        }

        if (marginTop !== undefined && marginTop > 0) {
            decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                    style: `margin-top: ${marginTop}px !important;`,
                    class: "doc-page-flow-push",
                })
            )
        }
    })

    for (const spacer of plan.lineSpacers ?? []) {
        if (spacer.heightPx <= 0.5) {
            continue
        }
        if (spacer.pos < 0 || spacer.pos > doc.content.size) {
            continue
        }
        const heightPx = spacer.heightPx
        decorations.push(
            Decoration.widget(
                spacer.pos,
                () => createLineSpacerElement(heightPx),
                {
                    side: -1,
                    key: `doc-page-flow-spacer-${spacer.pos}-${Math.round(heightPx)}`,
                }
            )
        )
    }

    return DecorationSet.create(doc, decorations)
}

export const DocumentPageFlow = Extension.create({
    name: "documentPageFlow",

    addStorage() {
        return {
            plan: EMPTY_PLAN as VisualPageFlowPlan,
        }
    },

    addCommands() {
        return {
            setDocumentPageFlowPlan:
                (plan: VisualPageFlowPlan) =>
                ({ editor, tr, dispatch }) => {
                    this.storage.plan = plan

                    if (!dispatch) {
                        return true
                    }

                    dispatch(tr.setMeta(DOCUMENT_PAGE_FLOW_META, plan))
                    return true
                },
        }
    },

    addProseMirrorPlugins() {
        const storage = this.storage

        return [
            new Plugin({
                key: DOCUMENT_PAGE_FLOW_PLUGIN_KEY,
                state: {
                    init(_, { doc }) {
                        return buildDecorationsFromPlan(doc, storage.plan)
                    },
                    apply(tr, set, _oldState, newState) {
                        const metaPlan = tr.getMeta(DOCUMENT_PAGE_FLOW_META) as
                            | VisualPageFlowPlan
                            | undefined

                        if (metaPlan) {
                            storage.plan = metaPlan
                            return buildDecorationsFromPlan(newState.doc, storage.plan)
                        }

                        // Index-based keys go stale on edit. Clearing overflow margins
                        // until the next layout pass avoids wrong-block pushes (hide /
                        // huge page-2 holes). Layout re-applies the fresh plan immediately.
                        if (tr.docChanged) {
                            return buildDecorationsFromPlan(newState.doc, {
                                overflowMarginTopByKey: {},
                                manualFillHeightByKey: {},
                                lineSpacers: [],
                                pageCount: storage.plan.pageCount,
                            })
                        }

                        return set
                    },
                },
                props: {
                    decorations(state) {
                        return DOCUMENT_PAGE_FLOW_PLUGIN_KEY.getState(state)
                    },
                },
            }),
        ]
    },
})

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        documentPageFlow: {
            setDocumentPageFlowPlan: (plan: VisualPageFlowPlan) => ReturnType
        }
    }
}
