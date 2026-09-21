import Paragraph from "@tiptap/extension-paragraph"

/** One Enter = next line (Google Docs-style paragraph split). */
export const DocumentParagraph = Paragraph.extend({
    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => editor.chain().splitBlock().focus().run(),
        }
    },

    addAttributes() {
        return {
            ...this.parent?.(),
            class: {
                default: null,
                parseHTML: (element) => element.getAttribute("class"),
                renderHTML: (attributes) =>
                    attributes.class ? { class: attributes.class } : {},
            },
            style: {
                default: null,
                parseHTML: (element) => element.getAttribute("style"),
                renderHTML: (attributes) =>
                    attributes.style ? { style: attributes.style } : {},
            },
        }
    },
})
