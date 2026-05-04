"use client";

import { Upload, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadAvatar } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/utils/logger";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userEmail: string;
  displayName?: string | null;
}

export function AvatarUpload({ currentAvatarUrl, userEmail, displayName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const initials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : userEmail.substring(0, 2).toUpperCase();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, GIF, or WebP file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (1MB for Next.js Server Actions)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 1MB. Try compressing your image or using a smaller file.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", fileInputRef.current.files[0]);

      const result = await uploadAvatar(formData);

      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        });
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setPreviewUrl(null);
        // Refresh server components to get the new signed URL (no full-page reload).
        router.refresh();
      }
    } catch (error) {
      logger.error("Avatar upload error", error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
      // Set the file in the input for upload
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const avatarUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl || undefined} alt={displayName || userEmail} />
          <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        </div>

        <div className="hidden flex-1 space-y-2 md:block">
          <button
            type="button"
            className="panel-frosted w-full rounded-2xl border-2 border-dashed border-white/12 bg-white/[0.03] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <Upload className="mx-auto mb-2 h-6 w-6 text-[var(--oklch-text-tertiary)]" />
              <p className="text-sm text-[var(--oklch-text-secondary)]">
                {previewUrl ? "Click to change file" : "Drag and drop or click to upload"}
              </p>
              <p className="mt-1 text-xs text-[var(--oklch-text-tertiary)]">JPG, PNG, GIF, or WebP. Max 1MB.</p>
            </div>
          </button>
          <p className="text-xs text-[var(--oklch-text-tertiary)]">
            Need to resize quickly? Try{" "}
            <a
              href="https://squoosh.app/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--oklch-accent)] underline-offset-2 hover:underline"
            >
              Squoosh
            </a>{" "}
            or{" "}
            <a
              href="https://www.canva.com/resize-image/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--oklch-accent)] underline-offset-2 hover:underline"
            >
              Canva Resize
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl || currentAvatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          <p className="text-xs text-[var(--oklch-text-tertiary)]">JPG, PNG, GIF, or WebP. Max 1MB.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button size="sm" onClick={handleUpload} disabled={isUploading} className="sm:flex-1">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save photo"
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={clearPreview} disabled={isUploading} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <X className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">Cancel</span>
          </Button>
        </div>
      )}
    </div>
  );
}
