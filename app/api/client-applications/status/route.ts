import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type ApplicationRow = {
  id: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

async function fetchLatestApplicationForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  canonicalEmail: string
): Promise<ApplicationRow | null> {
  const { data: byUserId, error: byUserIdError } = await supabase
    .from("client_applications")
    .select("id, status, admin_notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUserIdError) {
    logger.error("Error fetching client application by user_id", byUserIdError);
    throw byUserIdError;
  }

  if (byUserId) {
    return byUserId;
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from("client_applications")
    .select("id, status, admin_notes, created_at")
    .ilike("email", canonicalEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byEmailError) {
    logger.error("Error fetching client application by email", byEmailError);
    throw byEmailError;
  }

  return byEmail ?? null;
}

export async function GET() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logger.error("Unable to resolve auth user for status check", userError);
    return NextResponse.json({ error: "Unable to determine authenticated user" }, { status: 500 });
  }

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const canonicalEmail = user.email.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logger.error("Error fetching profile for client application status", profileError);
    return NextResponse.json(
      { error: "We couldn’t load your application status. Please try again." },
      { status: 500 }
    );
  }

  try {
    const application = await fetchLatestApplicationForUser(supabase, user.id, canonicalEmail);

    if (profile?.role === "client") {
      return NextResponse.json({
        status: "approved",
        applicationId: application?.id,
        adminNotes: application?.admin_notes ?? null,
      });
    }

    if (!application) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({
      status: application.status,
      applicationId: application.id,
      adminNotes: application.admin_notes,
    });
  } catch (e) {
    logger.error("Error loading client application status", e);
    return NextResponse.json(
      { error: "We couldn't load your application status right now. Please try again." },
      { status: 500 }
    );
  }
}

