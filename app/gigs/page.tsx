export const dynamic = "force-dynamic";

import { Search, MapPin, DollarSign, Filter, ArrowRight, Calendar } from "lucide-react";

import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function GigsPage() {
  const supabase = await createSupabaseServer();

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
      image_url,
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
          </div>

          {/* Gigs Grid */}
          {gigsList.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Gigs</h3>
                <p className="text-gray-600 mb-4">
                  There are currently no active gigs available. Check back later for new
                  opportunities!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigsList.map((gig) => (
                <div key={gig.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                  <div className="relative aspect-[4/3]">
                    <SafeImage
                      src={gig.image_url || ""}
                      alt={gig.title}
                      fill
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button className="w-full bg-white text-black hover:bg-white/90" asChild>
                        <Link href={`/gigs/${gig.id}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {gig.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {gig.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gig.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {gig.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {gig.compensation}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {gig.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
