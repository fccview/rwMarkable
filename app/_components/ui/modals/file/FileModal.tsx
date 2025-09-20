"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Image as ImageIcon, Trash2, File, Download, Eye, Paperclip } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Modal } from "@/app/_components/ui/elements/modal";
import { uploadFileAction, getFilesAction, deleteFileAction, FileItem } from "@/app/_server/actions/data/file-actions";
import { getFileIcon, formatFileSize } from "@/app/_utils/fileIconUtils";
import Image from "next/image";

interface FileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFile: (url: string, type: 'image' | 'file', fileName?: string, mimeType?: string) => void;
    category: string;
}


export function FileModal({ isOpen, onClose, onSelectFile, category }: FileModalProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'images' | 'files'>('images');

    const loadFiles = useCallback(async () => {
        setIsLoading(true);
        const result = await getFilesAction();
        if (result.success && result.data) {
            setFiles(result.data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadFiles();
        }
    }, [isOpen, loadFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const result = await uploadFileAction(formData);
            if (result.success) {
                setSelectedFile(null);
                await loadFiles();
            } else {
                alert(result.error || "Failed to upload file");
            }
        } catch (error) {
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFile = async (fileName: string, fileType: 'image' | 'file') => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        const formData = new FormData();
        formData.append("fileName", fileName);
        formData.append("fileType", fileType);

        const result = await deleteFileAction(formData);
        if (result.success) {
            loadFiles();
        } else {
            alert(result.error || "Failed to delete file");
        }
    };

    const handleFileClick = (url: string, type: 'image' | 'file', fileName: string, mimeType: string) => {
        onSelectFile(url, type, fileName, mimeType);
        onClose();
    };

    const filteredFiles = files.filter(file =>
        activeTab === 'images' ? file.type === 'image' : file.type === 'file'
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Files & Images"
            titleIcon={<Paperclip className="h-5 w-5" />}
            className="!max-w-6xl max-h-[90vh] overflow-hidden lg:!max-w-6xl sm:!w-[95vw] !w-[100vw]"
        >
            <div className="flex flex-col h-full max-h-[80vh]">
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'images'
                            ? 'text-primary border-b-2 border-primary bg-accent/50'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Images
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'files'
                            ? 'text-primary border-b-2 border-primary bg-accent/50'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <File className="h-4 w-4" />
                            Files
                        </div>
                    </button>
                </div>

                <div className="p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input
                            type="file"
                            accept={activeTab === 'images' ? 'image/*' : '*'}
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="w-full sm:w-auto"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose {activeTab === 'images' ? 'Image' : 'File'}
                        </Button>
                        {selectedFile && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                                <span className="text-sm text-muted-foreground truncate max-w-xs">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatFileSize(selectedFile.size)}
                                </span>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        "Upload"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-h-0">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-lg">Loading {activeTab}...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                {activeTab === 'images' ? <ImageIcon className="h-8 w-8" /> : <File className="h-8 w-8" />}
                            </div>
                            <p className="text-lg font-medium mb-2">No {activeTab} uploaded yet</p>
                            <p className="text-sm">Upload your first {activeTab === 'images' ? 'image' : 'file'} to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {filteredFiles.map((file) => (
                                <div key={file.fileName} className="relative group">
                                    <div
                                        className="bg-card border border-border rounded-xl p-3 sm:p-4 cursor-pointer hover:ring-2 hover:ring-ring transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                        onClick={() => handleFileClick(file.url, file.type, file.name, file.mimeType)}
                                    >
                                        {file.type === 'image' ? (
                                            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 relative">
                                                <Image
                                                    src={file.url}
                                                    alt={file.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center mb-3">
                                                {getFileIcon(file.mimeType, file.fileName)}
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <h3 className="font-medium text-xs sm:text-sm text-foreground truncate" title={file.name}>
                                                {file.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(file.url, '_blank');
                                            }}
                                            title="Open file"
                                        >
                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const link = document.createElement('a');
                                                link.href = file.url;
                                                link.download = file.name;
                                                link.click();
                                            }}
                                            title="Download file"
                                        >
                                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 bg-destructive/80 backdrop-blur-sm hover:bg-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(file.fileName, file.type);
                                            }}
                                            title="Delete file"
                                        >
                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
