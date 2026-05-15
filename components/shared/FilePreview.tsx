"use client";

import React from "react";
import { 
    FileText, 
    FileSpreadsheet, 
    Image as ImageIcon, 
    File as FileIcon, 
    Download, 
    ExternalLink,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
    url: string;
    name?: string;
    className?: string;
    showActions?: boolean;
}

export const FilePreview = ({ 
    url, 
    name, 
    className, 
    showActions = true 
}: FilePreviewProps) => {
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase() || "";

    
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
    const isPdf = extension === "pdf";
    const isExcel = ["xls", "xlsx", "csv"].includes(extension);
    const isWord = ["doc", "docx"].includes(extension);

    const getFileIcon = () => {
        if (isPdf) return <FileText className="size-10 text-red-500" />;
        if (isExcel) return <FileSpreadsheet className="size-10 text-green-600" />;
        if (isWord) return <FileText className="size-10 text-blue-600" />;
        return <FileIcon className="size-10 text-gray-400" />;
    };

    const getFileTypeLabel = () => {
        if (isPdf) return "PDF Document";
        if (isExcel) return "Excel Spreadsheet";
        if (isWord) return "Word Document";
        return "File";
    };

    return (
        <div className={cn(
            "group relative rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm transition-all",
            className
        )}>
            {/* Preview Area */}
            <div className="aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
                {isImage ? (
                    <img 
                        src={url} 
                        alt={name || "Preview"} 
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div className="size-20 rounded-2xl bg-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                            {getFileIcon()}
                        </div>
                        <div className="space-y-1">
                            <Typography font="small" className="text-gray-400 uppercase tracking-widest">
                                {getFileTypeLabel()}
                            </Typography>
                            {name && (
                                <Typography font="small" className="text-gray-700 line-clamp-1 max-w-[150px]">
                                    {name}
                                </Typography>
                            )}
                        </div>

                    </div>
                )}

                {/* Hover Overlay */}
                {/* <div className="absolute inset-0 bg-brand-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full size-10 shadow-lg hover:scale-110 transition-transform"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <a href={url} download={name || "file"}>
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="rounded-full size-10 shadow-lg hover:scale-110 transition-transform"
                        >
                            <Download className="size-4" />
                        </Button>
                    </a>
                </div> */}
            </div>

            {/* Info Footer (Optional) */}
            {name && !isImage && (
                <div className="p-3 border-t border-gray-50 bg-white">
                    <Typography font="small" className="text-gray-600 truncate">
                        {name}
                    </Typography>
                </div>
            )}

        </div>
    );
};
