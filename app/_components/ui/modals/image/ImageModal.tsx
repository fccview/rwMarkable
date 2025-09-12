"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { uploadImageAction, getImagesAction, deleteImageAction } from "@/app/_server/actions/data/image-actions";
import Image from "next/image";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  category: string;
}

interface ImageItem {
  fileName: string;
  name: string;
  url: string;
}

export function ImageModal({ isOpen, onClose, onSelectImage, category }: ImageModalProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    const result = await getImagesAction();
    if (result.success && result.data) {
      setImages(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, loadImages]);

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
    formData.append("image", selectedFile);

    const result = await uploadImageAction(formData);
    if (result.success) {
      setSelectedFile(null);
      loadImages();
    } else {
      alert(result.error || "Failed to upload image");
    }
    setIsUploading(false);
  };

  const handleDeleteImage = async (fileName: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    const formData = new FormData();
    formData.append("fileName", fileName);

    const result = await deleteImageAction(formData);
    if (result.success) {
      loadImages();
    } else {
      alert(result.error || "Failed to delete image");
    }
  };

  const handleImageClick = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Images</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 p-4 border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            {selectedFile && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="text-center py-8">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No images uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.fileName} className="relative group">
                  <div
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-ring relative"
                    onClick={() => handleImageClick(image.url)}
                  >
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.fileName);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
