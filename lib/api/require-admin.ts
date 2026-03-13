import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type AdminProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role"
>;

export type RequireAdminResult =
  | { ok: true; supabase: SupabaseClient<Database>; user: { id: string } }
  | { ok: false; response: NextResponse };

/**
 * Ensures the request is from an authenticated user with profiles.role = 'admin'.
 * Use at the start of admin-only API routes.
 *
 * @returns { ok: true, supabase, user } on success, or { ok: false, response } to return early
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<AdminProfile>();

  if (profileError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to verify admin role" },
        { status: 500 }
      ),
    };
  }

  if (!profile || profile.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, supabase, user };
}
