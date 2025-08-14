import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, MapPin, Instagram, Globe, Star, Calendar, User } from "lucide-react";
import { cookies } from "next/headers";

import Link from "next/link";
import { notFound } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch the specific talent profile
  const { data: talent, error } = await supabase
    .from("talent_profiles")
    .select(
      `
      *,
      profiles!inner (
        display_name,
        avatar_url,
        email_verified,
        bio,
        instagram_handle,
        website
      )
    `
    )
    .eq("user_id", id)
    .single();

  if (error || !talent) {
    notFound();
  }

  // Fetch portfolio items for this talent
  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("talent_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/talent"
            className="inline-flex items-center text-gray-600 hover:text-black mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Talent
          </Link>

          {/* Talent Header */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="relative h-64 md:h-96 bg-gray-100">
              <SafeImage
                src={talent.profiles?.avatar_url}
                alt={talent.profiles?.display_name || "Talent"}
                fill
                className="object-cover"
                placeholderQuery="professional portrait"
                fallbackSrc="/images/totl-logo-transparent.png"
              />
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {talent.profiles?.display_name || `${talent.first_name} ${talent.last_name}`}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <User className="mr-2 h-4 w-4" />
                    <span>Professional Model</span>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="font-medium">4.8</span>
                    <span className="text-gray-500 ml-1">(24 reviews)</span>
                  </div>
                  <div className="text-sm text-gray-500">Available for bookings</div>
                </div>
              </div>

              {/* Talent Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center">
                  <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-gray-600">New York, NY</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Experience</div>
                    <div className="text-gray-600">{talent.experience_years || 0} years</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Specialties</div>
                    <div className="text-gray-600">
                      {talent.specialties?.slice(0, 2).join(", ") || "Fashion, Editorial"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {talent.profiles?.bio ||
                    "Professional model with experience in fashion, editorial, and commercial work. Passionate about creating compelling visual stories and bringing creative visions to life."}
                </p>
              </div>

              {/* Specialties */}
              {talent.specialties && talent.specialties.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {talent.specialties.map((specialty: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-gray-50">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact & Social */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-black text-white hover:bg-black/90 flex-1">
                  Book This Talent
                </Button>
                <Button variant="outline" className="flex-1">
                  View Portfolio
                </Button>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 mt-6">
                {talent.profiles?.instagram_handle && (
                  <a
                    href={`https://instagram.com/${talent.profiles.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-black"
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    <span>@{talent.profiles.instagram_handle}</span>
                  </a>
                )}
                {talent.profiles?.website && (
                  <a
                    href={talent.profiles.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-black"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          {portfolioItems && portfolioItems.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="relative h-48 bg-gray-100">
                      <SafeImage
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        placeholderQuery="fashion photography"
                        fallbackSrc="/images/totl-logo-transparent.png"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{item.caption || "Portfolio Item"}</span>
                        <span>{new Date(item.created_at).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
