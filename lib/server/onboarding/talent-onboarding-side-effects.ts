import "server-only";

import type { User } from "@supabase/supabase-js";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import {
  generateAdminNewMemberAlertEmail,
  generateWelcomeEmail,
} from "@/lib/services/email-templates";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

export type TalentProfileEmailState = {
  role: string | null;
  display_name: string | null;
  email_verified: boolean | null;
  welcome_email_sent_at: string | null;
  admin_new_member_email_sent_at: string | null;
};

/**
 * Idempotent welcome + admin alert emails for new talent accounts.
 * Called from boot paths when the session user is talent.
 *
 * Uses conditional updates (claim-then-send) so concurrent boot requests cannot
 * duplicate emails.
 */
export async function processTalentOnboardingSideEffects(
  user: User,
  profile: TalentProfileEmailState
): Promise<void> {
  if (profile.role !== "talent") return;

  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    logger.warn("[onboarding] service role unavailable; skip onboarding emails");
    return;
  }

  const email = user.email ?? "";
  if (!email) return;

  const emailVerified = Boolean(user.email_confirmed_at) || Boolean(profile.email_verified);
  const displayName = profile.display_name?.trim() || email.split("@")[0] || "New member";

  if (emailVerified && !profile.welcome_email_sent_at) {
    try {
      const welcomeSentAt = new Date().toISOString();
      const { data: welcomeClaimRows, error: welcomeClaimError } = await adminClient
        .from("profiles")
        .update({ welcome_email_sent_at: welcomeSentAt })
        .eq("id", user.id)
        .is("welcome_email_sent_at", null)
        .select("id");
      if (welcomeClaimError) {
        logger.error("[onboarding] failed to claim welcome_email_sent_at", welcomeClaimError);
      } else if (welcomeClaimRows?.length === 1) {
        const { subject, html } = generateWelcomeEmail({
          name: displayName,
          loginUrl: absoluteUrl("/login"),
        });
        await sendEmail({ to: email, subject, html });
        await logEmailSent(email, "welcome", true);
      }
    } catch (e) {
      logger.error("[onboarding] welcome email failed", e);
    }
  }

  if (!profile.admin_new_member_email_sent_at) {
    try {
      const adminSentAt = new Date().toISOString();
      const { data: adminClaimRows, error: adminClaimError } = await adminClient
        .from("profiles")
        .update({ admin_new_member_email_sent_at: adminSentAt })
        .eq("id", user.id)
        .is("admin_new_member_email_sent_at", null)
        .select("id");
      if (adminClaimError) {
        logger.error(
          "[onboarding] failed to claim admin_new_member_email_sent_at",
          adminClaimError
        );
      } else if (adminClaimRows?.length === 1) {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@thetotlagency.com";
        const { subject, html } = generateAdminNewMemberAlertEmail({
          memberDisplayName: displayName,
          memberEmail: email,
          usersUrl: absoluteUrl("/admin/users"),
        });
        await sendEmail({ to: adminEmail, subject, html });
        await logEmailSent(adminEmail, "admin-new-member-alert", true);
      }
    } catch (e) {
      logger.error("[onboarding] admin new-member email failed", e);
    }
  }
}
