import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
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
    <PageShell
      className="grain-texture glow-backplate overflow-x-hidden"
      containerClassName="mx-auto max-w-3xl px-4 py-10 sm:px-6"
    >
      <SectionCard paddingClassName="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--oklch-text-primary)]">Complete Your Profile</h1>
          <p className="text-[var(--oklch-text-secondary)]">
            Please provide some basic information to get started
          </p>
        </div>
        <OnboardingForm />
      </SectionCard>
    </PageShell>
  );
}
