import { redirect } from "next/navigation";

import TalentProfileForm from "@/components/forms/talent-profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

type TalentProfileFormInitialData = Pick<
  Database["public"]["Tables"]["talent_profiles"]["Row"],
  | "first_name"
  | "last_name"
  | "phone"
  | "age"
  | "location"
  | "experience"
  | "portfolio_url"
  | "height"
  | "measurements"
  | "hair_color"
  | "eye_color"
  | "shoe_size"
  | "languages"
  | "specialties"
> & {
  bust?: string | null;
  hips?: string | null;
  waist?: string | null;
  suit?: string | null;
  resume_link?: string | null;
};

function isMissingCompCardColumnError(error: { message?: string } | null): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /(bust|hips|waist|suit|resume_link)/i.test(message);
}

export default async function TalentProfilePage() {
  const supabase = await createSupabaseServer();

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(PATHS.LOGIN);
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect(PATHS.LOGIN);
  }

  // Verify this is a talent user
  if (profile.role !== "talent") {
    redirect("/dashboard");
  }

  // Get the talent profile (including specialties for conditional field visibility)
  const baseSelect =
    "id,user_id,first_name,last_name,phone,age,location,experience,portfolio_url,height,measurements,hair_color,eye_color,shoe_size,languages,specialties,created_at,updated_at";
  const compCardSelect = `${baseSelect},bust,hips,waist,suit,resume_link`;

  const primaryTalentProfile = await supabase
    .from("talent_profiles")
    .select(compCardSelect)
    .eq("user_id", user.id)
    .single();

  let talentProfile = primaryTalentProfile.data as Record<string, unknown> | null;
  let talentError = primaryTalentProfile.error as { message?: string; code?: string } | null;

  if (talentError && isMissingCompCardColumnError(talentError)) {
    const fallbackTalentProfile = await supabase
      .from("talent_profiles")
      .select(baseSelect)
      .eq("user_id", user.id)
      .single();
    talentProfile = fallbackTalentProfile.data as Record<string, unknown> | null;
    talentError = fallbackTalentProfile.error as { message?: string; code?: string } | null;
  }

  if (talentError && talentError.code !== "PGRST116") {
    logger.error("Error fetching talent profile", talentError);
  }

  return (
    <PageShell className="bg-black" containerClassName="max-w-3xl py-4 sm:py-6">
      <div className="space-y-6">
        <PageHeader
          title="Complete Your Profile"
          subtitle="Add your information to make your profile visible to clients."
        />

        <TalentProfileForm initialData={talentProfile as TalentProfileFormInitialData | null} />
      </div>
    </PageShell>
  );
}
