"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type NotificationType = Database["public"]["Enums"]["notification_type"];

export type AdminSignupNotificationRow = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  reference_id: string;
  read_at: string | null;
};

/**
 * Unread new-member signup notifications for the current admin (for header badge).
 */
export async function getAdminSignupNotificationUnreadCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") return 0;

    const countColumns = "id";
    const { count, error } = await supabase
      .from("user_notifications")
      .select(countColumns, { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("type", "new_member_signup" as NotificationType)
      .is("read_at", null);

    if (error) {
      logger.error("getAdminSignupNotificationUnreadCount", error);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    logger.error("getAdminSignupNotificationUnreadCount", e);
    return 0;
  }
}

/**
 * Recent new-member notifications for the admin notification menu.
 */
export async function fetchAdminSignupNotificationsForMenu(
  limit = 20
): Promise<{ ok: true; items: AdminSignupNotificationRow[] } | { ok: false; error: string }> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: "Not signed in" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }

    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, title, body, created_at, reference_id, read_at")
      .eq("recipient_id", user.id)
      .eq("type", "new_member_signup" as NotificationType)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("fetchAdminSignupNotificationsForMenu", error);
      return { ok: false, error: "Failed to load notifications" };
    }

    return { ok: true, items: (data ?? []) as AdminSignupNotificationRow[] };
  } catch (e) {
    logger.error("fetchAdminSignupNotificationsForMenu", e);
    return { ok: false, error: "Failed to load notifications" };
  }
}

export async function markAdminSignupNotificationsRead(): Promise<void> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("recipient_id", user.id)
      .eq("type", "new_member_signup" as NotificationType)
      .is("read_at", null);

    if (error) {
      logger.error("markAdminSignupNotificationsRead", error);
      return;
    }

    revalidatePath("/admin", "layout");
  } catch (e) {
    logger.error("markAdminSignupNotificationsRead", e);
  }
}
