import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TalentProfileClient } from "./talent-profile-client";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { createNameSlug, parseSlug } from "@/lib/utils/slug";
import { canClientSeeTalentSensitive } from "@/lib/utils/talent-access";
import type { Database } from "@/types/supabase";

// Use proper database types instead of custom interface
type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type PublicTalentProfile = Pick<
  TalentProfile,
  | "id"
  | "user_id"
  | "first_name"
  | "last_name"
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
  | "experience_years"
  | "specialties"
  | "weight"
  | "created_at"
  | "updated_at"
> & {
  bust?: string | null;
  hips?: string | null;
  waist?: string | null;
  suit?: string | null;
  resume_link?: string | null;
};

type SupabaseLikeError = { message?: string } | null;

function isMissingCompCardColumnError(error: SupabaseLikeError): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /(bust|hips|waist|suit|resume_link)/i.test(message);
}

interface TalentProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Normalizes a value that might be an array, JSON string, comma-separated string, or null
 * into a proper string array. Handles migration inconsistencies where specialties/languages
 * might be stored as TEXT instead of TEXT[].
 */
function normalizeToStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      // Try parsing as JSON string first
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      // If not JSON, treat as comma-separated string
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function compCardQuickStats(talent: PublicTalentProfile): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (talent.height) out.push({ label: "Height", value: talent.height });
  if (talent.weight) out.push({ label: "Weight", value: `${talent.weight} lbs` });
  if (talent.bust && talent.waist && talent.hips) {
    out.push({
      label: "Bust · waist · hips",
      value: `${talent.bust} · ${talent.waist} · ${talent.hips}`,
    });
  }
  if (talent.suit) out.push({ label: "Suit", value: talent.suit });
  if (talent.shoe_size) out.push({ label: "Shoe", value: talent.shoe_size });
  if (talent.measurements && !(talent.bust && talent.waist && talent.hips)) {
    out.push({ label: "Measurements", value: talent.measurements });
  }
  return out.slice(0, 6);
}

// Public talent profile page - dynamic rendering required due to createSupabaseServer() / cookies()
// Cannot use ISR because route accesses request-bound values (cookies for session)
export const dynamic = "force-dynamic";

