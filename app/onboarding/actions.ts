"use server";

import { finishOnboardingAction } from "@/lib/actions/boot-actions";

// Canonical finish onboarding entrypoint.
// IMPORTANT: does not allow role escalation; client is admin-promoted only.
export async function finishOnboarding(formData: {
  full_name: string;
  experience?: string;
  location?: string;
  website?: string;
}) {
  return await finishOnboardingAction({
    fullName: formData.full_name,
    experience: formData.experience,
    location: formData.location,
    website: formData.website,
  });
}
