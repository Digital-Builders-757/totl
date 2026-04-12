"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { publicBucketUrl } from "@/lib/utils/storage-urls";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function extFromContentType(contentType: string): string | null {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return null;
}

/**
 * Step 1 of 2: reserve a storage path and return a signed upload token.
 * Client uploads bytes with {@link uploadToSignedUrl} (browser Supabase client), then calls {@link finalizePortfolioImage}.
 */
export async function requestPortfolioImageUpload(input: {
  contentType: string;
  byteSize: number;
}): Promise<{ path?: string; token?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    if (!ALLOWED_TYPES.includes(input.contentType as (typeof ALLOWED_TYPES)[number])) {
      return { error: "Invalid file type. Please use JPEG, PNG, or WebP" };
    }

    if (input.byteSize <= 0 || input.byteSize > MAX_FILE_BYTES) {
      return { error: "File too large. Maximum size is 10MB." };
    }

    const ext = extFromContentType(input.contentType);
    if (!ext) {
      return { error: "Invalid file type. Please use JPEG, PNG, or WebP" };
    }

    const timestamp = Date.now();
    // Match gig image hardening: crypto.randomUUID() (replaces Math.random()) for path uniqueness
    const randomId = randomUUID().replace(/-/g, "").substring(0, 8);
    const path = `${user.id}/portfolio-${timestamp}-${randomId}.${ext}`;

    const { data, error } = await supabase.storage.from("portfolio").createSignedUploadUrl(path);

    if (error || !data?.token) {
      logger.error("Portfolio signed URL error", error, { path });
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("bucket not found") || msg.includes("bucket_not_found")) {
        return {
          error:
            "Portfolio storage is not configured yet. Please contact support or try again later.",
        };
      }
      if (msg.includes("permission") || msg.includes("policy")) {
        return { error: "Permission denied. Check storage policies for the portfolio bucket." };
      }
      return { error: "Could not start upload. Please try again." };
    }

    return { path: data.path, token: data.token };
  } catch (error) {
    logger.error("Unexpected requestPortfolioImageUpload error", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Step 2 of 2: after direct storage upload succeeds, insert the portfolio row. Rolls back storage on DB failure.
 */
export async function finalizePortfolioImage(input: {
  path: string;
  title: string;
  description: string | null;
  caption: string | null;
}): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    const path = input.path.trim();
    if (!path || !path.startsWith(`${user.id}/`)) {
      return { error: "Invalid upload path" };
    }

    if (!input.title?.trim()) {
      return { error: "Title is required" };
    }

    // O(1) existence check on the exact object path (avoids list() pagination / sort limits).
    const { data: fileExists, error: existsError } = await supabase.storage.from("portfolio").exists(path);

    // supabase-js may return data: false together with a non-null error when the object is missing (#1363).
    if (fileExists === false) {
      return {
        error: "We could not confirm your file in storage. Please try uploading again.",
      };
    }

    if (existsError) {
      logger.error("Portfolio finalize exists check error", existsError, { path });
      return {
        error: "We could not verify your upload. Please try again.",
      };
    }

    if (!fileExists) {
      return {
        error: "We could not confirm your file in storage. Please try uploading again.",
      };
    }

    const { error: insertError } = await supabase.from("portfolio_items").insert({
      talent_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      caption: input.caption?.trim() || null,
      image_url: path,
    });

    if (insertError) {
      await supabase.storage.from("portfolio").remove([path]);
      logger.error("Database insert error", insertError);
      return { error: "Failed to create portfolio item. Please try again." };
    }

    revalidatePath("/settings");
    revalidatePath(PATHS.TALENT_DASHBOARD);
    return {
      success: true,
      message: "Portfolio image uploaded successfully",
    };
  } catch (error) {
    logger.error("Unexpected finalizePortfolioImage error", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Delete a portfolio item and its associated image
 */
export async function deletePortfolioItem(portfolioItemId: string) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    const { data: item, error: fetchError } = await supabase
      .from("portfolio_items")
      .select("image_url, talent_id")
      .eq("id", portfolioItemId)
      .single();

    if (fetchError || !item) {
      return { error: "Portfolio item not found" };
    }

    if (item.talent_id !== user.id) {
      return { error: "Access denied" };
    }

    const { error: deleteError } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", portfolioItemId);

    if (deleteError) {
      logger.error("Database delete error", deleteError);
      return { error: "Failed to delete portfolio item. Please try again." };
    }

    if (item.image_url?.startsWith(`${user.id}/`)) {
      const { error: removeError } = await supabase.storage.from("portfolio").remove([item.image_url]);
      if (removeError) {
        logger.error("Portfolio storage delete error", removeError, { path: item.image_url });
      }
    }

    revalidatePath("/settings");
    revalidatePath(PATHS.TALENT_DASHBOARD);
    return {
      success: true,
      message: "Portfolio item deleted successfully",
    };
  } catch (error) {
    logger.error("Unexpected delete error", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Update portfolio item details (title, description, caption)
 */
export async function updatePortfolioItem(
  portfolioItemId: string,
  updates: {
    title?: string;
    description?: string | null;
    caption?: string | null;
  }
) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    if (updates.title && updates.title.trim().length === 0) {
      return { error: "Title cannot be empty" };
    }

    const patch: Database["public"]["Tables"]["portfolio_items"]["Update"] = {
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && {
        description: updates.description?.trim() || null,
      }),
      ...(updates.caption !== undefined && {
        caption: updates.caption?.trim() || null,
      }),
    };

    const { error: updateError } = await supabase
      .from("portfolio_items")
      .update(patch)
      .eq("id", portfolioItemId)
      .eq("talent_id", user.id);

    if (updateError) {
      logger.error("Database update error", updateError);
      return { error: "Failed to update portfolio item. Please try again." };
    }

    revalidatePath("/settings");
    revalidatePath(PATHS.TALENT_DASHBOARD);
    return {
      success: true,
      message: "Portfolio item updated successfully",
    };
  } catch (error) {
    logger.error("Unexpected update error", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Get portfolio items for a talent with storage URLs
 */
export async function getPortfolioItems(talentId: string): Promise<{
  items: (PortfolioItem & { imageUrl?: string })[];
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServer();

    const { data: items, error } = await supabase
      .from("portfolio_items")
      .select("id,talent_id,title,description,caption,image_url,created_at,updated_at")
      .eq("talent_id", talentId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching portfolio items", error, { talentId });
      return { items: [], error: "Failed to load portfolio items" };
    }

    const itemsWithUrls = (items || []).map((item: PortfolioItem) => ({
      ...item,
      imageUrl: publicBucketUrl("portfolio", item.image_url) ?? item.image_url ?? undefined,
    }));

    return { items: itemsWithUrls };
  } catch (error) {
    logger.error("Unexpected error fetching portfolio", error, { talentId });
    return { items: [], error: "An unexpected error occurred" };
  }
}
