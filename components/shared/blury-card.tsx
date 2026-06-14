import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface CustomAuthCardProps {
    children: React.ReactNode;
    backgroundImage?: string;
    blurAmount?: string;
    sharpCorners?: ("tl" | "tr" | "bl" | "br")[];
    isCentered?: boolean;
    childClass?: string;
    className?: string;
    overlayColor?: string; // Example: "bg-blue-900/50" ya "bg-black/40"
    blendMode?: string;    // Example: "mix-blend-multiply" ya "mix-blend-overlay
}
export const BluryCard = ({
    children,
    backgroundImage,
    childClass = "",
    blurAmount = "backdrop-blur-md",
    sharpCorners = [],
    isCentered = true,
    className,
    blendColorClass,
    overlayColor = "bg-black/40",
}: CustomAuthCardProps & { blendColorClass?: string }) => {

    const cornerMap = {
        tl: "rounded-tl-none",
        tr: "rounded-tr-none",
        bl: "rounded-bl-none",
        br: "rounded-br-none",
    };

    const sharpClasses = sharpCorners.map((c) => cornerMap[c]).join(" ");

    return (
        <Card
            className={cn(
                "relative overflow-hidden bg-brand-secondary/3 ring-0 border-x border-white/40 rounded-l-lg rounded-r-lg",
                sharpClasses,
                (!backgroundImage ? blurAmount : ''),
                className
            )}
        >
            <div className={cn("absolute inset-0 z-0", blendColorClass)}>
                {backgroundImage && (
                    <div
                        className={cn(
                            "absolute inset-0 w-full h-full",
                            blurAmount
                        )}
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundColor: "inherit",
                            backgroundBlendMode: "multiply",
                        }}
                    />
                )}
            </div>

            <div
                className={cn(
                    "relative z-10 h-full w-full p-4 md:p-8",
                    childClass,
                    isCentered
                        ? "flex flex-col items-center justify-center text-center"
                        : "block"
                )}
            >
                {children}
            </div>
        </Card>
    );
};


// import React from "react";
// import { cn } from "@/lib/utils";
// import { Card } from "@/components/ui/card";

// interface BluryCardProps {
//     children: React.ReactNode;
//     backgroundImage?: string;
//     blurAmount?: string;
//     backdropBlur?: string;
//     blendColorClass?: string;
//     sharpCorners?: ("tl" | "tr" | "bl" | "br")[];
//     isCentered?: boolean;
//     className?: string;
// }

// export const BluryCard = ({
//     children,
//     backgroundImage,
//     blurAmount = "blur-md",
//     backdropBlur = "backdrop-blur-md",
//     blendColorClass,
//     sharpCorners = [],
//     isCentered = true,
//     className,
// }: BluryCardProps) => {

//     const cornerMap = {
//         tl: "rounded-tl-none",
//         tr: "rounded-tr-none",
//         bl: "rounded-bl-none",
//         br: "rounded-br-none",
//     };

//     const sharpClasses = sharpCorners.map((c) => cornerMap[c]).join(" ");

//     return (
//         <Card
//             className={cn(
//                 "relative overflow-hidden border-none bg-transparent",
//                 !backgroundImage && backdropBlur,
//                 "rounded-[2rem]",
//                 sharpClasses,
//                 className
//             )}
//         >
//             {/* Backdrop blur overlay for glassmorphism (no image) */}
//             {!backgroundImage && blendColorClass && (
//                 <div className={cn("absolute inset-0 z-0", blendColorClass)} />
//             )}

//             {/* Background image with blur + color overlay */}
//             {backgroundImage && (
//                 <>
//                     <div
//                         className={cn("absolute inset-0 z-[1] scale-110", blurAmount)}
//                         style={{
//                             backgroundImage: `url(${backgroundImage})`,
//                             backgroundSize: "cover",
//                             backgroundPosition: "center",
//                         }}
//                     />
//                     {blendColorClass && (
//                         <div className={cn("absolute inset-0 z-[2] opacity-60", blendColorClass)} />
//                     )}
//                 </>
//             )}

//             <div
//                 className={cn(
//                     "relative z-10 h-full w-full p-8",
//                     isCentered
//                         ? "flex flex-col items-center justify-center text-center"
//                         : "block"
//                 )}
//             >
//                 {children}
//             </div>
//         </Card>
//     );
// };