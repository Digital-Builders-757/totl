import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBootState } from "@/lib/actions/boot-actions";
import { PATHS } from "@/lib/constants/routes";

// Force dynamic rendering to prevent build-time Supabase access
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const boot = await getBootState();
  if (!boot) redirect(PATHS.LOGIN);

  // Single truth: if onboarding is not needed, do not render this page.
  if (!boot.needsOnboarding) redirect(boot.nextPath);

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
