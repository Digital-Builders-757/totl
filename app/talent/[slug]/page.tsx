import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TalentProfileClient } from "./talent-profile-client";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createNameSlug } from "@/lib/utils/slug";
import type { Database } from "@/types/supabase";

// Use proper database types instead of custom interface
type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

interface TalentProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TalentProfilePage({ params }: TalentProfilePageProps) {
  const { slug } = await params;
  
  // Use createSupabaseServer for proper server-side authentication
  // This handles cookies correctly in server components
  const supabase = await createSupabaseServer();

  let talent: TalentProfile | null = null;
  let error: string | null = null;

  try {
    // First, try to find by slug (name-based)
    // Fetch all talent profiles and match by generated slug
    const { data: allTalent, error: fetchError } = await supabase
      .from("talent_profiles")
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        phone,
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
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase error fetching talent profiles:", fetchError);
      error = `Database error: ${fetchError.message}`;
    } else if (allTalent) {
      // Find talent by matching slug
      talent =
        allTalent.find((t) => {
          const talentSlug = createNameSlug(t.first_name, t.last_name);
          return talentSlug === slug;
        }) ?? null;

      // If not found by slug, try to find by ID (for backward compatibility)
      if (!talent) {
        // Check if slug is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
          talent = allTalent.find((t) => t.id === slug || t.user_id === slug) ?? null;
        }
      }
    }
  } catch (err: unknown) {
    console.error("Unexpected error fetching talent profile:", err);
    error = err instanceof Error ? err.message : "An unexpected error occurred.";
  }

  if (error || !talent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-seamless-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/talent">
            <Button
              variant="outline"
              className="flex items-center border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Talent
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
                  {talent.specialties && talent.specialties.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-4">Specialties</h2>
                      <div className="flex flex-wrap gap-2">
                        {talent.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium border border-gray-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {talent.languages && talent.languages.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-4">Languages</h2>
                      <div className="flex flex-wrap gap-2">
                        {talent.languages.map((language, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-black rounded-full text-sm font-medium border border-gray-300"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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

