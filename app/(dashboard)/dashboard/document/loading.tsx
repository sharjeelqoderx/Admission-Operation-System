import { ListPageSkeleton } from "@/components/shared/page-skeleton"

export default function Loading() {
    return (
        <div className="min-h-[60vh]">
            <ListPageSkeleton />
        </div>
    )
}
