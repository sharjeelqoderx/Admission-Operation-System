import React from "react"
import { cn } from "@/lib/utils"

type FontVariant =
    | "heading"
    | "sub-heading"
    | "title"
    | "text-lg"
    | "text-xl"
    | "text"
    | "small"
    | "sub-text"

type TypographyProps = {
    children: React.ReactNode
    font?: FontVariant
    className?: string
    as?: React.ElementType
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className">

export const Typography = ({
    children,
    font = "text",
    className,
    as: Component = "p",
    ...rest
}: TypographyProps) => {
    const styles: Record<FontVariant, string> = {
        heading: "text-[34px] font-bold leading-tight",
        "sub-heading": "text-[30px] font-semibold leading-tight",
        title: "text-[20px] font-semibold",
        "text-xl": "text-[24px] font-bold",
        "text-lg": "text-[18px] font-normal",
        text: "text-[16px] font-normal",
        "sub-text": "text-[14px] font-normal",
        small: "text-[12px] font-bold",
    }

    return (
        <Component className={cn(styles[font], className)} {...rest}>
            {children}
        </Component>
    )
}
