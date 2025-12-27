"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureProfileExists } from "@/lib/actions/auth-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { decidePostAuthRedirect } from "@/lib/routing/decide-redirect";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { determineDestination } from "@/lib/utils/determine-destination";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"] | null;
type AccountType = Database["public"]["Enums"]["account_type_enum"] | "unassigned" | null;

export type BootState = {
  userId: string;
  email: string | null;
  role: UserRole;
  accountType: Exclude<AccountType, null>;
  hasProfilesRow: boolean;
  hasDomainProfileRow: boolean;
  needsOnboarding: boolean;
  nextPath: string;
};

function normalizeAccountType(value: AccountType): Exclude<AccountType, null> {
  return (value ?? "unassigned") as Exclude<AccountType, null>;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function computeTalentNeedsOnboarding(params: {
  displayName: string | null;
  talentFirstName: string | null;
  talentLastName: string | null;
}): boolean {
  // Minimal, stable definition:
  // - user must have a name surface (profiles.display_name), and
  // - talent_profiles first/last name must be populated (not just empty-string defaults).
  return (
    !isNonEmptyText(params.displayName) ||
    !isNonEmptyText(params.talentFirstName) ||
    !isNonEmptyText(params.talentLastName)
  );
}

export async function getBootState(params?: {
  /**
   * Treat this as a post-auth decision point (login/callback) and honor returnUrl when safe.
   * This should be used by auth callback and login redirect surfaces.
   */
  postAuth?: boolean;
  returnUrlRaw?: string | null;
}): Promise<BootState | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Always ensure the profiles row exists (bootstrap gap repair). This is idempotent.
  // Note: this MUST remain server-side (Staff).
  try {
    const ensured = await ensureProfileExists();
    if (ensured?.error) {
      // Fail closed to a safe terminal; dashboards will still protect themselves.
      console.error("[boot] ensureProfileExists failed:", ensured.error);
    }
  } catch (error) {
    // If ensureProfileExists throws an exception, log it but continue
    // The profile query below will handle missing profiles gracefully
    console.error("[boot] ensureProfileExists threw exception:", error);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_type, display_name")
    .eq("id", user.id)
    .maybeSingle<{
      role: Database["public"]["Enums"]["user_role"] | null;
      account_type: Database["public"]["Enums"]["account_type_enum"] | null;
      display_name: string | null;
    }>();

  const role = (profile?.role ?? null) as UserRole;
  const accountType = normalizeAccountType(profile?.account_type ?? "unassigned");
  const isAdmin = role === "admin";
  const isClient = role === "client" || accountType === "client";

  // Domain profile truth: depends on terminal.
  let hasDomainProfileRow = false;
  let needsOnboarding = false;

  if (isAdmin) {
    hasDomainProfileRow = true;
    needsOnboarding = false;
  } else if (isClient) {
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("user_id, company_name")
      .eq("user_id", user.id)
      .maybeSingle<{ user_id: string; company_name: string }>();

    hasDomainProfileRow = Boolean(clientProfile);
    // For promoted clients, consider "onboarding" complete once a company name is set.
    // (We route them to /client/profile for completion, not to /onboarding.)
    needsOnboarding = !isNonEmptyText(clientProfile?.company_name);
  } else {
    const { data: talentProfile } = await supabase
      .from("talent_profiles")
      .select("user_id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle<{ user_id: string; first_name: string; last_name: string }>();

    hasDomainProfileRow = Boolean(talentProfile);
    needsOnboarding = computeTalentNeedsOnboarding({
      displayName: profile?.display_name ?? null,
      talentFirstName: talentProfile?.first_name ?? null,
      talentLastName: talentProfile?.last_name ?? null,
    });
  }

  // Compute nextPath (server-owned truth).
  // - If onboarding required → go to onboarding entrypoint.
  // - Otherwise route by canonical destination decision.
  let nextPath: string;
  if (!isAdmin && needsOnboarding && !isClient) {
    nextPath = ONBOARDING_PATH;
  } else if (!isAdmin && needsOnboarding && isClient) {
    nextPath = "/client/profile";
  } else if (params?.postAuth) {
    const profileAccess = {
      role,
      account_type: (accountType === "unassigned" ? null : accountType) as
        | Database["public"]["Enums"]["account_type_enum"]
        | null,
    };
    const decision = decidePostAuthRedirect({
      pathname: PATHS.LOGIN,
      returnUrlRaw: params.returnUrlRaw ?? null,
      signedOut: false,
      profile: profileAccess,
      fallback: PATHS.TALENT_DASHBOARD,
    });
    nextPath = decision.type === "redirect" ? decision.to : determineDestination(profileAccess);
  } else {
    nextPath = determineDestination({
      role,
      account_type: (accountType === "unassigned" ? null : accountType) as
        | Database["public"]["Enums"]["account_type_enum"]
        | null,
    });
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    accountType,
    hasProfilesRow: Boolean(profile),
    hasDomainProfileRow,
    needsOnboarding,
    nextPath,
  };
}

export async function finishOnboardingAction(params: {
  fullName: string;
  location?: string;
  experience?: string;
  website?: string;
}): Promise<{ ok: true; nextPath: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(PATHS.LOGIN);
  }

  // Repair baseline profile if needed (idempotent).
  const ensured = await ensureProfileExists();
  if (ensured?.error) {
    return { ok: false, error: "Failed to initialize profile. Please try again." };
  }

  const fullName = params.fullName.trim();
  const [firstNameRaw, ...rest] = fullName.split(/\s+/);
  const firstName = (firstNameRaw ?? "").trim();
  const lastName = rest.join(" ").trim();

  if (!isNonEmptyText(firstName) || !isNonEmptyText(lastName)) {
    return { ok: false, error: "Please enter your first and last name." };
  }

  // Update profiles display_name (safe user-owned field).
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ display_name: fullName })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error("[finishOnboardingAction] profiles update failed:", profileUpdateError);
    return { ok: false, error: "Failed to save your profile. Please try again." };
  }

  // Ensure talent_profiles exists + update basic fields.
  // Note: does NOT touch role/account_type (promotion boundary).
  const { error: talentUpsertError } = await supabase.from("talent_profiles").upsert(
    {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      location: isNonEmptyText(params.location) ? params.location.trim() : null,
      experience: isNonEmptyText(params.experience) ? params.experience.trim() : null,
      portfolio_url: isNonEmptyText(params.website) ? params.website.trim() : null,
    },
    { onConflict: "user_id" }
  );

  if (talentUpsertError) {
    console.error("[finishOnboardingAction] talent_profiles upsert failed:", talentUpsertError);
    return { ok: false, error: "Failed to save talent details. Please try again." };
  }

  revalidatePath("/", "layout");

  const boot = await getBootState();
  return { ok: true, nextPath: boot?.nextPath ?? PATHS.TALENT_DASHBOARD };
}


