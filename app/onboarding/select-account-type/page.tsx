"use server";

import { redirect } from "next/navigation";

import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export default async function SelectAccountTypePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(ONBOARDING_PATH)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; account_type: string | null }>();

  if (profile?.role === "admin") {
    redirect(PATHS.ADMIN_DASHBOARD);
  }

  const accountType = profile?.account_type ?? "unassigned";

  // MVP: Redirect all authenticated users to Talent Dashboard
  // Career Builder access is via application link from Talent Dashboard
  if (accountType === "client") {
    redirect(PATHS.CLIENT_DASHBOARD);
  }

  // Default to Talent Dashboard (all signups are talent)
  // MVP: This page redirects all authenticated users to Talent Dashboard
  // Career Builder access is via application link from Talent Dashboard
  redirect(PATHS.TALENT_DASHBOARD);
}

