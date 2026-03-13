"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

export type NotificationType = "new_application" | "application_accepted" | "application_rejected";

/**
 * Get unread notification count for the current user.
 * Fetched server-side on page load; no polling.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return 0;

    const cols = "id";
    const { count, error } = await supabase
      .from("user_notifications")
      .select(cols, { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (error) {
      logger.error("getUnreadNotificationCount error", error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    logger.error("getUnreadNotificationCount", err);
    return 0;
  }
}

/**
 * Insert a notification. Uses admin client to bypass RLS (inserting for another user).
 * Idempotent: unique (recipient_id, type, reference_id) prevents duplicates.
 */
export async function insertNotification(params: {
  recipientId: string;
  type: NotificationType;
  referenceId: string;
  title: string;
  body?: string | null;
}) {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("user_notifications")
      .insert({
        recipient_id: params.recipientId,
        type: params.type,
        reference_id: params.referenceId,
        title: params.title,
        body: params.body ?? null,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // 23505 = unique violation — idempotent, treat as success
      if (error.code === "23505") {
        return { success: true };
      }
      logger.error("insertNotification error", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    logger.error("insertNotification", err);
    return { error: "Failed to create notification" };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string) {
  try {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", userId);

    if (error) {
      logger.error("markNotificationRead error", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    logger.error("markNotificationRead", err);
    return { error: "Failed to mark as read" };
  }
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead() {
  try {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (error) {
      logger.error("markAllNotificationsRead error", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    logger.error("markAllNotificationsRead", err);
    return { error: "Failed to mark all as read" };
  }
}

/**
 * Fetch recent notifications for dropdown (last ~10).
 */
export async function getRecentNotifications(limit = 10) {
  try {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return { notifications: [] };

    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, type, reference_id, title, body, read_at, created_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("getRecentNotifications error", error);
      return { notifications: [] };
    }
    return { notifications: data ?? [] };
  } catch (err) {
    logger.error("getRecentNotifications", err);
    return { notifications: [] };
  }
}
