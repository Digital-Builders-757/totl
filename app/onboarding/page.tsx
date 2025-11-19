import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer();

  // Get user profile data directly - use maybeSingle() to prevent 406 errors
  const { data: profile, error } = await supabase.from("profiles").select("*").maybeSingle();

  // âœ… Fixed: Proper type guards
  if (error) {
    console.error("Error fetching profile:", error);
    redirect("/login");
  }

  if (!profile) {
    console.error("No profile found");
    redirect("/login");
  }

  // If user already has a role, redirect to their dashboard
  if (profile.role) {
    if (profile.role === "talent") {
      redirect("/talent/dashboard");
    } else if (profile.role === "client") {
      redirect("/client/dashboard");
    } else if (profile.role === "admin") {
      redirect("/admin/dashboard");
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
