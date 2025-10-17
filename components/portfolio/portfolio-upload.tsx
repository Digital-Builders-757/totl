"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { uploadPortfolioImage } from "@/lib/actions/portfolio-actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

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

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
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
      const formData = new FormData();
      formData.append("portfolio_image", selectedFile);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      if (caption.trim()) formData.append("caption", caption.trim());

      const result = await uploadPortfolioImage(formData);

      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: result.message || "Portfolio image uploaded successfully",
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
      setCaption("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 bg-zinc-900 border-zinc-800">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <Label className="text-white mb-2 block">Image</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-600"}
              ${selectedFile ? "border-green-500" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-blue-500 animate-bounce" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    JPEG, PNG, GIF, or WebP (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-white mb-2 block">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Editorial Shoot - Vogue"
            required
            disabled={isUploading}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Caption */}
        <div>
          <Label htmlFor="caption" className="text-white mb-2 block">
            Caption
          </Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Short caption for the image"
            disabled={isUploading}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <p className="text-sm text-zinc-400 mt-1">
            Optional short description shown with the image
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-white mb-2 block">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about this portfolio item..."
            rows={3}
            disabled={isUploading}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <p className="text-sm text-zinc-400 mt-1">
            Optional detailed information about the shoot, project, or context
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!selectedFile || !title.trim() || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Portfolio Image
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

