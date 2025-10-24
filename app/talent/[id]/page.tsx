import { createServerClient } from "@supabase/ssr";
import { ArrowLeft, Mail, Phone, MapPin, Star } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import type { Database } from "@/types/database";

// Use proper database types instead of custom interface
type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

interface TalentProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TalentProfilePage({ params }: TalentProfilePageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let talent: TalentProfile | null = null;
  let error: string | null = null;

  try {
    const { data, error: dbError } = await supabase
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
      .eq("id", id)
      .single();

    if (dbError) {
      console.error("Supabase error fetching talent profile:", dbError);
      error = `Database error: ${dbError.message}`;
    } else {
      talent = data as TalentProfile;
    }
  } catch (err: unknown) {
    console.error("Unexpected error fetching talent profile:", err);
    error = err instanceof Error ? err.message : "An unexpected error occurred.";
  }

  if (error || !talent) {
    notFound();
  }

  // Check user role from profiles table (following project patterns)
  let userRole: Database["public"]["Enums"]["user_role"] | null = null;
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profileData?.role || null;
  }

  // Determine if user can see sensitive information
  // Only talent themselves, clients, or admins can see sensitive details
  const canViewSensitiveInfo = user && (
    user.id === talent.user_id || 
    userRole === 'client' || 
    userRole === 'admin'
  );

  // For now, we'll use a placeholder contact method since we can't access auth.users directly
  // In a real app, you might want to add an email field to the profiles table or use a contact form

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
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 896px"
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

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Information - Only visible to authenticated users */}
                  {canViewSensitiveInfo ? (
                    <div className="bg-white rounded-lg p-6 border border-gray-300">
                      <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        {talent.phone && (
                          <div className="flex items-center text-black">
                            <Phone className="mr-3 h-4 w-4 text-black" />
                            {talent.phone}
                          </div>
                        )}
                        <div className="flex items-center text-black">
                          <Mail className="mr-3 h-4 w-4 text-black" />
                          Contact through agency
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-6 border border-gray-300">
                      <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Contact details are only visible to registered clients</p>
                        <Button asChild className="apple-button">
                          <Link href="/login">Sign In to View Contact Info</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Physical Stats - Only visible to authenticated users */}
                  {canViewSensitiveInfo ? (
                    <div className="bg-white rounded-lg p-6 border border-gray-300">
                      <h3 className="text-lg font-semibold text-black mb-4">Physical Stats</h3>
                      <div className="space-y-2 text-sm text-black">
                        {talent.age && (
                          <div className="flex justify-between">
                            <span>Age:</span>
                            <span className="font-medium text-black">{talent.age}</span>
                          </div>
                        )}
                        {talent.height && (
                          <div className="flex justify-between">
                            <span>Height:</span>
                            <span className="font-medium text-black">{talent.height}</span>
                          </div>
                        )}
                        {talent.weight && (
                          <div className="flex justify-between">
                            <span>Weight:</span>
                            <span className="font-medium text-black">{talent.weight} lbs</span>
                          </div>
                        )}
                        {talent.hair_color && (
                          <div className="flex justify-between">
                            <span>Hair:</span>
                            <span className="font-medium text-black">{talent.hair_color}</span>
                          </div>
                        )}
                        {talent.eye_color && (
                          <div className="flex justify-between">
                            <span>Eyes:</span>
                            <span className="font-medium text-black">{talent.eye_color}</span>
                          </div>
                        )}
                        {talent.shoe_size && (
                          <div className="flex justify-between">
                            <span>Shoe Size:</span>
                            <span className="font-medium text-black">{talent.shoe_size}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-6 border border-gray-300">
                      <h3 className="text-lg font-semibold text-black mb-4">Physical Stats</h3>
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Physical details are only visible to registered clients</p>
                        <Button asChild className="apple-button">
                          <Link href="/login">Sign In to View Details</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {talent.experience_years && (
                    <div className="bg-white rounded-lg p-6 border border-gray-300">
                      <h3 className="text-lg font-semibold text-black mb-4">Experience</h3>
                      <div className="flex items-center text-black">
                        <Star className="mr-2 h-4 w-4 text-black" />
                        <span>{talent.experience_years} years in the industry</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <a
                      href={`mailto:contact@thetotlagency.com?subject=Booking Inquiry for ${talent.first_name} ${talent.last_name}&body=Hi, I'm interested in booking ${talent.first_name} ${talent.last_name} for a project. Please provide more information.`}
                      className="flex-1"
                    >
                      <Button className="w-full bg-white text-black hover:bg-gray-200">
                        Contact Talent
                      </Button>
                    </a>
                    {talent.portfolio_url ? (
                      <a
                        href={talent.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                        >
                          View Portfolio
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 flex-1"
                        disabled
                      >
                        View Portfolio
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
