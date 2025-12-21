"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

export async function selectAccountType(formData: FormData) {
  // MVP: All signups are talent - Career Builder access is via application link from Talent Dashboard
  // The form field is kept for backward compatibility but the value is always ignored
  const type = formData.get("accountType");
  
  // Validate that type exists (basic validation)
  // Note: We always set account_type to "talent" regardless of input per MVP requirement
  if (!type || typeof type !== "string") {
    throw new Error("Account type is required");
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.ONBOARDING_SELECT_ACCOUNT_TYPE)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null; account_type: string | null }>();

  if (profile?.role === "admin") {
    redirect(PATHS.ADMIN_DASHBOARD);
    return;
  }

  // If user already has an account type set, redirect to appropriate dashboard
  // This matches the page redirect logic for consistency
  if (profile?.account_type && profile.account_type !== "unassigned") {
    const destination = profile.account_type === "client" ? PATHS.CLIENT_DASHBOARD : PATHS.TALENT_DASHBOARD;
    redirect(destination);
    return;
  }

  // MVP: Always set to talent and redirect to Talent Dashboard
  // Career Builder access is via application link from Talent Dashboard
  const updatePayload = {
    account_type: "talent",
    role: "talent",
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload as Database["public"]["Tables"]["profiles"]["Update"])
    .eq("id", user.id);

  if (error) {
    console.error("Unable to update account type:", error);
    throw new Error("Failed to update account type");
  }

  revalidatePath("/");

  // MVP: Always redirect to Talent Dashboard (Career Builder via application link)
  redirect(PATHS.TALENT_DASHBOARD);
}

