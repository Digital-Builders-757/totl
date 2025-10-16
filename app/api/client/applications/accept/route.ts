import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
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
    const numericComp = compensation ? Number(String(compensation).replace(/[^0-9.\-]/g, "")) : null;

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

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


