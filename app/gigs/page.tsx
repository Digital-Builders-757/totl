export const dynamic = "force-dynamic";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Search, MapPin, DollarSign, Filter, ArrowRight, Calendar } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";

export default async function GigsPage() {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not found - returning empty gigs list");
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">Find Gigs</h1>
              <p className="text-gray-600 max-w-3xl">
                Browse through available casting opportunities and gigs. Filter by category,
                location, and more to find the perfect match for your talents.
              </p>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-500">Unable to load gigs at this time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const supabase = createServerComponentClient<Database>({ cookies });

  // FIXED: Explicit column selection, no aggregates
  const { data: gigs, error } = await supabase
    .from("gigs")
    .select(
      `
      id, 
      title, 
      description, 
      location, 
      compensation, 
      date, 
      category,
      image,
      client_id
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gigs:", error);
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">Find Gigs</h1>
              <p className="text-gray-600 max-w-3xl">
                Browse through available casting opportunities and gigs. Filter by category,
                location, and more to find the perfect match for your talents.
              </p>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-500">Unable to load gigs at this time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gigsList = gigs || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Find Gigs</h1>
            <p className="text-gray-600 max-w-3xl">
              Browse through available casting opportunities and gigs. Filter by category, location,
              and more to find the perfect match for your talents.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  placeholder="Search for gigs, roles, or keywords"
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filters
                </Button>
                <Button className="bg-black text-white hover:bg-black/90">Search</Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Editorial
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Commercial
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Runway
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                E-commerce
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Beauty
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Sportswear
              </Badge>
            </div>
          </div>

          {/* Gigs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigsList.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`}>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="relative h-48 bg-gray-100">
                    <SafeImage
                      src={gig.image}
                      alt={gig.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/images/totl-logo-transparent.png"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/80 text-white border-0">
                        {gig.category || "Casting"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {gig.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gig.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{gig.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>{gig.compensation}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>{new Date(gig.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {gigsList.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Gigs Available</h3>
              <p className="text-gray-500 mb-6">
                There are currently no active gigs. Check back later for new opportunities.
              </p>
              <Button asChild>
                <Link href="/post-gig">Post a Gig</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
