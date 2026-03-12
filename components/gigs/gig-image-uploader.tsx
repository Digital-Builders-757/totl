"use client";

import { Upload, X, Image as ImageIcon, Info } from "lucide-react";
import Image from "next/image";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { OPPORTUNITY_IMAGE_SPEC_NOTICE } from "@/lib/constants/opportunity-image-specs";

interface GigImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
}

export function GigImageUploader({
  onFileSelect,
  currentImageUrl,
  disabled = false,
}: GigImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      onFileSelect(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (4MB)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 4MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Notify parent
    onFileSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelect(null);
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="space-y-2">
      <label htmlFor="gig-image-upload" className="text-sm font-medium text-white">
        Opportunity Cover Image
      </label>
      <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-200">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
        <p>
          <strong>Recommended:</strong> {OPPORTUNITY_IMAGE_SPEC_NOTICE}. Flyers and images in this format will display correctly without distortion.
        </p>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 hover:border-gray-500"
          }
          ${selectedFile ? "border-green-500" : ""}
        `}
      >
        <input
          id="gig-image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {displayImage ? (
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={displayImage}
                alt="Gig cover preview"
                fill
                className="object-cover"
              />
            </div>
            {selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                disabled={disabled}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Remove Image
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-6 h-6 text-blue-500 animate-bounce" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, GIF, or WebP (max 4MB)
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Optional: Add a cover image to make your opportunity stand out. JPEG, PNG, GIF, or WebP (max 4MB). Tip: keep images under ~1MB for faster uploads.
      </p>
    </div>
  );
}
