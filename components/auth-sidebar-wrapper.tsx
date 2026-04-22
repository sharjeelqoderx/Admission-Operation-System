"use client";

import { usePathname } from "next/navigation";
import { BluryCard } from "@/components/shared/blury-card";
import Image from "next/image";
import { Typography } from "./shared/Typography";
import { ReactNode } from "react";
import { SidebarContent } from "./SideBarContent";


type Corner = "tl" | "bl" | "tr" | "br";

type RouteConfig = {
    content: ReactNode,
    ui: {
        bg: string;
        color: string;
        blur: string;
        isCentered: boolean;
        sharpCorners: Corner[];
    };
};

const routeConfig: Record<string, RouteConfig> = {
    "/login": {
        content: (
            <SidebarContent
                title="Your German University Journey Starts Today"
                desc="Access your personalised dashboard, track your application, manage documents, and receive your admission offer — all in one secure platform"
            />
        ),
        ui: {
            bg: "/assets/german-uni.png",
            color: "bg-brand",
            blur: "blur-sm",
            isCentered: true,
            sharpCorners: ["tl", "bl", "tr", "br"],
        },
    },

    "/signup": {
        content: (
            <SidebarContent
                withOverlay={true}
                title="Your German University Journey Starts Today"
                desc="Access your personalised dashboard, track your application, manage documents, and receive your admission offer — all in one secure platform"
            />
        ),
        ui: {
            bg: "/assets/cheerful-team.png",
            color: "",
            blur: "blur-md",
            isCentered: true,
            sharpCorners: ["tl", "bl", "tr", "br"],
        },
    },
    
    "/profile": {
        content: (
            <SidebarContent
                withOverlay={true}
                title="Your German University Journey Starts Today"
                desc="Access your personalised dashboard, track your application, manage documents, and receive your admission offer — all in one secure platform"
            />
        ),
        ui: {
            bg: "/assets/cheerful-team.png",
            color: "",
            blur: "blur-md",
            isCentered: true,
            sharpCorners: ["tl", "bl", "tr", "br"],
        },
    },

    default: {
        content: (
            <SidebarContent
                title="Your German University Journey Starts Today"
                desc="Access your personalised dashboard, track your application, manage documents, and receive your admission offer — all in one secure platform"
            />
        ),
        ui: {
            bg: "/assets/german-uni.png",
            color: "bg-brand",
            blur: "blur-md",
            isCentered: true,
            sharpCorners: ["tl", "bl"],
        },
    },
};


export const AuthSidebarWrapper = () => {
    const pathname = usePathname();

    const { content, ui } =
        routeConfig[pathname] || routeConfig["default"];

    return (
        <div className="w-full h-full flex items-center justify-center">
            <BluryCard
                backgroundImage={ui.bg}
                blendColorClass={ui.color}
                blurAmount={ui.blur}
                isCentered={ui.isCentered}
                sharpCorners={ui.sharpCorners}
                className="w-full h-full border border-white/10 shadow-2xl"
            >
                {content}
            </BluryCard>
        </div>
    );
};