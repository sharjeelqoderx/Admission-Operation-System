import Paragraph from "@tiptap/extension-paragraph"

export const DocumentParagraph = Paragraph.extend({
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
