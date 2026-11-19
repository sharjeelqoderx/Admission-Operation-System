"use client"

import { memo, useState } from "react"
import { useEditorState, type Editor } from "@tiptap/react"
import { createTable } from "@tiptap/extension-table"
import {
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowUpToLine,
    Table2,
    Trash2,
} from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export const TABLE_MAX_ROWS = 30
export const TABLE_MAX_COLS = 12

const TABLE_PRESETS = [
    { label: "3 × 3", rows: 3, cols: 3 },
    { label: "2 × 4", rows: 2, cols: 4 },
    { label: "4 × 4", rows: 4, cols: 4 },
] as const

export type TableSize = { rows: number; cols: number }

/** Size of the table that contains the cursor (null when the cursor is outside a table). */
export function getActiveTableSize(editor: Editor): TableSize | null {
    const { $from } = editor.state.selection
    for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth)
        if (node.type.name === "table") {
            return { rows: node.childCount, cols: node.firstChild?.childCount ?? 0 }
        }
    }
    return null
}

function clampInt(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.min(max, Math.max(min, Math.round(value)))
}

/** Grows / shrinks the table the cursor is in until it is `target.rows × target.cols`. */
export function resizeActiveTable(editor: Editor, target: TableSize): boolean {
    let guard = TABLE_MAX_ROWS + TABLE_MAX_COLS + 4
    let size = getActiveTableSize(editor)
    if (!size) return false

    while (size && guard > 0 && (size.cols !== target.cols || size.rows !== target.rows)) {
        guard -= 1
        const chain = editor.chain().focus()
        if (size.cols < target.cols) chain.addColumnAfter().run()
        else if (size.cols > target.cols && size.cols > 1) chain.deleteColumn().run()
        else if (size.rows < target.rows) chain.addRowAfter().run()
        else if (size.rows > target.rows && size.rows > 1) chain.deleteRow().run()
        else break

        const next = getActiveTableSize(editor)
        if (!next || (next.rows === size.rows && next.cols === size.cols)) break
        size = next
    }

    return true
}

function NumberField({
    label,
    value,
    max,
    onChange,
}: {
    label: string
    value: number
    max: number
    onChange: (value: number) => void
}) {
    // Local text so the field can be cleared and retyped (a clamped controlled value
    // snapped back to 1 and turned "3" into "13").
    const [text, setText] = useState(String(value))
    const [syncedValue, setSyncedValue] = useState(value)

    // Follow outside changes (presets, the table under the cursor) without an effect.
    if (syncedValue !== value) {
        setSyncedValue(value)
        setText(String(value))
    }

    return (
        <label className="flex flex-1 flex-col gap-1">
            <Typography as="span" font="small">{label}</Typography>
            <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                value={text}
                className="h-8"
                onChange={(event) => {
                    setText(event.target.value)
                    const parsed = Number(event.target.value)
                    if (event.target.value.trim() !== "" && Number.isFinite(parsed)) {
                        onChange(clampInt(parsed, 1, max))
                    }
                }}
                onBlur={() => setText(String(value))}
            />
        </label>
    )
}

/**
 * Toolbar "Table" menu. Choose rows × columns before inserting; once the cursor is
 * inside a table the same menu resizes it and adds / removes rows and columns.
 */
