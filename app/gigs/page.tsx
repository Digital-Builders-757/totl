export const dynamic = "force-dynamic";

import * as Sentry from "@sentry/nextjs";
import { Search, MapPin, DollarSign, ArrowRight, Calendar, ChevronLeft, Home, LayoutDashboard } from "lucide-react";
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

  // Get user role for breadcrumb
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: string | null = null;
  
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
  }

  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-40">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm px-2 sm:px-0">
            <Link 
              href="/" 
              className="text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <span className="text-[var(--oklch-text-muted)]">/</span>
            {userRole === "talent" && (
              <>
                <Link 
                  href="/talent/dashboard" 
                  className="text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <span className="text-[var(--oklch-text-muted)]">/</span>
              </>
            )}
            {userRole === "client" && (
              <>
                <Link 
                  href="/client/dashboard" 
                  className="text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <span className="text-[var(--oklch-text-muted)]">/</span>
              </>
            )}
            <span className="text-white font-medium">Find Gigs</span>
          </div>

          <div className="mb-12 sm:mb-16 text-center px-4 sm:px-0">
            <div className="panel-frosted w-fit mx-auto mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3">
              <span className="text-white font-medium text-xs sm:text-sm">Active Opportunities</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 text-gradient-glow animate-apple-fade-in">
              Find Gigs
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--oklch-text-secondary)] max-w-4xl mx-auto leading-relaxed animate-apple-slide-up">
              Browse through available casting opportunities and gigs. Filter by category, location,
              and more to find the perfect match for your talents.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="panel-frosted grain-texture relative p-4 sm:p-6 md:p-8 shadow-lg">
              <form className="flex flex-col gap-4 sm:gap-5 md:gap-6 relative z-10" method="get">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <Input
                    name="q"
                    defaultValue={keyword}
                    placeholder="Search keywords..."
                    className="input-glow pl-10 sm:pl-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full">
                  <select
                    name="category"
                    defaultValue={category}
                    className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] text-white border-[var(--oklch-border)] rounded-lg px-3 focus:ring-2 focus:ring-white/20 text-base"
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
                    className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white text-base"
                  />
                  <Input
                    name="compensation"
                    defaultValue={compensation}
                    placeholder="Compensation"
                    className="min-h-[52px] sm:h-14 md:h-16 bg-[var(--oklch-surface)] border-[var(--oklch-border)] text-white text-base sm:col-span-2 md:col-span-1"
                  />
                  <input type="hidden" name="page" value={String(page)} />
                </div>
                <Button
                  type="submit"
                  className="button-glow px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg border-0 min-h-[52px] w-full sm:w-auto sm:self-start"
                >
                  Search
                </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {gigsList.map((gig) => (
                <div
                  key={gig.id}
                  className="card-backlit overflow-hidden group cursor-pointer active:scale-95 sm:hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={gig.image_url}
                      alt={gig.title}
                      fill
                      className="transition-transform duration-500 group-hover:scale-110 object-cover"
                      context="gig-card"
                      fallbackSrc="https://picsum.photos/800/600?random"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/90 text-black font-semibold backdrop-blur-sm"
                      >
                        {gig.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors line-clamp-2">
                        {gig.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <p className="text-[var(--oklch-text-secondary)] text-sm line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs sm:text-sm text-[var(--oklch-text-tertiary)]">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{gig.location}</span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-[var(--oklch-text-tertiary)]">
                        <DollarSign className="h-4 w-4 mr-2 text-white flex-shrink-0" />
                        <span className="text-white font-semibold">{gig.compensation}</span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-[var(--oklch-text-tertiary)]">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{gig.date}</span>
                      </div>
                    </div>
                    <Button className="w-full button-glow border-0 mt-3 sm:mt-4 min-h-[48px]" asChild>
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
          <div className="max-w-4xl mx-auto mt-8 sm:mt-10 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-white/80">
              <div className="text-xs sm:text-sm order-2 sm:order-1">
                Showing {Math.min(total, from + 1)}–{Math.min(total, to + 1)} of {total}
              </div>
              <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                <Button 
                  variant="outline" 
                  className="apple-glass border-white/30 flex-1 sm:flex-none min-h-[48px]"
                  asChild 
                  disabled={page <= 1}
                >
                  <Link href={buildPageHref(page - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="apple-glass border-white/30 flex-1 sm:flex-none min-h-[48px]" 
                  asChild 
                  disabled={page >= totalPages}
                >
                  <Link href={buildPageHref(page + 1)}>
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
