import Image from "next/image"
import { cn } from "@/lib/utils"

type OptimizedBackgroundImageProps = {
    src: string
    sizes?: string
    priority?: boolean
    imageClassName?: string
}

export function OptimizedBackgroundImage({
    src,
    sizes = "100vw",
    priority = false,
    imageClassName,
}: OptimizedBackgroundImageProps) {
    return (
        <Image
            src={src}
            alt=""
            fill
            priority={priority}
            sizes={sizes}
            className={cn("object-cover", imageClassName)}
        />
    )
}
