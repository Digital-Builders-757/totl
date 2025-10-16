export const dynamic = "force-dynamic";

import { Search, MapPin, DollarSign, Filter, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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
      <div className="min-h-screen bg-black pt-40">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 text-center">
              <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-white animate-apple-fade-in">
                Find Gigs
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed animate-apple-slide-up">
                Browse through available casting opportunities and gigs. Filter by category,
                location, and more to find the perfect match for your talents.
              </p>
            </div>
            <div className="text-center py-20">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 animate-apple-scale-in">
                  <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-12 w-12 text-red-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 animate-apple-fade-in">
                  Unable to Load Gigs
                </h3>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-apple-slide-up">
                  We&apos;re experiencing technical difficulties. Please try again later.
                </p>
                <Button className="apple-button px-8 py-4 text-lg animate-apple-glow">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gigsList = gigs || [];

  return (
    <div className="min-h-screen bg-black pt-40">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-white animate-apple-fade-in">
              Find Gigs
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed animate-apple-slide-up">
              Browse through available casting opportunities and gigs. Filter by category, location,
              and more to find the perfect match for your talents.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="apple-glass rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search for gigs, roles, or keywords"
                    className="apple-input py-6 text-xl h-16"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="apple-glass px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    <Filter size={20} className="mr-2" />
                    Filters
                  </Button>
                  <Button className="apple-button px-8 py-6 text-lg">Search</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Gigs Grid */}
          {gigsList.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 animate-apple-scale-in">
                  <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 animate-apple-fade-in">
                    No Active Gigs
                  </h3>
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-apple-slide-up">
                    There are currently no active gigs available. Check back later for new
                    opportunities!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigsList.map((gig) => (
                <div
                  key={gig.id}
                  className="bg-gray-900 rounded-xl shadow-sm overflow-hidden group border border-gray-700"
                >
                  <div className="relative aspect-[4/3]">
                    <SafeImage
                      src={gig.image_url}
                      alt={gig.title}
                      fill
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Button className="w-full bg-white text-black hover:bg-gray-200" asChild>
                        <Link href={`/gigs/${gig.id}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors">
                        {gig.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/10 text-white border-white/20"
                      >
                        {gig.category}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{gig.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {gig.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {gig.compensation}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
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
