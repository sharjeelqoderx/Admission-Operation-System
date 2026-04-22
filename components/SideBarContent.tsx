import Image from "next/image";
import { Typography } from "./shared/Typography";
import { cn } from "@/lib/utils";

type SidebarContent = {
    title: string;
    desc: string;
    withOverlay?: boolean;
};

export const SidebarContent = ({
    title,
    desc,
    withOverlay,
}: SidebarContent) => {
    return (
        <div className="h-full w-full text-white mt-auto flex-center space-y-4">

            <div
                className={cn(
                    "px-12 p-4",
                    withOverlay && "bg-black/25 backdrop-blur-md rounded-4xl"
                )}
            >
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={256}
                    height={90}
                    priority
                    className="object-contain block"
                />
            </div>

            <div
                className={cn(
                    "p-4 space-y-6 flex-center",
                    withOverlay && "bg-black/25 backdrop-blur-md rounded-4xl text-white"
                )}
            >
                <Typography
                    as="h2"
                    font="heading"
                    className="max-w-[485px]"
                >
                    {title}
                </Typography>

                <Typography
                    as="p"
                    font="text-lg"
                    className="max-w-[543px]"
                >
                    {desc}
                </Typography>
            </div>
        </div>
    );
};