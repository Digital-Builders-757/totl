import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

type PaidTalentStats = {
  monthlyCount: number;
  annualCount: number;
  unknownPlanCount: number;
  estimatedMrrCents: number;
  estimatedArrCents: number;
};

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/dashboard");
  }

  // Paid members = active talent subscriptions (no Stripe API calls here).
  // Definition (MVP): role='talent' AND subscription_status='active' bucketed by subscription_plan.
  const getCount = async (plan: "monthly" | "annual" | "unknown") => {
    const base = supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "talent")
      .eq("subscription_status", "active");

    if (plan === "monthly") {
      return await base.eq("subscription_plan", "monthly");
    }

    if (plan === "annual") {
      return await base.eq("subscription_plan", "annual");
    }

    // Unknown bucket: active talent with null/other plan values
    // PostgREST: include NULLs explicitly; NOT IN alone will not count NULLs.
    return await base.or("subscription_plan.is.null,subscription_plan.not.in.(monthly,annual)");
  };

  const [{ count: monthlyCount = 0 }, { count: annualCount = 0 }, { count: unknownPlanCount = 0 }] =
    await Promise.all([getCount("monthly"), getCount("annual"), getCount("unknown")]);

  // Pricing constants (MVP)
  const MONTHLY_CENTS = 2000; // $20.00
  const ANNUAL_CENTS = 20000; // $200.00
  const annualMrrCents = Math.round(ANNUAL_CENTS / 12); // $16.67/mo equivalent

  const paidTalentStats: PaidTalentStats = {
    monthlyCount: monthlyCount ?? 0,
    annualCount: annualCount ?? 0,
    unknownPlanCount: unknownPlanCount ?? 0,
    estimatedMrrCents: (monthlyCount ?? 0) * MONTHLY_CENTS + (annualCount ?? 0) * annualMrrCents,
    estimatedArrCents: (monthlyCount ?? 0) * (MONTHLY_CENTS * 12) + (annualCount ?? 0) * ANNUAL_CENTS,
  };

  // Fetch dashboard data
  const { data: gigs } = await supabase
    .from("gigs")
    .select("id,title,client_id,status,location,compensation,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: applications } = await supabase
    .from("applications")
    .select("id,gig_id,talent_id,status,message,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AdminDashboardClient
      user={user}
      gigs={(gigs || []) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      applications={(applications || []) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      paidTalentStats={paidTalentStats}
    />
  );
}
