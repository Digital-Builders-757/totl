"use server";

import Image from "next/image";
import { redirect } from "next/navigation";

import { ClientAccountTypeSelector } from "./client-selector";
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

  if (accountType === "client") {
    redirect("/client/apply");
  }

  if (accountType === "talent") {
    redirect("/talent/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center py-12">
      <div className="relative w-full max-w-5xl rounded-3xl bg-black/70 border border-white/10 shadow-2xl shadow-black/70 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/totl-logo-transparent.png"
            alt="TOTL Agency brand"
            fill
            className="object-cover opacity-10"
          />
        </div>
        <ClientAccountTypeSelector />
      </div>
    </div>
  );
}

