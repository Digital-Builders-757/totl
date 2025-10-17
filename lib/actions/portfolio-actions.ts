"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"];

/**
 * Upload a portfolio image to Supabase Storage and create a portfolio item
 */
export async function uploadPortfolioImage(formData: FormData) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    const file = formData.get("portfolio_image") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file || file.size === 0) {
      return { error: "No file provided" };
    }

    if (!title || title.trim().length === 0) {
      return { error: "Title is required" };
    }

    // Enhanced file validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type. Please use JPEG, PNG, GIF, or WebP" };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB for portfolio images
    if (file.size > maxSize) {
      return { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` };
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
    const randomId = Math.random().toString(36).substring(7);
    const path = `${user.id}/portfolio-${timestamp}-${randomId}.${ext}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, {
      contentType: file.type,
      upsert: false, // Don't overwrite existing files
    });

    if (uploadError) {
      console.error("Portfolio upload error:", uploadError);
      return { error: "Failed to upload image. Please try again." };
    }

    // Get current max display_order for this talent
    const { data: existingItems } = await supabase
      .from("portfolio_items")
      .select("display_order")
      .eq("talent_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = existingItems && existingItems.length > 0 
      ? (existingItems[0].display_order || 0) + 1 
      : 0;

    // Check if this will be the first portfolio item (make it primary)
    const { count } = await supabase
      .from("portfolio_items")
      .select("*", { count: "exact", head: true })
      .eq("talent_id", user.id);

    const isPrimary = count === 0;

    // Create portfolio item record
    const { data: portfolioItem, error: insertError } = await supabase
      .from("portfolio_items")
      .insert({
        talent_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        caption: caption?.trim() || null,
        image_path: path,
        display_order: nextOrder,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: remove the uploaded file
      await supabase.storage.from("portfolio").remove([path]);
      console.error("Database insert error:", insertError);
      return { error: "Failed to create portfolio item. Please try again." };
    }

    revalidatePath("/settings");
    revalidatePath("/talent/dashboard");
    return {
      success: true,
      portfolioItem,
      message: "Portfolio image uploaded successfully",
    };
  } catch (error) {
    console.error("Unexpected portfolio upload error:", error);
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

    // Get the portfolio item first (for image_path)
    const { data: item, error: fetchError } = await supabase
      .from("portfolio_items")
      .select("image_path, is_primary, talent_id")
      .eq("id", portfolioItemId)
      .single();

    if (fetchError || !item) {
      return { error: "Portfolio item not found" };
    }

    // Verify ownership
    if (item.talent_id !== user.id) {
      return { error: "Access denied" };
    }

    // Delete from database (RLS will enforce ownership)
    const { error: deleteError } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", portfolioItemId);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return { error: "Failed to delete portfolio item. Please try again." };
    }

    // Delete image from storage if path exists
    if (item.image_path) {
      const { error: storageError } = await supabase.storage
        .from("portfolio")
        .remove([item.image_path]);

      if (storageError) {
        console.warn("Storage delete warning:", storageError);
        // Don't fail the operation if storage deletion fails
      }
    }

    // If this was the primary image, set another one as primary
    if (item.is_primary) {
      const { data: nextItem } = await supabase
        .from("portfolio_items")
        .select("id")
        .eq("talent_id", user.id)
        .order("display_order", { ascending: true })
        .limit(1)
        .single();

      if (nextItem) {
        await supabase
          .from("portfolio_items")
          .update({ is_primary: true })
          .eq("id", nextItem.id);
      }
    }

    revalidatePath("/settings");
    revalidatePath("/talent/dashboard");
    return {
      success: true,
      message: "Portfolio item deleted successfully",
    };
  } catch (error) {
    console.error("Unexpected delete error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Reorder portfolio items via drag-and-drop
 */
export async function reorderPortfolioItems(itemIds: string[]) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    // Update display_order for each item
    const updates = itemIds.map((id, index) =>
      supabase
        .from("portfolio_items")
        .update({ display_order: index })
        .eq("id", id)
        .eq("talent_id", user.id) // RLS enforcement
    );

    await Promise.all(updates);

    revalidatePath("/settings");
    revalidatePath("/talent/dashboard");
    return {
      success: true,
      message: "Portfolio order updated successfully",
    };
  } catch (error) {
    console.error("Unexpected reorder error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Set a portfolio item as primary/featured
 */
export async function setPrimaryPortfolioItem(portfolioItemId: string) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Authentication failed" };
    }

    // Use the database function to atomically set primary
    const { error: rpcError } = await supabase.rpc("set_portfolio_primary", {
      p_portfolio_item_id: portfolioItemId,
      p_talent_id: user.id,
    });

    if (rpcError) {
      console.error("Set primary error:", rpcError);
      return { error: "Failed to set primary image. Please try again." };
    }

    revalidatePath("/settings");
    revalidatePath("/talent/dashboard");
    return {
      success: true,
      message: "Primary image updated successfully",
    };
  } catch (error) {
    console.error("Unexpected set primary error:", error);
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
        description: updates.description?.trim() || null 
      }),
      ...(updates.caption !== undefined && { 
        caption: updates.caption?.trim() || null 
      }),
    };

    const { error: updateError } = await supabase
      .from("portfolio_items")
      .update(patch)
      .eq("id", portfolioItemId)
      .eq("talent_id", user.id); // RLS enforcement

    if (updateError) {
      console.error("Database update error:", updateError);
      return { error: "Failed to update portfolio item. Please try again." };
    }

    revalidatePath("/settings");
    revalidatePath("/talent/dashboard");
    return {
      success: true,
      message: "Portfolio item updated successfully",
    };
  } catch (error) {
    console.error("Unexpected update error:", error);
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
      .select("*")
      .eq("talent_id", talentId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching portfolio items:", error);
      return { items: [], error: "Failed to load portfolio items" };
    }

    // Get public URLs for images
    const itemsWithUrls = await Promise.all(
      (items || []).map(async (item) => {
        if (item.image_path) {
          const { data } = supabase.storage
            .from("portfolio")
            .getPublicUrl(item.image_path);
          return { ...item, imageUrl: data.publicUrl };
        }
        return { ...item, imageUrl: item.image_url || undefined };
      })
    );

    return { items: itemsWithUrls };
  } catch (error) {
    console.error("Unexpected error fetching portfolio:", error);
    return { items: [], error: "An unexpected error occurred" };
  }
}

