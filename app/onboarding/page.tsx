import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/supabase";

// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  // Get user profile data directly - no need for getSession since middleware handles auth
  const { data: profile, error } = await supabase.from("profiles").select("*").single();

  if (error || !profile) {
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
