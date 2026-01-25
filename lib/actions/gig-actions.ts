"use server";

import { randomUUID } from "crypto";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

// NOTE: Runtime config should be set at route segment level (server action files)
// This export here may not be honored by Next.js - kept for reference only
// Actual runtime enforcement is in: app/post-gig/actions.ts and app/admin/gigs/create/actions.ts

/**
 * MIME type + extension validation
 * Validates file type, size, and extension matching
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Client-side type check (fast path)
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Please use JPEG, PNG, GIF, or WebP" };
  }

  // Size check
  const maxSize = 4 * 1024 * 1024; // 4MB for gig images
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
 * 
 * Note: userId is derived from the authenticated session to ensure it matches RLS policies
 */
export type UploadGigImageResult =
  | { ok: true; url: string; path: string; debug_id: string }
  | { ok: false; message: string; code?: string; debug_id: string };

export async function uploadGigImage(file: File): Promise<UploadGigImageResult> {
  // Generate debug_id for tracing this upload attempt
  const debugId = randomUUID().replace(/-/g, "").substring(0, 16);

  try {
    const supabase = await createSupabaseServer();

    // MUST-FIX #1: Derive userId from session (don't trust parameter)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("Gig image upload auth check failed", authError, {
        debug_id: debugId,
        authError: authError?.message,
        hasUser: !!user,
      });
      return {
        ok: false,
        message: "Authentication failed. Please log in again.",
        code: "401",
        debug_id: debugId,
      };
    }

    const authedUserId = user.id;

    // Enhanced server-side validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      logger.warn("Gig image upload validation failed", {
        debug_id: debugId,
        authedUserId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        validationError: validation.error,
      });
      return {
        ok: false,
        message: validation.error || "Invalid file",
        code: "VALIDATION_ERROR",
        debug_id: debugId,
      };
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
    const path = `${authedUserId}/gig-${timestamp}-${randomId}.${ext}`;

    // NICE-UPGRADE A: Normalize upload body to Buffer for Node.js runtime
    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("gig-images")
      .upload(path, body, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      // Extract error details for structured logging
      // Supabase StorageError may have statusCode as a property or in the error object
      const statusCode = (uploadError as unknown as { statusCode?: number }).statusCode;
      const errorCode = statusCode?.toString() || "UNKNOWN";
      const errorMessage = uploadError.message || "Unknown error";
      const errorName = uploadError.name || "StorageError";

      // Map HTTP status codes to user-friendly messages
      let userMessage: string;
      switch (statusCode) {
        case 401:
          userMessage = "Authentication failed. Please log in again.";
          break;
        case 403:
          userMessage = "Permission denied. You don't have access to upload images.";
          break;
        case 404:
          userMessage = "Storage bucket not found. Please contact support.";
          break;
        case 409:
          userMessage = "File already exists. Please try again.";
          break;
        case 413:
          userMessage = "File too large. Maximum size is 4MB.";
          break;
        case 400:
          userMessage = "Invalid file format or request.";
          break;
        default:
          userMessage = "Failed to upload image. Please try again.";
      }

      // Structured error logging with full context
      // NICE-UPGRADE B: Log authedUserId explicitly for mismatch detection
      logger.error("Gig image upload failed", uploadError, {
        debug_id: debugId,
        bucket: "gig-images",
        path,
        authedUserId, // Explicitly log authenticated user ID
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        statusCode,
        errorCode,
        errorName,
        errorMessage,
        // Include full Supabase error object (will be redacted by logger if sensitive)
        supabaseError: {
          message: uploadError.message,
          statusCode,
          name: uploadError.name,
        },
      });

      return {
        ok: false,
        message: userMessage,
        code: errorCode,
        debug_id: debugId,
      };
    }

    // Get public URL (bucket is public)
    // NICE-UPGRADE C: Note - if bucket becomes private, use signed URLs instead
    const {
      data: { publicUrl },
    } = supabase.storage.from("gig-images").getPublicUrl(path);

    logger.debug("Gig image upload successful", {
      debug_id: debugId,
      bucket: "gig-images",
      path,
      authedUserId,
      fileName: file.name,
      fileSize: file.size,
      url: publicUrl,
    });

    // MUST-FIX #4: Return discriminated union with ok: true
    return { ok: true, url: publicUrl, path, debug_id: debugId };
  } catch (error) {
    // Unexpected error (not from Supabase)
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Unexpected error uploading gig image", error instanceof Error ? error : undefined, {
      debug_id: debugId,
      bucket: "gig-images",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      errorMessage,
    });

    return {
      ok: false,
      message: "An unexpected error occurred. Please try again.",
      code: "UNEXPECTED_ERROR",
      debug_id: debugId,
    };
  }
}

/**
 * Delete a gig image from storage
 * Used for cleanup when gig creation fails or image is replaced
 * 
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteGigImage(imageUrl: string | null): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true }; // Nothing to delete
  }

  try {
    const supabase = await createSupabaseServer();

    // Derive userId from session (don't trust parameter)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Gig image delete auth check failed", {
        authError: authError?.message,
        hasUser: !!user,
      });
      return { success: false, error: "Authentication failed. Please log in again." };
    }

    const authedUserId = user.id;
    const path = extractPathFromUrl(imageUrl);

    if (!path) {
      logger.warn("Could not extract path from URL", { imageUrl });
      return { success: false, error: "Invalid image URL format" };
    }

    // Security hardening: Assert the extracted path starts with the current user's folder
    // This prevents noisy failed deletes and makes ownership intent explicit
    // Even though RLS policy enforces this, this check fails fast and reduces log noise
    if (!path.startsWith(`${authedUserId}/`)) {
      logger.warn("Delete attempt rejected: path does not belong to user", {
        path,
        authedUserId,
      });
      return {
        success: false,
        error: "Cannot delete image: path does not belong to current user",
      };
    }

    const { error: deleteError } = await supabase.storage.from("gig-images").remove([path]);

    if (deleteError) {
      logger.error("Gig image delete error", deleteError, {
        path,
        authedUserId,
      });
      // Don't fail the operation if delete fails - orphaned images are acceptable
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error deleting gig image", error instanceof Error ? error : undefined);
    return { success: false, error: "Failed to delete image" };
  }
}
