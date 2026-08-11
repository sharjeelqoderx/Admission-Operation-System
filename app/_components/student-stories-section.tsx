"use client"

import { useCallback, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, FileText, Play, Star } from "lucide-react"
import { Typography } from "@/components/shared/Typography"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"

export type StoryTestimonial = {
    quote: string
    name: string
    degree: string
    role: string
    avatar: string
}

export type VideoStory = {
    id: string
    youtubeId: string
    title: string
    name: string
    subtitle: string
    duration: string
    avatar: string
    kind?: "review" | "campus" | "guide"
}

type StudentStoriesSectionProps = {
    testimonials: StoryTestimonial[]
    videoStories: VideoStory[]
    youtubeChannelUrl?: string
}

const cardWhite = "rounded-2xl border border-gray-100 bg-white shadow-sm"
const gradBtn = "rounded-xl bg-gradient-to-r from-brand-blue to-brand-byzantine font-semibold text-white hover:opacity-90"

function VideoStoryCard({ story, onPlay }: { story: VideoStory; onPlay: (story: VideoStory) => void }) {
    const hasEmbed = Boolean(story.youtubeId)
    const thumbnailSrc = hasEmbed
        ? `https://img.youtube.com/vi/${story.youtubeId}/maxresdefault.jpg`
        : "/assets/german-uni.png"

    const handlePlay = useCallback(() => {
        if (hasEmbed) onPlay(story)
    }, [hasEmbed, onPlay, story])

    return (
        <div className={`${cardWhite} overflow-hidden`}>
            <div className="relative aspect-video w-full bg-brand-input">
                <Image
                    src={thumbnailSrc}
                    alt={story.title}
                    fill
                    className="object-cover"
                    unoptimized={hasEmbed}
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-brand-primary/20" />
                <button
                    type="button"
                    onClick={handlePlay}
                    aria-label={`Play ${story.title}`}
                    disabled={!hasEmbed}
                    className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Play className="ml-1 size-6 fill-brand-byzantine text-brand-byzantine" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white">
                    {story.duration}
                </span>
                {story.kind === "campus" && (
                    <span className="absolute left-3 top-3 rounded bg-brand-byzantine px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Campus Tour
                    </span>
                )}
                {story.kind === "guide" && (
                    <span className="absolute left-3 top-3 rounded bg-brand-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Guide
                    </span>
                )}
            </div>
            <div className="p-5">
                {story.kind === "campus" ? (
                    <Camera className="mb-2 size-4 text-brand-byzantine" />
                ) : story.kind === "guide" ? (
                    <FileText className="mb-2 size-4 text-brand-byzantine" />
                ) : (
                    <div className="mb-2 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                )}
                <Typography as="p" font="sub-text" className="mb-4 font-semibold text-brand-primary">
                    &ldquo;{story.title}&rdquo;
                </Typography>
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-brand-byzantine/10 text-xs font-bold text-brand-byzantine">
                        {story.avatar}
                    </div>
                    <div>
                        <Typography as="p" font="small" className="text-brand-primary">
                            {story.name}
                        </Typography>
                        <Typography as="p" font="sub-text" className="text-brand-byzantine">
                            {story.subtitle}
                        </Typography>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function StudentStoriesSection({
    testimonials,
    videoStories,
    youtubeChannelUrl = "https://www.youtube.com/@FHMInternational",
}: StudentStoriesSectionProps) {
    const [activeTab, setActiveTab] = useState<"written" | "video">("written")
    const [activeStory, setActiveStory] = useState<VideoStory | null>(null)

    const handlePlay = useCallback((story: VideoStory) => {
        setActiveStory(story)
    }, [])

    const handleModalChange = useCallback((open: boolean) => {
        if (!open) setActiveStory(null)
    }, [])

    return (
        <>
            <div className="mb-10 inline-flex rounded-full border border-gray-200 bg-white p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("written")}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "written" ? gradBtn : "text-muted-foreground hover:text-brand-primary"
                    }`}
                >
                    💬 Written Reviews
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("video")}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "video" ? gradBtn : "text-muted-foreground hover:text-brand-primary"
                    }`}
                >
                    ▶ Video Stories
                </button>
            </div>

            {activeTab === "written" ? (
                <div className="grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((item) => (
                        <div key={item.name} className={`${cardWhite} p-6`}>
                            <div className="mb-3 flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <Typography as="p" font="sub-text" className="mb-6 italic text-muted-foreground">
                                &ldquo;{item.quote}&rdquo;
                            </Typography>
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-brand-byzantine/10 text-sm font-bold text-brand-byzantine">
                                    {item.avatar}
                                </div>
                                <div>
                                    <Typography as="p" font="small" className="text-brand-primary">
                                        {item.name}
                                    </Typography>
                                    <Typography as="p" font="sub-text" className="text-brand-byzantine">
                                        {item.degree}
                                    </Typography>
                                    <Typography as="p" font="sub-text" className="text-muted-foreground">
                                        {item.role}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
                    {videoStories.map((story) => (
                        <VideoStoryCard key={story.id} story={story} onPlay={handlePlay} />
                    ))}
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-byzantine/20 bg-brand-byzantine/5 p-8 text-center">
                        <span className="mb-4 text-4xl">🎥</span>
                        <Typography as="h3" font="title" className="mb-3 text-brand-primary">
                            More Videos on YouTube
                        </Typography>
                        <Typography as="p" font="sub-text" className="mb-6 text-muted-foreground">
                            Watch campus tours, programme overviews and student day-in-the-life videos on FHM&apos;s official YouTube channel.
                        </Typography>
                        <Link href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                            <Button className={`${gradBtn} px-6`}>Visit YouTube Channel →</Button>
                        </Link>
                    </div>
                </div>
            )}

            <Dialog open={activeStory !== null} onOpenChange={handleModalChange}>
                <DialogContent
                    showCloseButton
                    className="max-w-[min(960px,calc(100%-1.5rem))] gap-0 overflow-hidden border-0 bg-black p-0 sm:max-w-[min(960px,calc(100%-1.5rem))]"
                >
                    <DialogTitle className="sr-only">{activeStory?.title ?? "Video player"}</DialogTitle>
                    <DialogDescription className="sr-only">{activeStory?.subtitle}</DialogDescription>
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                        {activeStory?.youtubeId ? (
                            <iframe
                                key={activeStory.youtubeId}
                                src={`https://www.youtube.com/embed/${activeStory.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                                title={activeStory.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                                className="absolute inset-0 size-full border-0"
                            />
                        ) : null}
                    </div>
                    {activeStory ? (
                        <div className="border-t border-white/10 bg-brand-primary px-4 py-3 text-left sm:px-5">
                            <Typography as="p" font="title" className="text-white">
                                {activeStory.title}
                            </Typography>
                            <Typography as="p" font="sub-text" className="text-white/70">
                                {activeStory.name} · {activeStory.subtitle}
                            </Typography>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    )
}
