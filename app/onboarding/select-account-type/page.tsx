"use server";

import Image from "next/image";
import { redirect } from "next/navigation";

import { selectAccountType } from "./actions";
import { Button } from "@/components/ui/button";
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
        <div className="relative z-10 grid gap-6 md:grid-cols-2">
          <div className="p-10 border-b border-white/5 md:border-b-0 md:border-r md:p-12">
            <h1 className="text-3xl font-semibold mb-3">Choose your path</h1>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Select Talent if you&apos;re looking for gigs, or Client if you want to book talent.
            </p>
            <form action={selectAccountType} className="space-y-4">
              <input type="hidden" name="accountType" value="talent" />
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Talent</p>
              <p className="text-white/70 mb-4">
                Build your profile, submit to casting calls, and access your talent dashboard.
              </p>
              <Button type="submit" className="w-full bg-slate-200 text-black">
                I&apos;m Talent
              </Button>
            </form>
          </div>
          <div className="p-10 md:p-12">
            <form action={selectAccountType} className="space-y-4">
              <input type="hidden" name="accountType" value="client" />
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Client</p>
              <p className="text-white/70 mb-4">
                Post gigs, browse premium talent, and manage applications from one place.
              </p>
              <Button type="submit" className="w-full bg-amber-500 text-black">
                I&apos;m Client
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

