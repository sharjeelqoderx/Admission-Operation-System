import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "min-h-28 w-full min-w-0 resize-y rounded-sm border-none bg-brand-input px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-purple-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
