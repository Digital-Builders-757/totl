"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
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

    // Load application and verify ownership
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(
        `
        id,
        gig_id,
        talent_id,
        status,
        gigs!inner(id, client_id, compensation)
      `
      )
      .eq("id", params.applicationId)
      .single();

    if (appError || !application) {
      return { error: "Application not found" };
    }

    const clientId = application.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Check if already accepted
    if (application.status === "accepted") {
      return { error: "Application already accepted" };
    }

    // Prepare booking data
    const bookingDate = params.date
      ? new Date(params.date).toISOString()
      : new Date(Date.now() + 7 * 864e5).toISOString(); // Default: 7 days from now

    const compensation = params.compensation || 
      parseFloat(String(application.gigs?.compensation).replace(/[^0-9.-]/g, "")) || 
      null;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        gig_id: application.gig_id,
        talent_id: application.talent_id,
        date: bookingDate,
        compensation,
        notes: params.notes || null,
        status: "confirmed" as BookingStatus,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking creation error:", bookingError);
      return { error: "Failed to create booking" };
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "accepted" as ApplicationStatus })
      .eq("id", params.applicationId);

    if (updateError) {
      console.error("Application update error:", updateError);
      // Don't fail the whole operation if just the status update fails
    }

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Accept application error:", error);
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
      .single();

    if (appError || !application) {
      return { error: "Application not found" };
    }

    const clientId = application.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return { error: "Forbidden" };
    }

    // Check if already rejected
    if (application.status === "rejected") {
      return { error: "Application already rejected" };
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
      console.error("Application rejection error:", updateError);
      return { error: "Failed to reject application" };
    }

    // Send email notification to talent
    try {
      // Get talent profile and gig details
      const { data: fullApplication } = await supabase
        .from("applications")
        .select(`
          talent_id,
          gigs!inner(title)
        `)
        .eq("id", params.applicationId)
        .single();

      if (fullApplication) {
        // Query talent profile separately since there's no direct relation
        const { data: talentProfile } = await supabase
          .from("talent_profiles")
          .select("first_name, last_name")
          .eq("user_id", fullApplication.talent_id)
          .single();

        const { data: talentUser } = await supabase.auth.admin.getUserById(fullApplication.talent_id);
        
        if (talentUser?.user?.email) {
          const gig = fullApplication.gigs;
          
          const talentName = `${talentProfile?.first_name || ""} ${talentProfile?.last_name || ""}`.trim();

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-application-rejected`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: talentUser.user.email,
              talentName: talentName || "Talent",
              gigTitle: gig?.title || "Gig",
            }),
          });
        }
      }
    } catch (emailError) {
      // Log email errors but don't fail the rejection
      console.error("Failed to send rejection email:", emailError);
    }

    return { success: true };
  } catch (error) {
    console.error("Reject application error:", error);
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
      .single();

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
      console.error("Status update error:", updateError);
      return { error: "Failed to update status" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update status error:", error);
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

    // Get bookings for client's gigs
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        gigs!inner(id, title, category, location, date, client_id),
        profiles!talent_id(display_name, avatar_path, role)
      `
      )
      .eq("gigs.client_id", userId)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
      return { error: "Failed to load bookings" };
    }

    return { success: true, bookings };
  } catch (error) {
    console.error("Get bookings error:", error);
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
      .single();

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
      console.error("Booking update error:", updateError);
      return { error: "Failed to update booking" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update booking error:", error);
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
      .single();

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
      console.error("Booking cancellation error:", updateError);
      return { error: "Failed to cancel booking" };
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel booking error:", error);
    return { error: "An unexpected error occurred" };
  }
}