export default async function TalentProfilePage({ params }: TalentProfilePageProps) {
  const { slug } = await params;
  
  // Use createSupabaseServer for proper server-side authentication
  // This handles cookies correctly in server components
  const supabase = await createSupabaseServer();

  let talent: (PublicTalentProfile & Pick<TalentProfile, "phone">) | null = null;
  let error: string | null = null;

  try {
    // PR4: Bounded candidate query - no enumeration
    // Parse slug to determine query strategy
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const nameParts = parseSlug(slug);
    
    const PUBLIC_FIELDS_BASE = `
      id,
      user_id,
      first_name,
      last_name,
      age,
      location,
      experience,
      portfolio_url,
      height,
      measurements,
      hair_color,
      eye_color,
      shoe_size,
      languages,
      experience_years,
      specialties,
      weight,
      created_at,
      updated_at
    `;
    const PUBLIC_FIELDS_WITH_COMP_CARD = `${PUBLIC_FIELDS_BASE}, bust, hips, waist, suit, resume_link`;

    const fetchCandidates = async (
      selectColumns: string
    ): Promise<{ data: PublicTalentProfile[]; error: SupabaseLikeError }> => {
      if (uuidRegex.test(slug)) {
        const { data, error: uuidError } = await supabase
          .from("talent_profiles")
          .select(selectColumns)
          .eq("user_id", slug)
          .limit(1);
        return {
          data: (data ?? []) as unknown as PublicTalentProfile[],
          error: uuidError,
        };
      }

      if (nameParts) {
        const { data, error: nameError } = await supabase
          .from("talent_profiles")
          .select(selectColumns)
          .ilike("first_name", nameParts.firstName)
          .ilike("last_name", `%${nameParts.lastName}%`)
          .limit(25); // Hard cap to prevent enumeration
        return {
          data: (data ?? []) as unknown as PublicTalentProfile[],
          error: nameError,
        };
      }

      return { data: [], error: null };
    };

    let candidates: PublicTalentProfile[] = [];
    let candidateQueryError: SupabaseLikeError = null;

    const withCompCard = await fetchCandidates(PUBLIC_FIELDS_WITH_COMP_CARD);
    candidates = withCompCard.data;
    candidateQueryError = withCompCard.error;

    if (candidateQueryError && isMissingCompCardColumnError(candidateQueryError)) {
      const fallback = await fetchCandidates(PUBLIC_FIELDS_BASE);
      candidates = fallback.data;
      candidateQueryError = fallback.error;
    }

    if (candidateQueryError) {
      logger.error("Supabase error fetching talent profile candidates", candidateQueryError, { slug });
      error = `Database error: ${candidateQueryError.message ?? "Unknown query error"}`;
    }

    // PR4: Final exact slug match on bounded candidate set (safe, small)
    if (candidates.length > 0 && !error) {
      const exactMatches = candidates.filter((t) => {
        const talentSlug = createNameSlug(t.first_name, t.last_name);
        return talentSlug === slug;
      });

      // PR4: Ambiguity handling - duplicates return notFound() (no guessing, preserves privacy)
      if (exactMatches.length === 1) {
        talent = { ...exactMatches[0], phone: null };
      } else if (exactMatches.length > 1) {
        // Multiple exact matches = ambiguous = unavailable
        talent = null;
      } else if (uuidRegex.test(slug)) {
        // UUID path: if we got candidates, use first one (UUID is exact)
        talent = candidates[0] ? { ...candidates[0], phone: null } : null;
      } else {
        // Name path: no exact slug match found
        talent = null;
      }
    }

    // IMPORTANT: Do not ship sensitive fields (e.g. phone) in the public RSC payload.
    // If the viewer is authorized (self/client/admin), fetch phone separately on the server.
    if (talent) {
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      let viewerProfile: Pick<ProfileRow, "id" | "role"> | null = null;
      if (viewer?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("id,role")
          .eq("id", viewer.id)
          .maybeSingle();
        viewerProfile = data ?? null;
      }

      // PR3: Relationship-bound sensitive field access for clients
      // Self, admin, or client with relationship (applicant/booking) can view sensitive fields
      let canViewSensitive = false;

      if (viewerProfile) {
        if (viewerProfile.id === talent.user_id) {
          canViewSensitive = true; // Self
        } else if (viewerProfile.role === "admin") {
          canViewSensitive = true; // Admin override
        } else if (viewerProfile.role === "client") {
          // PR3: Client can only see sensitive fields if relationship exists
          canViewSensitive = await canClientSeeTalentSensitive({
            supabase,
            clientId: viewerProfile.id,
            talentUserId: talent.user_id,
          });
        }
      }

      if (canViewSensitive) {
        // PR3: Fetch phone separately, respecting RLS
        // If RLS denies access, data will be null (treat as "protected" not "missing")
        const { data, error: phoneError } = await supabase
          .from("talent_profiles")
          .select("phone")
          .eq("user_id", talent.user_id)
          .maybeSingle();

        // If error is RLS-related or data is null, treat as protected (not missing)
        // This ensures we don't confuse "no phone on file" with "phone exists but is protected"
        if (phoneError && phoneError.code !== "PGRST116") {
          // Non-"not found" error likely means RLS denied access
          logger.debug(`[PR3] Phone fetch blocked by RLS for talent`, { talentId: talent.user_id, errorCode: phoneError.code });
        }

        talent = { ...(talent as PublicTalentProfile), phone: data?.phone ?? null };
      } else {
        talent = { ...(talent as PublicTalentProfile), phone: null };
      }
    }
  } catch (err: unknown) {
    logger.error("Unexpected error fetching talent profile", err);
    error = err instanceof Error ? err.message : "An unexpected error occurred.";
  }

  // PR4: If no match found or error occurred, return 404
  if (error || !talent) {
    notFound();
  }

  const quickStats = compCardQuickStats(talent);
  const displayLocation = talent.location?.trim() || null;

  return (
    <PageShell ambientTone="lifted" containerClassName="max-w-4xl py-5 sm:py-8">
      <PageHeader
        title={`${talent.first_name} ${talent.last_name}`}
        subtitle={
          displayLocation
            ? displayLocation
            : "TOTL talent profile — book through the platform."
        }
        breadcrumbs={
          <>
            <Link
              href={PATHS.HOME}
              className="transition-colors hover:text-[var(--oklch-text-primary)]"
            >
              Home
            </Link>
            <span className="text-[var(--oklch-text-tertiary)]">→</span>
            <span className="text-[var(--oklch-text-secondary)]">Talent</span>
          </>
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={PATHS.HOME} className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        }
        className="mb-6 sm:mb-8"
      />

      <div className="overflow-hidden rounded-xl border border-white/10 shadow-lg panel-frosted card-backlit">
        <div className="relative aspect-16-9 sm:aspect-3-4 md:aspect-16-9 lg:h-96">
          <SafeImage
            src={
              talent.portfolio_url &&
              !talent.portfolio_url.includes("youtube.com") &&
              !talent.portfolio_url.includes("youtu.be")
                ? talent.portfolio_url
                : "https://picsum.photos/800/400"
            }
            alt={`${talent.first_name} ${talent.last_name}`}
            fill
            className="object-cover"
            context="talent-profile-header"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
        </div>

        {quickStats.length > 0 ? (
          <div className="border-b border-white/10 bg-gradient-to-r from-black/55 via-black/40 to-black/30 px-4 py-4 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              At a glance
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
              {quickStats.map((row) => (
                <div key={row.label} className="min-w-0">
                  <dt className="text-[11px] text-white/55">{row.label}</dt>
                  <dd className="truncate text-sm font-medium text-white">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="bg-[var(--oklch-bg)]/92 p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="mb-2 text-xl font-bold tracking-tight text-[var(--oklch-text-primary)] sm:text-2xl">
                  Bio
                </h2>
                <p className="text-sm text-[var(--oklch-text-secondary)]">
                  Narrative from this talent&apos;s TOTL profile.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oklch-text-secondary)] sm:text-base">
                  {talent.experience || "No experience details provided."}
                </p>
              </div>

              {(() => {
                const specialtiesArray = normalizeToStringArray(talent.specialties);
                if (specialtiesArray.length === 0) return null;
                return (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-bold tracking-tight text-[var(--oklch-text-primary)] sm:text-2xl">
                      Specialties
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {specialtiesArray.map((specialty, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-[var(--oklch-text-primary)]"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const languagesArray = normalizeToStringArray(talent.languages);
                if (languagesArray.length === 0) return null;
                return (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-bold tracking-tight text-[var(--oklch-text-primary)] sm:text-2xl">
                      Languages
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {languagesArray.map((language, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-[var(--oklch-text-primary)]"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <TalentProfileClient talent={talent} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

