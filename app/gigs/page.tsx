export const dynamic = "force-dynamic";

import { Search, ArrowRight, ChevronLeft, Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInGate } from "@/components/auth/sign-in-gate";
import { GigCard } from "@/components/gigs/gig-card";
import { GigsFilterForm } from "@/components/gigs/gigs-filter-form";
import { RetryButton } from "@/components/gigs/retry-button";
import { SavedSearchesBar } from "@/components/gigs/saved-searches-bar";
import { PageShell } from "@/components/layout/page-shell";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { Button } from "@/components/ui/button";
import { getCategoryFilterSet } from "@/lib/constants/gig-categories";
import { GIGS_SORT_OPTIONS, type GigsSortValue } from "@/lib/constants/gigs-sort";
import { getPayRangeBounds, type PayRangeValue } from "@/lib/constants/pay-range-filter";
import { RADIUS_OPTIONS, type RadiusValue } from "@/lib/constants/radius-filter";
import { shouldShowSubscriptionPrompt } from "@/lib/gig-access";
import { geocode, milesToMeters } from "@/lib/server/geocode";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type SubscriptionAwareProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role" | "subscription_status"
>;

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

  // PR3: Check auth first, before any DB queries (G1: list requires sign-in)
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user session, show sign-in gate immediately (no DB query wasted)
  if (!user) {
    return <SignInGate variant="gigs" />;
  }

  const sp = await searchParams;
  const rawKeyword = typeof sp.q === "string" ? sp.q.trim() : "";
  // Sanitize filter inputs to prevent query injection via .or() / .ilike() string interpolation
  const sanitizeFilterInput = (s: string) => s.replace(/[,()]/g, " ").trim();
  const keyword = sanitizeFilterInput(rawKeyword);
  const category = typeof sp.category === "string" ? sp.category.trim() : "";
  const location = typeof sp.location === "string" ? sanitizeFilterInput(sp.location) : "";
  const radiusMilesRaw = typeof sp.radius_miles === "string" ? sp.radius_miles.trim() : "";
  const radiusMiles: RadiusValue = RADIUS_OPTIONS.some((o) => o.value === radiusMilesRaw)
    ? (radiusMilesRaw as RadiusValue)
    : "";
  const compensation =
    typeof sp.compensation === "string" ? sanitizeFilterInput(sp.compensation) : "";
  const payRange =
    (typeof sp.pay_range === "string" ? sp.pay_range.trim() : "") as PayRangeValue;
  const upcoming =
    sp.upcoming === "1" || sp.upcoming === "true" || sp.upcoming === "yes";
  const localDateRaw = typeof sp.local_date === "string" ? sp.local_date.trim() : "";
  const sortRaw = typeof sp.sort === "string" ? sp.sort.trim() : "";
  const sort: GigsSortValue =
    GIGS_SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as GigsSortValue) : "newest";
  const pageParam = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 9;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (rawKeyword) params.set("q", rawKeyword);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (radiusMiles) params.set("radius_miles", radiusMiles);
    if (compensation) params.set("compensation", compensation);
    if (payRange) params.set("pay_range", payRange);
    if (sort !== "newest") params.set("sort", sort);
    if (upcoming) params.set("upcoming", "1");
    if (localDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(localDateRaw))
      params.set("local_date", localDateRaw);
    params.set("page", String(targetPage));
    return `/gigs?${params.toString()}`;
  };

  const payBounds = getPayRangeBounds(payRange);
  const dateMin =
    upcoming && (/^\d{4}-\d{2}-\d{2}$/.test(localDateRaw) && localDateRaw
      ? localDateRaw
      : new Date().toISOString().slice(0, 10));

  const useRadiusSearch = Boolean(
    location && radiusMiles && radiusMilesRaw && parseFloat(radiusMilesRaw) > 0
  );

  let gigsList: GigRow[] = [];
  let total = 0;
  let error: { code?: string } | null = null;
  let profileData: SubscriptionAwareProfile | null = null;

  const profilePromise = supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle<SubscriptionAwareProfile>();

  if (useRadiusSearch) {
    const coords = await geocode(location);
    if (coords) {
      const radiusMeters = milesToMeters(parseFloat(radiusMilesRaw));
      const from = (page - 1) * pageSize;
      const [gigsRes, countRes, profileResult] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC added in migration, types not yet regenerated
        (supabase as any).rpc("gigs_within_radius", {
          center_lat: coords.lat,
          center_lng: coords.lng,
          radius_meters: radiusMeters,
          p_category: category || null,
          p_keyword: keyword || null,
          p_pay_min: payBounds?.min ?? null,
          p_pay_max: payBounds?.max ?? null,
          p_date_min: upcoming ? dateMin : null,
          p_limit: pageSize,
          p_offset: from,
          p_sort: sort,
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC added in migration, types not yet regenerated
        (supabase as any).rpc("gigs_within_radius_count", {
          center_lat: coords.lat,
          center_lng: coords.lng,
          radius_meters: radiusMeters,
          p_category: category || null,
          p_keyword: keyword || null,
          p_pay_min: payBounds?.min ?? null,
          p_pay_max: payBounds?.max ?? null,
          p_date_min: upcoming ? dateMin : null,
        }),
        profilePromise,
      ]);
      if (gigsRes.error) {
        error = gigsRes.error;
        logger.error("Radius search error", gigsRes.error);
      } else {
        gigsList = (gigsRes.data ?? []) as GigRow[];
        total =
          countRes.error || typeof countRes.data !== "number"
            ? gigsList.length
            : countRes.data;
      }
      profileData = profileResult?.data ?? null;
    } else {
      const { data } = await profilePromise;
      profileData = data ?? null;
    }
  }

  if (!useRadiusSearch) {
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
  // Use filter set to include legacy categories for backward compatibility
  // getCategoryFilterSet returns [] for empty/null inputs, which we treat as "no filtering"
  const filterSet = getCategoryFilterSet(category);
  if (filterSet.length) {
    query = query.in("category", filterSet);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }
  if (compensation) {
    query = query.ilike("compensation", `%${compensation}%`);
  }
  if (payBounds) {
    if (payBounds.min != null) {
      query = query.gte("compensation_numeric", payBounds.min);
    }
    if (payBounds.max != null) {
      query = query.lte("compensation_numeric", payBounds.max);
    }
  }
  if (upcoming) {
    const today =
      /^\d{4}-\d{2}-\d{2}$/.test(localDateRaw) && localDateRaw
        ? localDateRaw
        : new Date().toISOString().slice(0, 10);
    query = query.gte("date", today);
  }

  // Calculate range for current page
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Apply sort
  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "soonest":
      query = query.order("date", { ascending: true, nullsFirst: false });
      break;
    case "pay_high":
      query = query.order("compensation_numeric", { ascending: false, nullsFirst: false });
      break;
    case "pay_low":
      query = query.order("compensation_numeric", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Build query promise (not executed yet)
  const gigsPromise = query.range(from, to);

  // Fetch profile in parallel (no dependency on gigs query)
  const profilePromise = supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle<SubscriptionAwareProfile>();

  // Execute both queries in parallel to eliminate waterfall
  const [
    { data: gigs, error: queryError, count },
    { data: profileDataFromQuery },
  ] = await Promise.all([gigsPromise, profilePromise]);

  gigsList = queryError?.code === "PGRST103" ? [] : ((gigs || []) as GigRow[]);
  total = typeof count === "number" ? count : gigsList.length;
  error = queryError;
  profileData = profileDataFromQuery ?? null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) {
    redirect(buildPageHref(totalPages));
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  if (error && error.code !== "PGRST103") {
    logger.error("Error fetching gigs", error);
    return (
      <PageShell ambientTone="lifted" containerClassName="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-[var(--oklch-text-primary)] animate-apple-fade-in">
              Find Opportunities
            </h1>
            <p className="text-xl text-[var(--oklch-text-secondary)] max-w-4xl mx-auto leading-relaxed animate-apple-slide-up">
              Browse through available opportunities. Filter by opportunity type, location, and more to find the
              perfect match for your talents.
            </p>
          </div>
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 animate-apple-scale-in">
                <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-12 w-12 text-red-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[var(--oklch-text-primary)] mb-4 animate-apple-fade-in">
                Unable to Load Opportunities
              </h3>
              <p className="text-xl text-[var(--oklch-text-secondary)] mb-8 leading-relaxed animate-apple-slide-up">
                We&apos;re experiencing technical difficulties. Please try again later.
              </p>
              <RetryButton className="apple-button px-8 py-4 text-lg animate-apple-glow">
                Try Again
              </RetryButton>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Extract user role and profile from parallel fetch result
  let userRole: string | null = null;
  let profile: SubscriptionAwareProfile | null = null;
  
  if (profileData) {
    profile = {
      role: profileData.role,
      subscription_status: profileData.subscription_status,
    };
    userRole = profileData.role;
  }

  return (
    <PageShell
      ambientTone="lifted"
      routeRole={userRole === "talent" ? "talent" : userRole === "client" ? "client" : undefined}
      containerClassName="py-10 sm:py-14 md:py-16"
    >
      <div className="max-w-6xl mx-auto">
          {/* Breadcrumb / Back */}
          <div className="mb-5 sm:mb-8 px-2 sm:px-0">
            <div className="sm:hidden">
              {userRole === "talent" ? (
                <Link
                  href="/talent/dashboard"
                  className="focus-hint inline-flex items-center gap-2 text-sm text-[var(--oklch-text-tertiary)] hover:text-white transition-colors min-h-[44px] py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              ) : userRole === "client" ? (
                <Link
                  href="/client/dashboard"
                  className="focus-hint inline-flex items-center gap-2 text-sm text-[var(--oklch-text-tertiary)] hover:text-white transition-colors min-h-[44px] py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
              ) : (
                <Link
                  href="/"
                  className="focus-hint inline-flex items-center gap-2 text-sm text-[var(--oklch-text-tertiary)] hover:text-white transition-colors min-h-[44px] py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Home
                </Link>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Link
                href="/"
                className="focus-hint text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-[var(--oklch-text-muted)]">/</span>
              {userRole === "talent" && (
                <>
                  <Link
                    href="/talent/dashboard"
                    className="focus-hint text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
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
                    className="focus-hint text-[var(--oklch-text-tertiary)] hover:text-white transition-colors flex items-center gap-1 min-h-[44px] py-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <span className="text-[var(--oklch-text-muted)]">/</span>
                </>
              )}
              <span className="text-white font-medium">Find Opportunities</span>
            </div>
          </div>

          <div className="mb-6 sm:mb-10 text-left md:text-center px-4 sm:px-0">
            <div className="panel-frosted w-fit mx-0 md:mx-auto mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3">
              <span className="text-white font-medium text-xs sm:text-sm">Active Opportunities</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gradient-glow tracking-[-0.03em] animate-apple-fade-in">
              Find Opportunities
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--oklch-text-secondary)] max-w-4xl mx-0 md:mx-auto leading-relaxed">
              Browse available opportunities and filter by opportunity type, location, and compensation
              to find the right fit for your next booking.
            </p>
          </div>

          {/* Subscription Prompt for talent users */}
          {shouldShowSubscriptionPrompt(profile) && (
            <div className="max-w-4xl mx-auto mb-10">
              <SubscriptionPrompt profile={profile} variant="banner" context="general" />
            </div>
          )}

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-10 sm:mb-14">
            <div className="panel-frosted grain-texture relative p-4 sm:p-6 md:p-8 shadow-lg">
              <SavedSearchesBar
                currentParams={{
                  q: rawKeyword || undefined,
                  category: category || undefined,
                  location: location || undefined,
                  radius_miles: radiusMiles || undefined,
                  compensation: compensation || undefined,
                  pay_range: payRange || undefined,
                  upcoming: upcoming || undefined,
                  local_date: localDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(localDateRaw) ? localDateRaw : undefined,
                  sort: sort !== "newest" ? sort : undefined,
                }}
              />
              <div className="mt-4 sm:mt-6">
              <GigsFilterForm
                rawKeyword={rawKeyword}
                category={category}
                location={location}
                radiusMiles={radiusMiles}
                compensation={compensation}
                payRange={payRange}
                sort={sort}
                upcoming={upcoming}
              />
              </div>
            </div>
          </div>

          {/* Opportunities Grid */}
          {gigsList.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8 animate-apple-scale-in">
                  <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 animate-apple-fade-in">
                    No Active Opportunities
                  </h3>
                  <p className="mb-8 text-xl leading-relaxed text-[var(--oklch-text-secondary)] animate-apple-slide-up">
                    There are currently no active opportunities available. Check back later for new
                    opportunities!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {gigsList.map((gig) => (
                <GigCard
                  key={gig.id}
                  gig={gig}
                  profile={profile}
                  variant="browse"
                />
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
                  className="min-h-[48px] flex-1 border-border/50 bg-card/25 text-white hover:bg-card/35 sm:flex-none"
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
                  className="min-h-[48px] flex-1 border-border/50 bg-card/25 text-white hover:bg-card/35 sm:flex-none" 
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
    </PageShell>
  );
}
