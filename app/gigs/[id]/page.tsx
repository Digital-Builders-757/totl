import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, MapPin, DollarSign, Calendar, Clock, User, Building } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch the specific gig
  const { data: gig, error } = await supabase
    .from("gigs")
    .select(
      `
      *,
      client_profiles!inner (
        company_name,
        industry
      )
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !gig) {
    notFound();
  }

  // Fetch similar gigs (excluding current gig)
  const { data: similarGigs } = await supabase
    .from("gigs")
    .select("id, title, description, location, compensation, date, category, image")
    .eq("status", "active")
    .neq("id", id)
    .eq("category", gig.category)
    .limit(3);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/gigs"
            className="inline-flex items-center text-gray-600 hover:text-black mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gigs
          </Link>

          {/* Gig Header */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="relative h-64 md:h-96 bg-gray-100">
              <SafeImage
                src={gig.image}
                alt={gig.title}
                fill
                className="object-cover"
                fallbackSrc="/images/totl-logo-transparent.png"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/80 text-white border-0">
                  {gig.category || "Casting"}
                </Badge>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{gig.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Building className="mr-2 h-4 w-4" />
                    <span>{gig.client_profiles?.company_name || "Client"}</span>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">{gig.compensation}</div>
                  <div className="text-sm text-gray-500">Compensation</div>
                </div>
              </div>

              {/* Gig Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center">
                  <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-gray-600">{gig.location}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div className="text-gray-600">{new Date(gig.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-3 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-gray-600">1 Day</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{gig.description}</p>
              </div>

              {/* Requirements */}
              {gig.requirements && gig.requirements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {gig.requirements.map((requirement: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-black text-white hover:bg-black/90 flex-1">
                  Apply for this Gig
                </Button>
                <Button variant="outline" className="flex-1">
                  Save for Later
                </Button>
              </div>
            </div>
          </div>

          {/* Similar Gigs */}
          {similarGigs && similarGigs.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Similar Gigs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similarGigs.map((similarGig) => (
                  <Link key={similarGig.id} href={`/gigs/${similarGig.id}`}>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="relative h-48 bg-gray-100">
                        <SafeImage
                          src={similarGig.image}
                          alt={similarGig.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackSrc="/images/totl-logo-transparent.png"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/80 text-white border-0">
                            {similarGig.category || "Casting"}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                          {similarGig.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {similarGig.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{similarGig.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span>{similarGig.compensation}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Calendar size={14} />
                          <span>{new Date(similarGig.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
