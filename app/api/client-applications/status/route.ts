"use server";

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();

  const { data: application, error } = await supabase
    .from("client_applications")
    .select("id, status, admin_notes, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching client application status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!application) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: application.status,
    applicationId: application.id,
    adminNotes: application.admin_notes,
  });
}

