"use server";

import "server-only";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export async function adminSetApplicationStatusAction(input: {
  applicationId: string;
  status: ApplicationStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error: roleErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleErr) return { ok: false, error: "Failed to verify admin role" };
  if (profile?.role !== "admin") return { ok: false, error: "Forbidden" };

  const { error: updateErr } = await supabase
    .from("applications")
    .update({ status: input.status })
    .eq("id", input.applicationId);

  if (updateErr) return { ok: false, error: updateErr.message };

  return { ok: true };
}


