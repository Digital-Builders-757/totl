import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .single();

    if (!profile?.avatar_path) {
      return NextResponse.json({ url: null });
    }

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60); // 1 hour

    return NextResponse.json({ url: signed?.signedUrl ?? null });
  } catch (error) {
    console.error("Avatar URL refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
