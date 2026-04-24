import { NextResponse } from "next/server";

import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generateBookingReminderEmail } from "@/lib/services/email-templates";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

/**
 * Cron endpoint: sends 24-hour reminder emails for upcoming bookings.
 * Call daily (e.g. via Vercel Cron or external cron like cron-job.org).
 *
 * Secured by CRON_SECRET - request must include:
 *   Authorization: Bearer <CRON_SECRET>
 *   or
 *   x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cronHeader;

  if (!cronSecret) {
    // Preview deploys and misconfigured envs hit this; logger.warn posts to Sentry (TOTLMODELAGENCY-3K).
    logger.warn("[cron/booking-reminders] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (providedSecret !== cronSecret) {
    // Probes / wrong secret — do not spam Sentry (TOTLMODELAGENCY-3D). Use Vercel logs if needed.
    logger.info("[cron/booking-reminders] Unauthorized cron request (ignored)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Bookings in the next 20-28 hours (reminder ~24h before; run daily at 8am UTC)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        date,
        compensation,
        notes,
        talent_id,
        gigs!inner(id, title, location)
      `
      )
      .in("status", ["pending", "confirmed"])
      .gte("date", windowStart.toISOString())
      .lte("date", windowEnd.toISOString());

    if (bookingsError) {
      logger.error("[cron/booking-reminders] Failed to fetch bookings", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings", details: bookingsError.message },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ sent: 0, message: "No upcoming bookings in window" });
    }

    let sent = 0;
    for (const booking of bookings) {
      try {
        const { data: talentUser } = await supabase.auth.admin.getUserById(booking.talent_id);
        const talentEmail = talentUser?.user?.email;
        if (!talentEmail) {
          logger.warn("[cron/booking-reminders] No email for talent", { talentId: booking.talent_id });
          continue;
        }

        const { data: talentProfile } = await supabase
          .from("talent_profiles")
          .select("first_name, last_name")
          .eq("user_id", booking.talent_id)
          .maybeSingle();

        const talentName =
          `${talentProfile?.first_name || ""} ${talentProfile?.last_name || ""}`.trim() || "Talent";
        const gig = booking.gigs as { title?: string; location?: string } | null;
        const bookingDate = new Date(booking.date);

        const { subject, html } = generateBookingReminderEmail({
          name: talentName,
          gigTitle: gig?.title || "Your booking",
          bookingDate: bookingDate.toLocaleDateString("en-US"),
          bookingTime: bookingDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          bookingLocation: gig?.location || "TBD",
          dashboardUrl: absoluteUrl("/talent/dashboard"),
        });

        await sendEmail({ to: talentEmail, subject, html });
        await logEmailSent(talentEmail, "booking-reminder", true);
        sent++;
      } catch (err) {
        logger.error("[cron/booking-reminders] Failed to send reminder", err, {
          bookingId: booking.id,
          talentId: booking.talent_id,
        });
        // Continue with other bookings
      }
    }

    return NextResponse.json({ sent, total: bookings.length });
  } catch (error) {
    logger.error("[cron/booking-reminders] Unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
