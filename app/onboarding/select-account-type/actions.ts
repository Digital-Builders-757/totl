"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

const onboardingPath = "/onboarding/select-account-type";

export async function selectAccountType(formData: FormData) {
  const type = formData.get("accountType");
  if (type !== "talent" && type !== "client") {
    throw new Error("Invalid account type");
  }

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
    return;
  }

  if (profile?.account_type && profile.account_type !== "unassigned") {
    const destination = profile.account_type === "client" ? "/client/apply" : "/talent/dashboard";
    redirect(destination);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      account_type: type,
      role: type as "talent" | "client",
    } as Database["public"]["Tables"]["profiles"]["Update"])
    .eq("id", user.id);

  if (error) {
    console.error("Unable to update account type:", error);
    throw new Error("Failed to update account type");
  }

  revalidatePath("/");

  if (type === "client") {
    redirect("/client/apply");
  } else {
    redirect("/talent/dashboard");
  }
}

