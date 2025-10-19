export const dynamic = "force-dynamic";

import * as Sentry from "@sentry/nextjs";
import { Search, MapPin, DollarSign, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/database";

type GigRow = Pick<
  Database["public"]["Tables"]["gigs"]["Row"],
  | "id"
  | "title"
  | "description"
  | "location"
  | "compensation"
  | "date"
  | "category"
  | "image_url"
  | "client_id"
>;

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServer();

  const sp = await searchParams;
  const keyword = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category.trim() : "";
  const location = typeof sp.location === "string" ? sp.location.trim() : "";
  const compensation =
    typeof sp.compensation === "string" ? sp.compensation.trim() : "";
  const pageParam = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 9;

  let query = supabase
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
    `,
      { count: "exact" }
    )
    .eq("status", "active");

  // Apply filters
  if (keyword) {
    // Search title OR description OR location
    query = query.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,location.ilike.%${keyword}%`
    );
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }
  if (compensation) {
    query = query.ilike("compensation", `%${compensation}%`);
  }

  // First, get the count to avoid range errors
  const { count: totalCount, error: countError } = await query
    .select("*", { count: "exact", head: true });

  if (countError) {
    Sentry.captureException(countError);
    console.error("Error fetching gigs count:", countError);
  }

  const total = typeof totalCount === "number" ? totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // If page is beyond available data, fetch the last valid page
  const validPage = Math.min(page, totalPages);
  const from = (validPage - 1) * pageSize;
  const to = from + pageSize - 1;

  // Only fetch if there's data to fetch
  let gigs: GigRow[] = [];
  let error = null;
  
  if (total > 0) {
    const result = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    
    gigs = (result.data || []) as GigRow[];
    error = result.error;
  }

  if (error) {
    Sentry.captureException(error);
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

  const gigsList = gigs;

  // Helper to preserve query params while changing page
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (compensation) params.set("compensation", compensation);
    params.set("page", String(targetPage));
    return `/gigs?${params.toString()}`;
  };

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
              <form className="flex flex-col md:flex-row gap-6" method="get">
                <div className="relative flex-grow">
                  <Input
                    name="q"
                    defaultValue={keyword}
                    placeholder="Search keywords"
                    className="apple-input py-6 text-xl h-16"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 w-full md:w-auto">
                  <select
                    name="category"
                    defaultValue={category}
                    className="apple-input h-16 bg-transparent text-white border-white/30 rounded-md px-3"
                  >
                    <option value="">All categories</option>
                    <option value="editorial">Editorial</option>
                    <option value="commercial">Commercial</option>
                    <option value="runway">Runway</option>
                    <option value="beauty">Beauty</option>
                    <option value="fitness">Fitness</option>
                    <option value="e-commerce">E-commerce</option>
                    <option value="other">Other</option>
                  </select>
                  <Input
                    name="location"
                    defaultValue={location}
                    placeholder="Location"
                    className="apple-input h-16"
                  />
                  <Input
                    name="compensation"
                    defaultValue={compensation}
                    placeholder="Compensation"
                    className="apple-input h-16"
                  />
                  <input type="hidden" name="page" value={String(page)} />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="apple-button px-8 py-6 text-lg"
                  >
                    Search
                  </Button>
                </div>
              </form>
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

          {/* Pagination */}
          <div className="max-w-4xl mx-auto mt-10">
            <div className="flex items-center justify-between text-white/80">
              <div className="text-sm">
                Showing {Math.min(total, from + 1)}–{Math.min(total, to + 1)} of {total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="apple-glass border-white/30"
                  asChild disabled={page <= 1}>
                  <Link href={buildPageHref(page - 1)}>Previous</Link>
                </Button>
                <Button variant="outline" className="apple-glass border-white/30" asChild disabled={page >= totalPages}>
                  <Link href={buildPageHref(page + 1)}>Next</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
