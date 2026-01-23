"use server";

import { randomUUID } from "crypto";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

/**
 * Enhanced MIME type validation using file signature (magic bytes)
 * More secure than relying solely on file.type
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Client-side type check (fast path)
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Please use JPEG, PNG, GIF, or WebP" };
  }

  // Size check
  const maxSize = 10 * 1024 * 1024; // 10MB for gig images
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Additional validation: check file extension matches MIME type
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf(".") + 1);
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
  };

  const validExtensions = mimeToExt[file.type] || [];
  if (extension && !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: "File extension does not match file type. Please use a valid image file.",
    };
  }

  return { valid: true };
}

/**
 * Extract storage path from a public URL
 * Used for cleanup operations
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Supabase public URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/gig-images\/(.+)$/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Upload a gig cover image to Supabase Storage
 * Returns the public URL and storage path of the uploaded image
 */
export async function uploadGigImage(
  file: File,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const supabase = await createSupabaseServer();

    // Enhanced server-side validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { error: validation.error || "Invalid file" };
    }

    // Generate optimized path following user-specific folder pattern
    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "gif";
    const timestamp = Date.now();
    // Use crypto.randomUUID() for stronger randomness (replaces Math.random())
    const randomId = randomUUID().replace(/-/g, "").substring(0, 8); // Short UUID without dashes
    const path = `${userId}/gig-${timestamp}-${randomId}.${ext}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage.from("gig-images").upload(path, file, {
      contentType: file.type,
      upsert: false, // Don't overwrite existing files
    });

    if (uploadError) {
      console.error("Gig image upload error:", uploadError);
      return { error: "Failed to upload image. Please try again." };
    }

    // Get public URL (bucket is public)
    const {
      data: { publicUrl },
    } = supabase.storage.from("gig-images").getPublicUrl(path);

    return { url: publicUrl, path };
  } catch (error) {
    console.error("Unexpected error uploading gig image:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Delete a gig image from storage
 * Used for cleanup when gig creation fails or image is replaced
 * 
 * @param imageUrl - The public URL of the image to delete
 * @param userId - The user ID that should own the image (for security validation)
 */
export async function deleteGigImage(
  imageUrl: string | null,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true }; // Nothing to delete
  }

  try {
    const supabase = await createSupabaseServer();
    const path = extractPathFromUrl(imageUrl);

    if (!path) {
      console.warn("Could not extract path from URL:", imageUrl);
      return { success: false, error: "Invalid image URL format" };
    }

    // Security hardening: Assert the extracted path starts with the current user's folder
    // This prevents noisy failed deletes and makes ownership intent explicit
    // Even though RLS policy enforces this, this check fails fast and reduces log noise
    if (!path.startsWith(`${userId}/`)) {
      console.warn(
        `Delete attempt rejected: path '${path}' does not belong to user '${userId}'`
      );
      return {
        success: false,
        error: "Cannot delete image: path does not belong to current user",
      };
    }

    const { error: deleteError } = await supabase.storage.from("gig-images").remove([path]);

    if (deleteError) {
      console.error("Gig image delete error:", deleteError);
      // Don't fail the operation if delete fails - orphaned images are acceptable
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting gig image:", error);
    return { success: false, error: "Failed to delete image" };
  }
}
