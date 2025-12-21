import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Unable to resolve auth user for status check:", userError);
    return NextResponse.json({ error: "Unable to determine authenticated user" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: application, error } = await supabase
    .from("client_applications")
    .select("id, status, admin_notes, created_at")
    .eq("user_id", user.id)
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