export const DocumentEditorTableMenu = memo(function DocumentEditorTableMenu({
    editor,
}: {
    editor: Editor
}) {
    const [open, setOpen] = useState(false)
    const [rows, setRows] = useState(3)
    const [cols, setCols] = useState(3)
    const [withHeaderRow, setWithHeaderRow] = useState(false)
    const [resizeRows, setResizeRows] = useState(3)
    const [resizeCols, setResizeCols] = useState(3)

    const activeSize = useEditorState({
        editor,
        selector: ({ editor: current }) => getActiveTableSize(current),
        equalityFn: (a, b) => a?.rows === b?.rows && a?.cols === b?.cols,
    })
    const inTable = activeSize !== null

    // Keep the resize inputs in sync with the table under the cursor when the menu opens.
    const handleOpenChange = (next: boolean) => {
        setOpen(next)
        if (!next) return
        const size = getActiveTableSize(editor)
        if (size) {
            setResizeRows(size.rows)
            setResizeCols(size.cols)
        }
    }

    const insert = () => {
        const { $from } = editor.state.selection
        let afterTablePos: number | null = null
        for (let depth = $from.depth; depth > 0; depth -= 1) {
            if ($from.node(depth).type.name === "table") {
                afterTablePos = $from.after(depth)
                break
            }
        }

        if (afterTablePos !== null) {
            // Cursor is inside a table: place the new one after it instead of nesting it in a cell.
            const table = createTable(editor.schema, rows, cols, withHeaderRow)
            editor
                .chain()
                .focus()
                .insertContentAt(afterTablePos, table.toJSON())
                .run()
        } else {
            editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run()
        }
        setOpen(false)
    }

    const run = (action: (chain: ReturnType<Editor["chain"]>) => { run: () => boolean }) => {
        action(editor.chain().focus()).run()
        const size = getActiveTableSize(editor)
        if (size) {
            setResizeRows(size.rows)
            setResizeCols(size.cols)
        }
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={inTable ? "secondary" : "ghost"}
                    size="xs"
                    className="gap-1"
                    aria-label="Table"
                >
                    <Table2 className="size-3.5" />
                    Table
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="z-[60] w-72 space-y-4 p-3">
                <div className="space-y-2">
                    <Typography as="span" font="small" className="font-semibold uppercase text-muted-foreground">
                        Insert table
                    </Typography>
                    <div className="flex gap-2">
                        <NumberField label="Rows" value={rows} max={TABLE_MAX_ROWS} onChange={setRows} />
                        <NumberField label="Columns" value={cols} max={TABLE_MAX_COLS} onChange={setCols} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {TABLE_PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                type="button"
                                size="xs"
                                variant={rows === preset.rows && cols === preset.cols ? "secondary" : "outline"}
                                onClick={() => {
                                    setRows(preset.rows)
                                    setCols(preset.cols)
                                }}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={withHeaderRow}
                            onChange={(event) => setWithHeaderRow(event.target.checked)}
                        />
                        First row is a header
                    </label>
                    <Button type="button" size="sm" className="w-full" onClick={insert}>
                        Insert {rows} × {cols} table
                    </Button>
                </div>

                <div className={cn("space-y-3 border-t pt-3", !inTable && "opacity-60")}>
                    <Typography as="span" font="small" className="font-semibold uppercase text-muted-foreground">
                        {inTable
                            ? `Edit table (${activeSize.rows} rows × ${activeSize.cols} columns)`
                            : "Edit table — click inside a table first"}
                    </Typography>

                    <div className="flex items-end gap-2">
                        <NumberField label="Rows" value={resizeRows} max={TABLE_MAX_ROWS} onChange={setResizeRows} />
                        <NumberField label="Columns" value={resizeCols} max={TABLE_MAX_COLS} onChange={setResizeCols} />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!inTable}
                            onClick={() => resizeActiveTable(editor, { rows: resizeRows, cols: resizeCols })}
                        >
                            Resize
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                        <Button type="button" size="xs" variant="outline" disabled={!inTable} className="justify-start gap-1" onClick={() => run((c) => c.addRowBefore())}>
                            <ArrowUpToLine className="size-3.5" />Row above
                        </Button>
                        <Button type="button" size="xs" variant="outline" disabled={!inTable} className="justify-start gap-1" onClick={() => run((c) => c.addRowAfter())}>
                            <ArrowDownToLine className="size-3.5" />Row below
                        </Button>
                        <Button type="button" size="xs" variant="outline" disabled={!inTable} className="justify-start gap-1" onClick={() => run((c) => c.addColumnBefore())}>
                            <ArrowLeftToLine className="size-3.5" />Column left
                        </Button>
                        <Button type="button" size="xs" variant="outline" disabled={!inTable} className="justify-start gap-1" onClick={() => run((c) => c.addColumnAfter())}>
                            <ArrowRightToLine className="size-3.5" />Column right
                        </Button>
                        <Button type="button" size="xs" variant="outline" disabled={!inTable || (activeSize?.rows ?? 0) <= 1} className="justify-start gap-1" onClick={() => run((c) => c.deleteRow())}>
                            <Trash2 className="size-3.5" />Delete row
                        </Button>
                        <Button type="button" size="xs" variant="outline" disabled={!inTable || (activeSize?.cols ?? 0) <= 1} className="justify-start gap-1" onClick={() => run((c) => c.deleteColumn())}>
                            <Trash2 className="size-3.5" />Delete column
                        </Button>
                    </div>

                    <div className="flex gap-1">
                        <Button type="button" size="xs" variant="outline" disabled={!inTable} className="flex-1" onClick={() => run((c) => c.toggleHeaderRow())}>
                            Toggle header row
                        </Button>
                        <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={!inTable}
                            className="flex-1 gap-1 text-destructive"
                            onClick={() => {
                                editor.chain().focus().deleteTable().run()
                                setOpen(false)
                            }}
                        >
                            <Trash2 className="size-3.5" />Delete table
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
})
