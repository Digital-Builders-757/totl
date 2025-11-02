import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function POST() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  // Optionally clear any custom cookies here
  return NextResponse.json({ success: true });
}
