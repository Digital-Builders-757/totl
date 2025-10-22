"use client";

import { Upload, X, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { uploadAvatar } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

  const initials = displayName
    ? displayName.substring(0, 2).toUpperCase()
    : userEmail.substring(0, 2).toUpperCase();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or GIF file.",
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
        // Refresh the page to get the new signed URL
        window.location.reload();
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
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
    <div className="flex items-center gap-4">
      <div className="relative">
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

      <div className="flex-1 space-y-2">
        <button
          type="button"
          className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors cursor-pointer text-left bg-gray-800"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-300">
              {previewUrl ? "Click to change file" : "Drag and drop or click to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 1MB.</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload} disabled={isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Avatar"
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={clearPreview} disabled={isUploading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
