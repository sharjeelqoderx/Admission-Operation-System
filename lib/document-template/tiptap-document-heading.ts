import Heading from "@tiptap/extension-heading"

/** One Enter after a heading always starts a normal paragraph on the next line. */
export const DocumentHeading = Heading.extend({
    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) =>
                editor.chain().splitBlock().setParagraph().focus().run(),
        }
    },
})
