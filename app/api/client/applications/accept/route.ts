import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/database";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

export async function POST(req: Request) {
  try {
    const { applicationId, date, compensation, notes } = (await req.json()) as {
      applicationId: string;
      date?: string;
      compensation?: string;
      notes?: string;
    };

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load application and ensure the authenticated user owns the gig
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select(
        `id, gig_id, talent_id, status, gigs!inner(id, client_id)`
      )
      .eq("id", applicationId)
      .single();

    if (appErr || !app) {
      Sentry.captureException(appErr || new Error("Application not found"));
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // @ts-expect-error - joined column path
    const clientId = app.gigs?.client_id as string | undefined;
    if (clientId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookingDate = date ? new Date(date).toISOString() : new Date(Date.now() + 7 * 864e5).toISOString();
    const numericComp = compensation ? Number(String(compensation).replace(/[^0-9.-]/g, "")) : null;

    // Create booking
    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert(
        [{
          gig_id: app.gig_id,
          talent_id: app.talent_id,
          date: bookingDate as unknown as Database["public"]["Tables"]["bookings"]["Insert"]["date"],
          compensation: numericComp as unknown as Database["public"]["Tables"]["bookings"]["Insert"]["compensation"],
          notes: (notes || null) as Database["public"]["Tables"]["bookings"]["Insert"]["notes"],
          status: "confirmed",
        } satisfies Database["public"]["Tables"]["bookings"]["Insert"]],
        { returning: "representation" }
      )
      .select("id")
      .single();

    if (bookErr || !booking) {
      Sentry.captureException(bookErr || new Error("Booking creation failed"));
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // Update application status to accepted
    const { error: updErr } = await supabase
      .from("applications")
      .update({ status: "accepted" as ApplicationRow["status"] })
      .eq("id", applicationId);

    if (updErr) {
      Sentry.captureException(updErr);
    }

    // Send email notifications
    try {
      // Get talent, client, and gig details for emails
      const { data: talentProfile } = await supabase
        .from("talent_profiles")
        .select("first_name, last_name, user_id")
        .eq("user_id", app.talent_id)
        .single();

      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const { data: gig } = await supabase
        .from("gigs")
        .select("title, location")
        .eq("id", app.gig_id)
        .single();

      const { data: talentUser } = await supabase.auth.admin.getUserById(app.talent_id);

      if (talentUser?.user?.email && talentProfile && gig) {
        const talentName = `${talentProfile.first_name || ""} ${talentProfile.last_name || ""}`.trim();
        
        // 1. Send application accepted email to talent
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-application-accepted`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: talentUser.user.email,
            talentName: talentName || "Talent",
            gigTitle: gig.title,
            clientName: clientProfile?.full_name || "Client",
            dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/talent/dashboard`,
          }),
        });

        // 2. Send booking confirmed email to talent
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-booking-confirmed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: talentUser.user.email,
            talentName: talentName || "Talent",
            gigTitle: gig.title,
            bookingDate: date ? new Date(date).toLocaleDateString() : new Date(Date.now() + 7 * 864e5).toLocaleDateString(),
            bookingLocation: gig.location || "TBD",
            compensation: compensation || "TBD",
            dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/talent/dashboard`,
          }),
        });
      }
    } catch (emailError) {
      // Log email errors but don't fail the application acceptance
      console.error("Failed to send acceptance emails:", emailError);
      Sentry.captureException(emailError, {
        tags: { feature: "email-notifications", email_type: "application-accepted" },
      });
    }

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


