"use server";

import { logger } from "@/lib/utils/logger";

import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import {
  generateApplicationAcceptedEmail,
  generateApplicationRejectedEmail,
  generateBookingConfirmedEmail,
} from "@/lib/services/email-templates";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import type { Database } from "@/types/supabase";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

/**
 * Accept an application and create a booking
 */
export async function acceptApplication(params: {
  applicationId: string;
  date?: string;
  compensation?: number;
  notes?: string;
}) {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Prepare booking data
    const bookingDateIso = params.date
      ? new Date(params.date).toISOString()
      : null; // RPC defaults to +7 days to match existing behavior

    const rpcCompensation =
      typeof params.compensation === "number" ? params.compensation : null;

    const rpcNotes = params.notes ?? null;

    // Atomic + idempotent acceptance happens in the DB (SECURITY DEFINER RPC).
    // This respects existing bookings RLS (no broad client insert policy needed).
    // NOTE: this RPC is added via migration; generated Supabase types may lag until
    // you re-generate `types/supabase` / `types/database.ts` from the schema.
    type AcceptRpcRow = {
      booking_id: string;
      application_status: ApplicationStatus;
      did_accept: boolean;
    };
    type RpcErrorShape = { message?: string } | null;
    type RpcResultShape<T> = { data: T | null; error: RpcErrorShape };
    type RpcClient = {
      rpc: (
        fn: string,
        args: {
          application_id: string;
          booking_date: string | null;
          booking_compensation: number | null;
          booking_notes: string | null;
        }
      ) => Promise<RpcResultShape<AcceptRpcRow[]>>;
    };

    const { data: rpcData, error: rpcError } = await (supabase as unknown as RpcClient).rpc(
      "accept_application_and_create_booking",
      {
        application_id: params.applicationId,
        booking_date: bookingDateIso,
        booking_compensation: rpcCompensation,
        booking_notes: rpcNotes,
      }
    );

    if (rpcError || !rpcData || rpcData.length === 0) {
      // Normalize expected failure modes into stable API errors.
      const msg = rpcError?.message || "Acceptance failed";
      if (msg.toLowerCase().includes("forbidden")) return { error: "Forbidden" };
      if (msg.toLowerCase().includes("unauthorized")) return { error: "Unauthorized" };
      if (msg.toLowerCase().includes("not found")) return { error: "Application not found" };
      if (
        msg.toLowerCase().includes("cannot accept") ||
        msg.toLowerCase().includes("rejected application")
      ) {
        return { error: "Cannot accept a rejected application" };
      }

      logger.error("accept_application_and_create_booking RPC error", rpcError);
      return { error: "Failed to create booking" };
    }

    const row = rpcData[0];

    const bookingId = row.booking_id;

    // Idempotency: if the application was already accepted, return success with the existing booking id.
    // Email side effects only fire on the first successful acceptance transition.
    if (row.did_accept) {
      const acceptedEventKey = `application-accepted:${params.applicationId}`;
      const bookingEventKey = `booking-confirmed:${bookingId}`;
      logger.info("[totl][applications] acceptance email events", {
        acceptedEventKey,
        bookingEventKey,
      });

      try {
        // Gather details for emails. All selects are explicit (no *).
        const { data: appDetails } = await supabase
          .from("applications")
          .select(
            `
            id,
            talent_id,
            gig_id,
            gigs!inner(id, title, location, client_id)
          `
          )
          .eq("id", params.applicationId)
          .maybeSingle();

        if (appDetails?.talent_id && appDetails.gigs?.title) {
          const talentId = appDetails.talent_id;
          const gigTitle = appDetails.gigs.title;
          const gigLocation = appDetails.gigs.location || "TBD";

          const { data: talentProfile } = await supabase
            .from("talent_profiles")
            .select("first_name, last_name")
            .eq("user_id", talentId)
            .maybeSingle();

          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", userId)
            .maybeSingle();

          // Email address lives in auth.users; retrieve via server-only admin client.
          const admin = createSupabaseAdminClient();
          const { data: talentUser } = await admin.auth.admin.getUserById(
            talentId
          );

          const talentEmail = talentUser?.user?.email;
          if (talentEmail) {
            const talentName = `${talentProfile?.first_name || ""} ${talentProfile?.last_name || ""}`.trim();
            const clientName = clientProfile?.display_name || "Client";

            const acceptedEmail = generateApplicationAcceptedEmail({
              name: talentName || "Talent",
              gigTitle,
              clientName,
              dashboardUrl: absoluteUrl("/talent/dashboard"),
            });
            await sendEmail({ to: talentEmail, subject: acceptedEmail.subject, html: acceptedEmail.html });
            await logEmailSent(talentEmail, "application-accepted", true);

            const bookingConfirmed = generateBookingConfirmedEmail({
              name: talentName || "Talent",
              gigTitle,
              bookingDate: bookingDateIso
                ? new Date(bookingDateIso).toLocaleDateString()
                : new Date(Date.now() + 7 * 864e5).toLocaleDateString(),
              bookingLocation: gigLocation,
              compensation:
                typeof params.compensation === "number"
                  ? String(params.compensation)
                  : "TBD",
              dashboardUrl: absoluteUrl("/talent/dashboard"),
            });
            await sendEmail({ to: talentEmail, subject: bookingConfirmed.subject, html: bookingConfirmed.html });
            await logEmailSent(talentEmail, "booking-confirmed", true);
          }
        }
      } catch (emailError) {
        // Best-effort: never fail the acceptance on email issues.
        logger.error("Failed to send acceptance emails", emailError);
      }
    }

    return { success: true, bookingId };
  } catch (error) {
    logger.error("Accept application error", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Reject an application
 */
export async function rejectApplication(params: {
  applicationId: string;
  reason?: string;
}) {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Load application and verify ownership
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(
        `
        id,
        status,
        gigs!inner(id, client_id)
      `
      )
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError || !application) {
      return { error: "Application not found" };
    }

    const clientId = application.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Check if already rejected
    if (application.status === "rejected") {
      // Idempotent: treat as success and do not re-send email.
      return { success: true };
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("applications")
      .update({ 
        status: "rejected" as ApplicationStatus,
        // Note: If you want to store rejection reason, add a column to applications table
      })
      .eq("id", params.applicationId);

    if (updateError) {
      logger.error("Application rejection error", updateError);
      return { error: "Failed to reject application" };
    }

    // Send email notification to talent
    try {
      const eventKey = `application-rejected:${params.applicationId}`;
      logger.info("[totl][applications] rejection email event", { eventKey });

      // Get talent profile and gig details
      const { data: fullApplication } = await supabase
        .from("applications")
        .select(`
          talent_id,
          gigs!inner(title)
        `)
        .eq("id", params.applicationId)
        .maybeSingle();

      if (fullApplication) {
        // Query talent profile separately since there's no direct relation
        const { data: talentProfile } = await supabase
          .from("talent_profiles")
          .select("first_name, last_name")
          .eq("user_id", fullApplication.talent_id)
          .maybeSingle();

        const admin = createSupabaseAdminClient();
        const { data: talentUser } = await admin.auth.admin.getUserById(
          fullApplication.talent_id
        );
        
        if (talentUser?.user?.email) {
          const gig = fullApplication.gigs;
          
          const talentName = `${talentProfile?.first_name || ""} ${talentProfile?.last_name || ""}`.trim();
          const rejected = generateApplicationRejectedEmail({
            name: talentName || "Talent",
            gigTitle: gig?.title || "Gig",
          });
          await sendEmail({ to: talentUser.user.email, subject: rejected.subject, html: rejected.html });
          await logEmailSent(talentUser.user.email, "application-rejected", true);
        }
      }
    } catch (emailError) {
      // Log email errors but don't fail the rejection
      logger.error("Failed to send rejection email", emailError);
    }

    return { success: true };
  } catch (error) {
    logger.error("Reject application error", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update application status (for review workflow)
 */
export async function updateApplicationStatus(params: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Load application and verify ownership
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(
        `
        id,
        gigs!inner(id, client_id)
      `
      )
      .eq("id", params.applicationId)
      .maybeSingle();

    if (appError || !application) {
      return { error: "Application not found" };
    }

    const clientId = application.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Update status
    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: params.status })
      .eq("id", params.applicationId);

    if (updateError) {
      logger.error("Status update error", updateError);
      return { error: "Failed to update status" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Update status error", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get client's bookings
 */
export async function getClientBookings() {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get bookings for client's gigs (no direct FK to talent_profiles, so fetch separately)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        gig_id,
        talent_id,
        status,
        compensation,
        notes,
        date,
        created_at,
        updated_at,
        gigs!inner(id, title, category, location, date, client_id),
        profiles!talent_id(display_name, avatar_path, role)
      `
      )
      .eq("gigs.client_id", userId)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      logger.error("Bookings fetch error", bookingsError);
      return { error: "Failed to load bookings" };
    }

    const rows = bookings || [];
    const talentIds = Array.from(new Set(rows.map((b) => b.talent_id).filter(Boolean)));

    const talentProfileByUserId = new Map<
      string,
      { first_name: string; last_name: string } | null
    >();

    if (talentIds.length > 0) {
      const { data: talentProfiles } = await supabase
        .from("talent_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", talentIds);

      (talentProfiles || []).forEach((tp) => {
        talentProfileByUserId.set(tp.user_id, {
          first_name: tp.first_name,
          last_name: tp.last_name,
        });
      });
    }

    const bookingsWithTalent = rows.map((booking) => ({
      ...booking,
      talent_profiles: talentProfileByUserId.get(booking.talent_id) || null,
    }));

    return { success: true, bookings: bookingsWithTalent };
  } catch (error) {
    logger.error("Get bookings error", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(params: {
  bookingId: string;
  status: BookingStatus;
  notes?: string;
}) {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Load booking and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        gigs!inner(id, client_id)
      `
      )
      .eq("id", params.bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return { error: "Booking not found" };
    }

    const clientId = booking.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Update booking with proper enum type
    type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
    const updateData: BookingUpdate = { 
      status: params.status as Database["public"]["Enums"]["booking_status"]
    };
    if (params.notes) {
      updateData.notes = params.notes;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", params.bookingId);

    if (updateError) {
      logger.error("Booking update error", updateError);
      return { error: "Failed to update booking" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Update booking error", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(params: {
  bookingId: string;
  reason?: string;
}) {
  try {
    const supabase = await createSupabaseServer();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Load booking and verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        notes,
        gigs!inner(id, client_id)
      `
      )
      .eq("id", params.bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return { error: "Booking not found" };
    }

    const clientId = booking.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return { error: "Booking already cancelled" };
    }

    // Update booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ 
        status: "cancelled" as BookingStatus,
        notes: params.reason ? `Cancellation reason: ${params.reason}` : booking.notes,
      })
      .eq("id", params.bookingId);

    if (updateError) {
      logger.error("Booking cancellation error", updateError);
      return { error: "Failed to cancel booking" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Cancel booking error", error);
    return { error: "An unexpected error occurred" };
  }
}

