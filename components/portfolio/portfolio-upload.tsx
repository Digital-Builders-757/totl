"use client";

import imageCompression from "browser-image-compression";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  finalizePortfolioImage,
  requestPortfolioImageUpload,
} from "@/lib/actions/portfolio-actions";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const COMPRESSION_OPTIONS = {
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  initialQuality: 0.8,
  useWebWorker: true,
};

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] p-5 text-white shadow-none sm:p-6";

const inputGlass =
  "min-h-11 border-white/10 bg-white/[0.06] text-[var(--oklch-text-primary)] placeholder:text-[var(--oklch-text-tertiary)] focus-visible:ring-[var(--oklch-accent)]";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PortfolioUploadProps {
  onUploadSuccess?: () => void;
}

export function PortfolioUpload({ onUploadSuccess }: PortfolioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB. Images are compressed before upload.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for this portfolio item",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      setIsCompressing(true);
      const compressedFile = await imageCompression(selectedFile, COMPRESSION_OPTIONS);
      setIsCompressing(false);

      const intent = await requestPortfolioImageUpload({
        contentType: compressedFile.type,
        byteSize: compressedFile.size,
      });

      if (intent.error || !intent.path || !intent.token) {
        toast({
          title: "Upload failed",
          description: intent.error ?? "Could not start upload",
          variant: "destructive",
        });
        return;
      }

      const supabase = createSupabaseBrowser();
      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .uploadToSignedUrl(intent.path, intent.token, compressedFile, {
          contentType: compressedFile.type,
        });

      if (uploadError) {
        logger.error("Portfolio signed upload failed", uploadError);
        const msg = (uploadError.message || "").toLowerCase();
        if (msg.includes("bucket not found") || msg.includes("bucket_not_found")) {
          toast({
            title: "Upload failed",
            description:
              "Portfolio storage is not configured yet. Please contact support or try again later.",
            variant: "destructive",
          });
        } else if (msg.includes("permission") || msg.includes("policy")) {
          toast({
            title: "Upload failed",
            description: "Permission denied. Check storage policies for the portfolio bucket.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Upload failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      const finalize = await finalizePortfolioImage({
        path: intent.path,
        title: title.trim(),
        description: description.trim() || null,
        caption: caption.trim() || null,
      });

      if (finalize.error) {
        toast({
          title: "Upload failed",
          description: finalize.error,
          variant: "destructive",
        });
        return;
      }

      const sizeInfo =
        compressedFile.size < selectedFile.size
          ? ` (${formatFileSize(selectedFile.size)} → ${formatFileSize(compressedFile.size)})`
          : "";
      toast({
        title: "Success!",
        description: `${finalize.message || "Portfolio image uploaded successfully"}${sizeInfo}`,
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
      setCaption("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadSuccess?.();
    } catch (error) {
      logger.error("Portfolio upload failed", error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  const dropZoneClass = cn(
    "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 sm:p-8",
    isDragging
      ? "border-[var(--oklch-accent)] bg-[var(--oklch-accent)]/10"
      : "border-white/20 hover:border-white/35",
    selectedFile && "border-emerald-500/60 bg-emerald-500/5"
  );

  return (
    <Card className={glassCard}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="mb-2 block text-[var(--oklch-text-primary)]">Image</Label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={dropZoneClass}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading || isCompressing}
            />

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative h-56 w-full overflow-hidden rounded-lg sm:h-64">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleClearFile();
                  }}
                  className="min-h-11 border-white/15 bg-white/[0.06] text-[var(--oklch-text-primary)] hover:bg-white/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                  {isDragging ? (
                    <Upload className="h-8 w-8 animate-bounce text-[var(--oklch-accent)]" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-[var(--oklch-text-tertiary)]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--oklch-text-primary)]">
                    {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--oklch-text-secondary)]">
                    JPEG, PNG, or WebP · max 10MB · optimized on your device before upload
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="title" className="mb-2 block text-[var(--oklch-text-primary)]">
            Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Editorial shoot — spring lookbook"
            required
            disabled={isUploading || isCompressing}
            className={inputGlass}
          />
        </div>

        <div>
          <Label htmlFor="caption" className="mb-2 block text-[var(--oklch-text-primary)]">
            Caption
          </Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Short line shown with the image"
            disabled={isUploading || isCompressing}
            className={inputGlass}
          />
          <p className="mt-1 text-sm text-[var(--oklch-text-tertiary)]">
            Optional — appears on hover with the photo
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="mb-2 block text-[var(--oklch-text-primary)]">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Extra context for this piece (optional)"
            rows={3}
            disabled={isUploading || isCompressing}
            className={inputGlass}
          />
          <p className="mt-1 text-sm text-[var(--oklch-text-tertiary)]">
            Optional — more detail in your gallery card
          </p>
        </div>

        <Button
          type="submit"
          disabled={!selectedFile || !title.trim() || isUploading}
          className="min-h-11 w-full bg-[var(--oklch-accent)] text-white hover:bg-[var(--oklch-accent)]/90"
        >
          {isCompressing ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Optimizing image…
            </>
          ) : isUploading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload portfolio image
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
