import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type Db = Database;
const shouldDebugEmailVerifySync = process.env.DEBUG_EMAIL_VERIFY_SYNC === "1";

/**
 * Syncs profiles.email_verified to match auth.users.email_confirmed_at
 * 
 * This is the single source of truth for email verification sync.
 * Used by:
 * - app/auth/callback/page.tsx (verification callback)
 * - lib/actions/auth-actions.ts (ensureProfileExists)
 * 
 * @param params.supabase - Supabase client instance
 * @param params.user - User object from auth.getUser()
 * @param params.currentEmailVerified - Optional current value to avoid extra read
 * @returns Sync result with success status and whether value changed
 */
export async function syncEmailVerifiedForUser(params: {
  supabase: SupabaseClient<Db>;
  user: User;
  currentEmailVerified?: boolean | null;
}) {
  const { supabase, user, currentEmailVerified } = params;

  const computed = user.email_confirmed_at !== null;

  // If caller already knows the current value, we can avoid a read.
  const needsUpdate =
    typeof currentEmailVerified === "boolean"
      ? currentEmailVerified !== computed
      : true;

  if (!needsUpdate) {
    return { success: true as const, changed: false as const, email_verified: computed };
  }

  // If we don't know current value, read it once (explicit column).
  let existing = currentEmailVerified;
  if (typeof existing !== "boolean") {
    const { data, error } = await supabase
      .from("profiles")
      .select("email_verified")
      .eq("id", user.id)
      .maybeSingle<{ email_verified: boolean | null }>();

    if (error) {
      logger.error("Error reading email_verified for sync", error);
      return { success: false as const, changed: false as const, error: error.message };
    }
    existing = data?.email_verified ?? null;
  }

  if (existing === computed) {
    return { success: true as const, changed: false as const, email_verified: computed };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ email_verified: computed })
    .eq("id", user.id);

  if (updateError) {
    // This should typically succeed under the user's RLS permissions.
    // If it fails (RLS, stale auth state, etc.), fall back to an admin write to guarantee convergence.
    logger.error("Error syncing email_verified with user session client", updateError);

    // Only attempt admin fallback if the service role key exists (server-only env var).
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false as const, changed: false as const, error: updateError.message };
    }

    try {
      const admin = createSupabaseAdminClient();
      const { error: adminError } = await admin
        .from("profiles")
        .update({ email_verified: computed })
        .eq("id", user.id);

      if (adminError) {
        logger.error("Error syncing email_verified with admin client fallback", adminError);
        return { success: false as const, changed: false as const, error: adminError.message };
      }

      if (shouldDebugEmailVerifySync) {
        logger.info("[email-verify-sync] updated profiles.email_verified (admin fallback)", {
          userId: user.id,
          computed,
          previous: existing,
        });
      }

      return { success: true as const, changed: true as const, email_verified: computed };
    } catch (e) {
      logger.error("Unexpected error during email_verified admin fallback", e);
      return {
        success: false as const,
        changed: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  if (shouldDebugEmailVerifySync) {
    logger.info("[email-verify-sync] updated profiles.email_verified", {
      userId: user.id,
      computed,
      previous: existing,
    });
  }

  return { success: true as const, changed: true as const, email_verified: computed };
}
