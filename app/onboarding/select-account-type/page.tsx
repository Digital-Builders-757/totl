"use server";

import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

const onboardingPath = "/onboarding/select-account-type";

export default async function SelectAccountTypePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?returnUrl=${encodeURIComponent(onboardingPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; account_type: string | null }>();

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }

  const accountType = profile?.account_type ?? "unassigned";

  // MVP: Redirect all authenticated users to Talent Dashboard
  // Career Builder access is via application link from Talent Dashboard
  if (accountType === "client") {
    redirect("/client/dashboard");
  }

  // Default to Talent Dashboard (all signups are talent)
  // MVP: This page redirects all authenticated users to Talent Dashboard
  // Career Builder access is via application link from Talent Dashboard
  redirect("/talent/dashboard");
}

