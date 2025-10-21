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

  // Calculate range for current page
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch data with count in a single query
  const { data: gigs, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  // If we got a range error, it means the page is beyond available data
  // In this case, just show empty results instead of erroring
  const gigsList = error?.code === "PGRST103" ? [] : ((gigs || []) as GigRow[]);
  const total = typeof count === "number" ? count : gigsList.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  // Handle errors - PGRST103 is expected for out-of-range pages, just show empty results
  if (error && error.code === "PGRST103") {
    // Pagination out of range - this is expected, just show empty results
    console.warn(`Pagination out of range: page ${page}, total rows: ${total}`);
  } else if (error && error.code !== "PGRST103") {
    // Unexpected error - log to Sentry and show error page
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
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-40">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <div className="panel-frosted w-fit mx-auto mb-6 px-6 py-3">
              <span className="text-white font-medium text-sm">Active Opportunities</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-gradient-glow animate-apple-fade-in">
              Find Gigs
            </h1>
            <p className="text-xl text-[var(--oklch-text-secondary)] max-w-4xl mx-auto leading-relaxed animate-apple-slide-up">
              Browse through available casting opportunities and gigs. Filter by category, location,
              and more to find the perfect match for your talents.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="panel-frosted grain-texture relative p-8 shadow-lg">
              <form className="flex flex-col md:flex-row gap-6 relative z-10" method="get">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="q"
                    defaultValue={keyword}
                    placeholder="Search keywords..."
                    className="input-glow pl-12 py-6 text-xl h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 w-full md:w-auto">
                  <select
                    name="category"
                    defaultValue={category}
                    className="h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20"
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
                    className="h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white"
                  />
                  <Input
                    name="compensation"
                    defaultValue={compensation}
                    placeholder="Compensation"
                    className="h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white"
                  />
                  <input type="hidden" name="page" value={String(page)} />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="button-glow px-8 py-6 text-lg border-0"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gigsList.map((gig) => (
                <div
                  key={gig.id}
                  className="card-backlit overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={gig.image_url}
                      alt={gig.title}
                      fill
                      className="transition-transform duration-500 group-hover:scale-110 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/90 text-black font-semibold backdrop-blur-sm"
                      >
                        {gig.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                        {gig.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-[var(--oklch-text-secondary)] text-sm line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-[var(--oklch-text-tertiary)]">
                        <MapPin className="h-4 w-4 mr-2" />
                        {gig.location}
                      </div>
                      <div className="flex items-center text-sm text-[var(--oklch-text-tertiary)]">
                        <DollarSign className="h-4 w-4 mr-2 text-white" />
                        <span className="text-white font-semibold">{gig.compensation}</span>
                      </div>
                      <div className="flex items-center text-sm text-[var(--oklch-text-tertiary)]">
                        <Calendar className="h-4 w-4 mr-2" />
                        {gig.date}
                      </div>
                    </div>
                    <Button className="w-full button-glow border-0 mt-4" asChild>
                      <Link href={`/gigs/${gig.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
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
