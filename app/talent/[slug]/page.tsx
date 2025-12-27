import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TalentProfileClient } from "./talent-profile-client";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
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
>;

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
    
    const PUBLIC_FIELDS = `
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

    let candidates: PublicTalentProfile[] = [];

    // Strategy A: UUID path (exact match, fast, backward compatibility)
    if (uuidRegex.test(slug)) {
      const { data, error: uuidError } = await supabase
        .from("talent_profiles")
        .select(PUBLIC_FIELDS)
        .or(`id.eq.${slug},user_id.eq.${slug}`)
        .limit(1);

      if (uuidError) {
        console.error("Supabase error fetching talent by UUID:", uuidError);
        error = `Database error: ${uuidError.message}`;
      } else {
        candidates = (data ?? []) as PublicTalentProfile[];
      }
    }
    // Strategy B: Name-based path (bounded candidates)
    else if (nameParts) {
      const { data, error: nameError } = await supabase
        .from("talent_profiles")
        .select(PUBLIC_FIELDS)
        .ilike("first_name", nameParts.firstName)
        .ilike("last_name", `%${nameParts.lastName}%`)
        .limit(25); // Hard cap to prevent enumeration

      if (nameError) {
        console.error("Supabase error fetching talent by name:", nameError);
        error = `Database error: ${nameError.message}`;
      } else {
        candidates = (data ?? []) as PublicTalentProfile[];
      }
    }
    // Strategy C: Invalid slug format
    else {
      // Slug doesn't match UUID and can't be parsed as name
      // Will result in notFound() below
      candidates = [];
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
          console.debug(`[PR3] Phone fetch blocked by RLS for talent ${talent.user_id}:`, phoneError.code);
        }

        talent = { ...(talent as PublicTalentProfile), phone: data?.phone ?? null };
      } else {
        talent = { ...(talent as PublicTalentProfile), phone: null };
      }
    }
  } catch (err: unknown) {
    console.error("Unexpected error fetching talent profile:", err);
    error = err instanceof Error ? err.message : "An unexpected error occurred.";
  }

  // PR4: If no match found or error occurred, return 404
  if (error || !talent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-seamless-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-black rounded-xl shadow-lg overflow-hidden border border-gray-600">
            {/* Header Section */}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 line-clamp-2">
                  {talent.first_name} {talent.last_name}
                </h1>
                {talent.location && (
                  <div className="flex items-center text-gray-300 text-sm sm:text-base">
                    <MapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{talent.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 md:p-8 bg-black">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  {/* About Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                    <p className="text-gray-300 leading-relaxed">
                      {talent.experience || "No experience details provided."}
                    </p>
                  </div>

                  {/* Specialties */}
                  {(() => {
                    const specialtiesArray = normalizeToStringArray(talent.specialties);
                    if (specialtiesArray.length === 0) return null;
                    return (
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Specialties</h2>
                        <div className="flex flex-wrap gap-2">
                          {specialtiesArray.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium border border-gray-300"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Languages */}
                  {(() => {
                    const languagesArray = normalizeToStringArray(talent.languages);
                    if (languagesArray.length === 0) return null;
                    return (
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Languages</h2>
                        <div className="flex flex-wrap gap-2">
                          {languagesArray.map((language, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium border border-gray-300"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sidebar - Client component handles authentication logic */}
                <TalentProfileClient talent={talent} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

