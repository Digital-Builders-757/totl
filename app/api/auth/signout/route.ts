import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-client";

export async function POST() {
  const supabase = await createSupabaseRouteHandlerClient();
  await supabase.auth.signOut();
  // Optionally clear any custom cookies here
  return NextResponse.json({ success: true });
}
