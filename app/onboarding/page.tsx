import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";
import { PROFILE_ROLE_SELECT } from "@/lib/db/selects";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(PATHS.LOGIN);
  }

  // Auth-critical: never select '*'
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_ROLE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  // If profile is missing (bootstrap gap), allow onboarding UI to render rather than bouncing.
  if (error) {
    console.error("Error fetching profile:", error);
  } else if (profile?.role) {
    // If user already has a role, redirect to their dashboard
    if (profile.role === "talent") {
      redirect(PATHS.TALENT_DASHBOARD);
    } else if (profile.role === "client") {
      redirect(PATHS.CLIENT_DASHBOARD);
    } else if (profile.role === "admin") {
      redirect(PATHS.ADMIN_DASHBOARD);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Please provide some basic information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
