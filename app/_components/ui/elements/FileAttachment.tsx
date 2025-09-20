"use client";

import { Download, Eye } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { getFileIcon, getFileTypeDisplay } from "@/app/_utils/fileIconUtils";
import Image from "next/image";

interface FileAttachmentProps {
    url: string;
    fileName: string;
    mimeType: string;
    type: 'image' | 'file';
    className?: string;
}


export function FileAttachment({ url, fileName, mimeType, type, className = "" }: FileAttachmentProps) {
    const displayName = fileName.replace(/ \(\d+\)/, '').replace(/\.\w+$/, '');

    if (type === 'image') {
        return (
            <div className={`inline-block max-w-full ${className}`}>
                <div className="relative group">
                    <div className="max-w-sm rounded-lg overflow-hidden border border-border bg-card">
                        <Image
                            src={url}
                            alt={displayName}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => window.open(url, '_blank')}
                                    className="bg-white/90 hover:bg-white text-black"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = fileName;
                                        link.click();
                                    }}
                                    className="bg-white/90 hover:bg-white text-black"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`inline-block ${className}`}>
            <div className="bg-card border border-border rounded-lg p-4 max-w-sm hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-muted rounded-lg group-hover:bg-accent transition-colors">
                        {getFileIcon(mimeType, fileName)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate" title={displayName}>
                            {displayName}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 !mb-0">
                            {getFileTypeDisplay(mimeType, fileName)}
                        </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            title="Open file"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = fileName;
                                link.click();
                            }}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            title="Download file"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
