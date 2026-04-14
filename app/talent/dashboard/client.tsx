"use client";

import {
  Clock,
  MapPin,
  DollarSign,
  Users,
  Briefcase,
  BarChart3,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Activity,
  Eye,
  Filter,
  Search,
  Calendar,
  Target,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { ApplicationDetailsModal } from "@/components/application-details-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { GigCard } from "@/components/gigs/gig-card";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { SafeDate } from "@/components/safe-date";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SafeImage } from "@/components/ui/safe-image";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ensureProfileExists } from "@/lib/actions/auth-actions";
import { getTalentBookings } from "@/lib/actions/booking-actions";
import type { TalentDashboardData } from "@/lib/actions/dashboard-actions";
import { getCategoryLabel } from "@/lib/constants/gig-categories";
import { PATHS } from "@/lib/constants/routes";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
type ClientProfileRow = Database["public"]["Tables"]["client_profiles"]["Row"];

type TalentProfileLite = Pick<TalentProfile, "first_name" | "last_name" | "location">;

// Match ApplicationWithGigAndCompany from dashboard-actions.ts
interface TalentApplication extends ApplicationRow {
  gigs?: (Pick<
    GigRow,
    "id" | "title" | "description" | "category" | "location" | "compensation" | "image_url" | "date" | "client_id"
  > & {
    client_profiles?: Pick<ClientProfileRow, "company_name"> | null;
  }) | null;
}

// Talent booking with real booking data (from getTalentBookings)
interface TalentBooking {
  id: string;
  gig_id: string;
  talent_id: string;
  status: string;
  compensation: number | null;
  notes: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  gigs: (Pick<
    GigRow,
    "id" | "title" | "description" | "category" | "location" | "compensation" | "image_url" | "date" | "client_id"
  > & { client_profiles?: { company_name: string | null } | null }) | null;
  application: { id: string; status: string; message: string | null; created_at: string } | null;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string | null;
  created_at: string;
  application_deadline?: string | null;
  date?: string;
}

function isLocalOrAutomationClient(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes("headlesschrome") || userAgent.includes("electron");
}

function isFailedFetchNoise(
  errorLike: { message?: string | null; details?: string | null } | null | undefined
): boolean {
  if (!errorLike) return false;

  const message = String(errorLike.message ?? "").toLowerCase();
  const details = String(errorLike.details ?? "").toLowerCase();
  const mentionsFailedFetch = message.includes("failed to fetch") || details.includes("failed to fetch");

  return mentionsFailedFetch && isLocalOrAutomationClient();
}

function useTalentDashboardData({
  user,
  profile,
  authLoading,
  initialData,
  disableClientFetch = false,
}: {
  user: ReturnType<typeof useAuth>["user"];
  profile: ReturnType<typeof useAuth>["profile"];
  authLoading: boolean;
  initialData?: TalentDashboardData | null;
  disableClientFetch?: boolean;
}) {
  // Use initial data if provided (server-fetched), otherwise start empty for client-side fetch
  const [talentProfile, setTalentProfile] = useState<TalentProfileLite | null>(
    initialData?.talentProfile ?? null
  );
  const [applications, setApplications] = useState<TalentApplication[]>(
    initialData?.applications ?? []
  );
  const [gigs, setGigs] = useState<Gig[]>(initialData?.gigs ?? []);
  const [bookings, setBookings] = useState<TalentBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!initialData); // Only load if no initial data
  const [dataError, setDataError] = useState<string | null>(null);
  
  // UPGRADE 2: Separate loading/error states for applications (decoupled from dashboard shell)
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  
  const [reloadToken, setReloadToken] = useState(0);

  // HARDENING: Use hook instead of direct call - ensures browser-only execution
  // Hook throws if env vars missing (fail-fast, no zombie state)
  const supabase = useSupabase();

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // When this component is only acting as a Suspense fallback shell, avoid
    // duplicate client-side Supabase queries that race the server loader.
    if (disableClientFetch) return;
    
    // If we have initial data from server, skip client-side fetch (unless refetch triggered)
    if (initialData && reloadToken === 0) {
      setDataLoading(false);
      return;
    }
    
    // HARDENING: Supabase client may be null during pre-mount/SSR
    // After mount, returns non-null client or throws if env vars missing (fail-fast)
    if (!supabase || !user || !profile) return;

    let cancelled = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    setDataLoading(true);
    setDataError(null);

    const load = async () => {
      try {
        // HARDENING: Supabase client is non-nullable - no guard needed
        // If we reach here, client is guaranteed valid (throws on creation if env vars missing)
        const { data: talentProfileData, error: talentProfileError } = await supabase
          .from("talent_profiles")
          .select("first_name,last_name,location")
          .eq("user_id", user.id)
          .maybeSingle<TalentProfileLite>();

        if (!cancelled) {
          if (talentProfileError && talentProfileError.code !== "PGRST116") {
            logger.error("[talent-dashboard] Error fetching talent profile", talentProfileError, {
              code: talentProfileError.code,
              message: talentProfileError.message,
              details: talentProfileError.details,
            });
            setDataError("There was a problem loading your talent profile.");
          }
          setTalentProfile(talentProfileData ?? null);
        }

        const resolvedRole = profile.role;
        const resolvedAccountType = profile.account_type;
        const isTalentFromProfile =
          resolvedRole === "talent" || resolvedAccountType === "talent";
        const isTalentUser =
          profile != null ? isTalentFromProfile : user.user_metadata?.role === "talent";

        if (!talentProfileData && isTalentUser && !cancelled) {
          // Client components must not write to the DB. Ensure setup via server action.
          await ensureProfileExists();

          // HARDENING: Supabase client is non-nullable - no guard needed
          const { data: newTalentProfile, error: refetchTalentError } = await supabase
            .from("talent_profiles")
            .select("first_name,last_name,location")
            .eq("user_id", user.id)
            .maybeSingle<TalentProfileLite>();

          if (!cancelled) {
            if (refetchTalentError) {
              logger.error("[talent-dashboard] Error refetching talent profile after ensureProfileExists", refetchTalentError, {
                code: refetchTalentError.code,
                message: refetchTalentError.message,
              });
            }
            setTalentProfile(newTalentProfile ?? null);
          }
        }

        // UPGRADE 2: Applications query runs independently - doesn't break dashboard shell
        // HARDENING: Supabase client is non-nullable - no guard needed
        // CRITICAL: Wrap in try-finally to ensure loading state always clears
        // This prevents infinite loading spinner if query fails or throws
        try {
          // UPGRADE 3: Capture session/auth context before query
          let sessionContext: {
            hasSession: boolean;
            userId: string | null;
            userEmail: string | null;
            sessionExpiry: number | null;
          } | null = null;
          
          try {
            const { data: { user: sessionUser } } = await supabase.auth.getUser();
            sessionContext = {
              hasSession: !!sessionUser,
              userId: sessionUser?.id ?? null,
              userEmail: sessionUser?.email ?? null,
              sessionExpiry: null,
            };
          } catch (sessionError) {
            logger.warn("[talent-dashboard] Failed to get session context", { sessionError });
          }

            setApplicationsLoading(true);
            setApplicationsError(null);

            const {
              data: applicationsData,
              error: applicationsError,
            } = await supabase
              .from("applications")
              .select(
                "id,status,created_at,updated_at,message,gigs(id,title,description,category,location,compensation,image_url,date,client_id)"
              )
              .eq("talent_id", user.id)
              .order("created_at", { ascending: false });

            let applicationsWithCompany = (applicationsData ?? []) as TalentApplication[];
            let companyMergeStatus: "skipped" | "none" | "merged" | "failed" = "skipped";
            let clientIdsCount = 0;
            const applicationsCount = applicationsWithCompany.length;

            if (!applicationsError) {
              const clientIds = Array.from(
                new Set(
                  applicationsWithCompany
                    .map((app) => app.gigs?.client_id)
                    .filter((clientId): clientId is string => !!clientId)
                )
              );
              clientIdsCount = clientIds.length;

              if (clientIds.length > 0) {
                const { data: clientProfilesData, error: clientProfilesError } = await supabase
                  .from("client_profiles")
                  .select("user_id,company_name")
                  .in("user_id", clientIds);

                if (clientProfilesError) {
                  companyMergeStatus = "failed";
                  logger.error("[talent-dashboard] Error fetching client profiles for applications", clientProfilesError, {
                    code: clientProfilesError.code,
                    message: clientProfilesError.message,
                    details: clientProfilesError.details,
                  });
                } else {
                  companyMergeStatus = "merged";
                  const companyByClientId = new Map(
                    (clientProfilesData ?? []).map((profile) => [profile.user_id, profile.company_name])
                  );

                  applicationsWithCompany = applicationsWithCompany.map((app) => {
                    const clientId = app.gigs?.client_id ?? null;
                    const companyName = clientId ? companyByClientId.get(clientId) ?? null : null;

                    return {
                      ...app,
                      gigs: app.gigs
                        ? {
                            ...app.gigs,
                            client_profiles: companyName ? { company_name: companyName } : null,
                          }
                        : null,
                    };
                  });
                }
              } else {
                companyMergeStatus = "none";
              }
            }

            if (!cancelled) {
              if (applicationsError) {
                // UPGRADE 3: Enhanced error logging with full session/auth context
                const errorContext = {
                  code: applicationsError.code,
                  message: applicationsError.message,
                  details: applicationsError.details,
                  hint: applicationsError.hint,
                  hasSupabaseClient: !!supabase,
                  sessionContext,
                  companyMergeStatus,
                  clientIdsCount,
                  applicationsCount,
                  queryVersion: "v2",
                  hasInvalidEmbed: false,
                  requestHeaders: {
                    hasApikey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
                    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : "missing",
                  },
                };

                const shouldSuppressLocalFailedFetch = isFailedFetchNoise(applicationsError);

                if (shouldSuppressLocalFailedFetch) {
                  logger.info("[talent-dashboard] Suppressing local failed-fetch applications noise", errorContext);
                } else {
                  logger.error("[talent-dashboard] Error fetching applications", undefined, errorContext);
                }

                // Send to Sentry for production debugging
                if (!shouldSuppressLocalFailedFetch) {
                  try {
                    const Sentry = await import("@sentry/nextjs");
                    Sentry.addBreadcrumb({
                      category: "talent-dashboard",
                      message: "applications company name merge",
                      level: "info",
                      data: {
                        companyMergeStatus,
                        clientIdsCount,
                        applicationsCount,
                        queryVersion: "v2",
                        hasInvalidEmbed: false,
                      },
                    });
                    Sentry.captureException(
                      new Error(applicationsError.message || "[talent-dashboard] Error fetching applications"),
                      {
                        tags: {
                          feature: "talent-dashboard",
                          error_type: "applications_query_error",
                          error_code: applicationsError.code || "UNKNOWN",
                          supabase_env_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                          has_session: sessionContext?.hasSession ? "true" : "false",
                          talent_dashboard_query_version: "v2",
                          company_name_merge: companyMergeStatus,
                          has_invalid_embed: "false",
                        },
                        extra: {
                          ...errorContext,
                          userId: user.id,
                          userEmail: user.email,
                        },
                        level: "error",
                      }
                    );
                  } catch {
                    // Sentry not available, skip
                  }
                }

                // Check for missing API key error specifically
                if (applicationsError.message?.includes("No API key found") || applicationsError.message?.includes("apikey")) {
                  setApplicationsError(
                    "Configuration error: Database connection failed. " +
                    "Please refresh the page. If the problem persists, contact support."
                  );
                } else {
                  setApplicationsError("There was a problem loading your applications.");
                }
              } else {
                  setApplications(applicationsWithCompany ?? []);
                setApplicationsError(null);
              }
            }
          } catch (err) {
            // Catch any unexpected errors
            if (!cancelled) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              logger.error("[talent-dashboard] Unexpected error in applications query", err, {
                message: errorMessage,
              });
              setApplicationsError("Failed to load applications. Please refresh the page.");
            }
          } finally {
            // CRITICAL: Always clear loading state, even on error or cancellation
            if (!cancelled) {
              setApplicationsLoading(false);
            }
          }

        // HARDENING: Supabase client is non-nullable - no guard needed
        const {
          data: gigsData,
          error: gigsError,
        } = await supabase
          .from("gigs")
          .select(
            "id,title,description,location,compensation,category,status,image_url,created_at,application_deadline,date"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!cancelled) {
          if (gigsError) {
            logger.error("[talent-dashboard] Error fetching gigs", gigsError, {
              code: gigsError.code,
              message: gigsError.message,
              details: gigsError.details,
            });
            setDataError((prev) => prev ?? "There was a problem loading opportunities.");
          } else {
            setGigs((gigsData as Gig[]) ?? []);
          }
        }

        // Fetch real booking data (date, compensation, notes) for talent
        if (!cancelled) {
          setBookingsLoading(true);
          try {
            const bookingsResult = await getTalentBookings();
            if (!cancelled && bookingsResult.success && bookingsResult.bookings) {
              setBookings(bookingsResult.bookings);
            }
          } catch (bookingsErr) {
            if (!cancelled) {
              logger.error("[talent-dashboard] Error fetching bookings", bookingsErr);
            }
          } finally {
            if (!cancelled) setBookingsLoading(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error("[talent-dashboard] Unexpected error fetching dashboard data", err, {
            message: errorMessage,
            stack: err instanceof Error ? err.stack : undefined,
          });

          // Send to Sentry
          try {
            const Sentry = await import("@sentry/nextjs");
            Sentry.captureException(err instanceof Error ? err : new Error(errorMessage), {
              tags: {
                feature: "talent-dashboard",
                error_type: "unexpected_error",
                supabase_env_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              },
              extra: {
                message: errorMessage,
                userId: user?.id,
              },
              level: "error",
            });
          } catch {
            // Sentry not available, skip
          }

          setDataError("Failed to load dashboard data. Please try refreshing the page.");
        }
      } finally {
        // CRITICAL: Always set loading to false, even on error
        // This prevents infinite spinner if query fails
        if (!cancelled) {
          if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
          }
          setDataLoading(false);
        }
      }
    };

    // Stability: avoid an infinite loading spinner if a network call hangs.
    // If we hit this, we surface an error and let the user refresh (or sign out).
    watchdog = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      logger.error("[talent-dashboard] data load timed out");
      setDataError("Loading is taking longer than expected. Please refresh the page.");
      setDataLoading(false);
    }, 20_000);

    load();

    return () => {
      cancelled = true;
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
    };
    // HARDENING: Include 'supabase' in deps to handle null → non-null transition
    // - supabase: useSupabase() returns null initially, then non-null after mount
    // - Effect must re-run when supabase becomes available to prevent infinite loading
    // - user/profile: using specific fields (user?.id, profile?.role) instead of full objects
    // This prevents accidental re-fetch storms from object reference changes while ensuring
    // data loads when supabase client initializes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    supabase,
    user?.id,
    profile?.role,
    profile?.account_type,
    reloadToken,
    initialData,
    disableClientFetch,
  ]);

  return {
    talentProfile,
    applications,
    gigs,
    bookings,
    bookingsLoading,
    dataLoading,
    dataError,
    // UPGRADE 2: Expose separate applications loading/error states
    applicationsLoading,
    applicationsError,
    refetch,
  };
}

function TalentDashboardContent({
  initialData,
  disableClientFetch = false,
}: {
  initialData?: TalentDashboardData | null;
  disableClientFetch?: boolean;
}) {
  const router = useRouter();
  const { user, signOut, profile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const {
    talentProfile,
    applications,
    gigs,
    bookings,
    bookingsLoading,
    dataLoading,
    dataError,
    applicationsLoading,
    applicationsError,
    refetch,
  } = useTalentDashboardData({ user, profile, authLoading, initialData, disableClientFetch });

  const subscriptionProfile =
    profile && profile.role === "talent"
      ? {
          role: "talent" as const,
          subscription_status: profile.subscription_status ?? "none",
        }
      : null;
  const showSubscriptionBanner =
    subscriptionProfile && subscriptionProfile.subscription_status !== "active";

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedTalentApplication, setSelectedTalentApplication] = useState<TalentApplication | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<TalentBooking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasHandledVerificationRef = useRef<boolean>(false);
  const isInVerificationGracePeriodRef = useRef<boolean>(false);
  const urlCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const verifiedParam = searchParams?.get("verified");

    if (verifiedParam !== "true" || hasHandledVerificationRef.current) {
      return;
    }

    hasHandledVerificationRef.current = true;
    isInVerificationGracePeriodRef.current = true;
    router.refresh();

    if (urlCleanupTimeoutRef.current) {
      clearTimeout(urlCleanupTimeoutRef.current);
      urlCleanupTimeoutRef.current = null;
    }

    urlCleanupTimeoutRef.current = setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        router.replace(`${url.pathname}${url.search}`);
      } finally {
        isInVerificationGracePeriodRef.current = false;
        urlCleanupTimeoutRef.current = null;
      }
    }, 2000);

    return () => {
      if (urlCleanupTimeoutRef.current) {
        clearTimeout(urlCleanupTimeoutRef.current);
        urlCleanupTimeoutRef.current = null;
      }

      try {
        const currentUrl = new URL(window.location.href);
        const currentVerifiedParam = currentUrl.searchParams.get("verified");
        if (hasHandledVerificationRef.current && currentVerifiedParam !== "true") {
          isInVerificationGracePeriodRef.current = false;
        }
      } catch (error) {
        logger.error("Error reading URL in cleanup", error);
      }
    };
  }, [searchParams, router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isInVerificationGracePeriodRef.current) {
      return;
    }

    if (!user) {
      router.replace(
        `${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.TALENT_DASHBOARD)}`
      );
      return;
    }
  }, [user, authLoading, router]);

  const dashboardStats = {
    totalApplications: applications.length,
    newApplications: applications.filter(
      (app) => app.status === "new" || app.status === "under_review"
    ).length,
    acceptedTalentApplications:
      bookings.length > 0
        ? bookings.filter((b) => b.status !== "cancelled").length
        : applications.filter((app) => app.status === "accepted").length,
    activeGigs: gigs.filter((gig) => gig.status === "active").length,
    totalGigs: gigs.length,
  };

  const needsProfileCompletion =
    !talentProfile?.first_name || !talentProfile?.last_name || !talentProfile?.location;

  // Data fetching handled by useTalentDashboardData hook above

  useEffect(() => {
    const applied = searchParams?.get("applied");
    if (applied === "success") {
      toast({
        title: "TalentApplication Submitted Successfully! 🎉",
        description:
          "Your application has been sent to the client. You'll be notified when they respond.",
        duration: 5000,
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("applied");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast]);

  const handleViewDetails = (application: TalentApplication) => {
    setSelectedTalentApplication(application);
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleViewBookingDetails = (booking: TalentBooking) => {
    if (!booking.application || !booking.gigs) return;
    setSelectedTalentApplication({
      id: booking.application.id,
      status: booking.application.status as TalentApplication["status"],
      message: booking.application.message,
      created_at: booking.application.created_at,
      updated_at: booking.application.created_at,
      gig_id: booking.gig_id,
      talent_id: booking.talent_id,
      gigs: booking.gigs as TalentApplication["gigs"],
    });
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTalentApplication(null);
    setSelectedBooking(null);
  };

  const categoryBadgeClassName =
    "border-[var(--oklch-border-alpha)] bg-white/[0.06] text-[var(--oklch-text-secondary)]";

  useEffect(() => {
    return () => {
      if (urlCleanupTimeoutRef.current) {
        clearTimeout(urlCleanupTimeoutRef.current);
      }
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      // AuthProvider's signOut() owns redirect - trust it
      await signOut();
    } catch (error) {
      logger.error("Sign out error", error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
    }
  };

  const handleRetrySetup = async () => {
    try {
      await ensureProfileExists();
      refetch();
      router.refresh();
    } catch (retryError) {
      logger.error("Retry setup error", retryError);
    }
  };

  // HARDENING: Supabase client is non-nullable - if env vars missing, component crashes on mount
  // No fatalError check needed - component won't render if client creation fails
  if (authLoading || dataLoading || isInVerificationGracePeriodRef.current) {
    return (
      <PageShell
        ambientTone="lifted"
        className="grain-texture glow-backplate text-[var(--oklch-text-primary)]"
        containerClassName="flex min-h-[70vh] items-center justify-center py-8"
      >
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-white/70" />
          <p className="mt-4 text-[var(--oklch-text-secondary)]">Loading your dashboard...</p>
          {dataError && (
            <div className="mx-auto mt-4 max-w-md">
              <p className="text-sm text-red-400">{dataError}</p>
              <Button
                onClick={() => {
                  refetch();
                  router.refresh();
                }}
                className="mt-2"
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (user && !profile) {
    return (
      <PageShell
        ambientTone="lifted"
        className="grain-texture glow-backplate text-[var(--oklch-text-primary)]"
        containerClassName="flex min-h-[70vh] items-center justify-center py-8"
      >
        <SectionCard className="mx-auto w-full max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" aria-hidden />
          <h2 className="mb-2 text-xl font-semibold text-[var(--oklch-text-primary)]">Finishing your setup</h2>
          <p className="mb-4 text-[var(--oklch-text-secondary)]">
            We’re creating your profile. This usually takes a moment.
          </p>
          <Button onClick={handleRetrySetup} variant="outline">
            Retry setup
          </Button>
        </SectionCard>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell
        ambientTone="lifted"
        className="grain-texture glow-backplate text-[var(--oklch-text-primary)]"
        containerClassName="flex min-h-[70vh] items-center justify-center py-8"
      >
        <SectionCard className="mx-auto w-full max-w-md text-center">
          <User className="mx-auto mb-6 h-16 w-16 text-[var(--oklch-text-secondary)]" aria-hidden />
          <h2 className="mb-3 text-2xl font-bold text-[var(--oklch-text-primary)]">Welcome back</h2>
          <p className="mb-6 text-lg text-[var(--oklch-text-secondary)]">
            You need to be logged in to access your talent dashboard.
          </p>
          <Button asChild className="w-full button-glow sm:w-auto">
            <Link href={PATHS.LOGIN}>Sign in to continue</Link>
          </Button>

          <div className="mt-6 border-t border-[var(--oklch-border-alpha)] pt-6">
            <p className="mb-3 text-sm text-[var(--oklch-text-tertiary)]">New to TOTL?</p>
            <Link
              href={PATHS.CHOOSE_ROLE}
              className="focus-hint text-sm font-medium text-[var(--oklch-text-primary)] underline-offset-4 hover:underline"
            >
              Create an account →
            </Link>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell ambientTone="lifted" topPadding={false} fullBleed>
      <div className="panel-frosted sticky top-0 z-40 border-b border-border/40">
        <div className="container mx-auto px-4 py-2 sm:py-3">
          <div className="flex min-h-12 items-center justify-between gap-2 md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={profile?.avatar_url || "/images/totl-logo-transparent.png"}
                  alt="Profile"
                />
                <AvatarFallback>
                  {talentProfile?.first_name?.[0]}
                  {talentProfile?.last_name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">Talent Dashboard</p>
                <p className="truncate text-xs text-[var(--oklch-text-secondary)]">
                  {talentProfile?.first_name ? `Welcome back, ${talentProfile.first_name}` : "Ready to discover opportunities"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationDropdown
                viewAllHref="/talent/dashboard"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-white/10"
              />
              <Button size="sm" variant="default" className="rounded-full font-semibold" asChild>
                <Link href="/gigs">Browse opportunities</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={profile?.avatar_url || "/images/totl-logo-transparent.png"}
                  alt="Profile"
                />
                <AvatarFallback>
                  {talentProfile?.first_name?.[0]}
                  {talentProfile?.last_name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {talentProfile?.first_name || "Talent"}!
                </h1>
                <p className="text-[var(--oklch-text-secondary)]">Ready to discover your next opportunity?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown
                viewAllHref="/talent/dashboard"
                variant="outline"
                size="sm"
                className="border-white/15 text-[var(--oklch-text-primary)] hover:bg-white/10"
                showLabel
              />
              <Button size="sm" variant="default" className="rounded-full font-semibold" asChild>
                <Link href="/gigs" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Browse opportunities
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-white/15 text-[var(--oklch-text-primary)] hover:bg-white/10"
              >
                <Link href="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="border-white/15 text-[var(--oklch-text-primary)] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <PageHeader
          title="Overview"
          subtitle="Track applications and find your next booking."
          className="mb-4 hidden md:block"
        />
        {showSubscriptionBanner && (
          <SubscriptionPrompt profile={subscriptionProfile} variant="banner" context="general" />
        )}
        {needsProfileCompletion && (
          <div className="panel-frosted mb-4 flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[var(--oklch-text-primary)]">Finish your profile to get better-matched opportunities.</span>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full border-amber-500/40 font-semibold" asChild>
              <Link href="/settings">Finish profile →</Link>
            </Button>
          </div>
        )}

        <div className="mb-4 md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Applications", value: dashboardStats.totalApplications, icon: Users },
              { label: "Accepted", value: dashboardStats.acceptedTalentApplications, icon: Calendar },
              { label: "Active opportunities", value: dashboardStats.activeGigs, icon: Briefcase },
              { label: "New", value: dashboardStats.newApplications, icon: Clock },
            ]}
          />
        </div>

        <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          <Card className="grain-texture flex h-full min-w-0 flex-col transition-shadow hover:shadow-md">
            <CardContent className="flex flex-1 flex-col p-4">
              <div className="flex-1 space-y-3">
                <div className="card-header-row">
                  <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                    <Users className="h-4 w-4 text-green-400" />
                    <span>Total Applications</span>
                  </div>
                  <Badge variant="outline" className="status-chip">
                    All time
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">{dashboardStats.totalApplications}</div>
              </div>
              {/* Primary CTA lives in header + Opportunities card */}
            </CardContent>
          </Card>

          <Card className="grain-texture flex h-full min-w-0 flex-col transition-shadow hover:shadow-md">
            <CardContent className="flex flex-1 flex-col p-4">
              <div className="flex-1 space-y-3">
                <div className="card-header-row">
                  <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span>Accepted</span>
                  </div>
                  <Badge variant="outline" className="status-chip">
                    Active
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">{dashboardStats.acceptedTalentApplications}</div>
              </div>
              {/* Primary CTA lives in header + Opportunities card */}
            </CardContent>
          </Card>

          <Card className="grain-texture flex h-full min-w-0 flex-col transition-shadow hover:shadow-md">
            <CardContent className="flex flex-1 flex-col p-4">
              <div className="flex-1 space-y-3">
                <div className="card-header-row">
                  <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span>Earnings</span>
                  </div>
                  <Badge variant="outline" className="status-chip">
                    To date
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">$0</div>
              </div>
              {/* Primary CTA lives in header + Opportunities card */}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <MobileTabRail>
            <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl p-1">
              <TabsTrigger
                value="overview"
                className="min-h-10 whitespace-nowrap px-3 py-2 text-xs"
              >
                <Activity className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="applications"
                className="min-h-10 whitespace-nowrap px-3 py-2 text-xs"
              >
                <Target className="h-3.5 w-3.5" />
                Applications
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="min-h-10 whitespace-nowrap px-3 py-2 text-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                Bookings
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="min-h-10 whitespace-nowrap px-3 py-2 text-xs"
              >
                <Search className="h-3.5 w-3.5" />
                Discover
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="hidden w-full grid-cols-4 md:grid lg:w-auto lg:grid-cols-4">
            <TabsTrigger
              value="overview"
              className="flex min-h-10 items-center gap-2 px-3 py-2"
            >
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex min-h-10 items-center gap-2 px-3 py-2"
            >
              <Target className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex min-h-10 items-center gap-2 px-3 py-2"
            >
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="discover"
              className="flex min-h-10 items-center gap-2 px-3 py-2"
            >
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary CTA: Browse Opportunities first */}
              <Card className="grain-texture lg:col-span-1">
                <CardHeader>
                  <div className="card-header-row">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Briefcase className="h-5 w-5 text-green-400" />
                      Available Opportunities
                    </CardTitle>
                    <Badge variant="outline" className="status-chip">
                      Live
                    </Badge>
                  </div>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">
                    Discover new opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{gigs.length}</div>
                    <p className="text-sm text-white">Active opportunities available</p>
                  </div>
                  <Button variant="default" className="w-full rounded-full font-semibold" asChild>
                    <Link href="/gigs" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Browse all opportunities
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="grain-texture lg:col-span-1">
                <CardHeader>
                  <div className="card-header-row">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                      Quick Stats
                    </CardTitle>
                    <Badge variant="outline" className="status-chip">
                      Snapshot
                    </Badge>
                  </div>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">Your activity summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {dashboardStats.totalApplications}
                      </div>
                      <p className="text-xs text-white">Total Applications</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {dashboardStats.acceptedTalentApplications}
                      </div>
                      <p className="text-xs text-white">Accepted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="grain-texture lg:col-span-2">
              <CardHeader>
                <div className="card-header-row">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5 text-purple-400" />
                    Upcoming Opportunities
                  </CardTitle>
                  <Badge variant="outline" className="status-chip">
                    Confirmed
                  </Badge>
                </div>
                <CardDescription className="text-[var(--oklch-text-secondary)]">
                  Your confirmed and pending bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.filter((app) => app.status === "accepted").length > 0 ? (
                  <>
                    <div className="md:hidden space-y-3">
                      {applications
                        .filter((app) => app.status === "accepted")
                        .map((app) => (
                          <div
                            key={`${app.id}-upcoming-mobile`}
                            className="panel-frosted rounded-xl p-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                                <SafeImage
                                  src={app.gigs?.image_url}
                                  alt={app.gigs?.title || "Unknown Opportunity"}
                                  fallbackSrc="/images/totl-logo-transparent.png"
                                  fill
                                  className="object-cover"
                                  placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-white truncate">
                                  {app.gigs?.title}
                                </p>
                                <p className="text-xs text-[var(--oklch-text-secondary)]">
                                  {app.gigs?.client_profiles?.company_name || "Private Client"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[var(--oklch-text-tertiary)]">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <SafeDate date={app.created_at} />
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {app.gigs?.location}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <ApplicationStatusBadge status={app.status} showIcon={false} />
                                <Button variant="ghost" size="icon" className="text-[var(--oklch-text-muted)]">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="card-footer-row">
                              <span>Next action</span>
                              <button type="button" className="text-[var(--oklch-text-primary)] hover:underline">
                                View details
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="hidden md:block space-y-4">
                      {applications
                        .filter((app) => app.status === "accepted")
                        .map((app) => (
                          <div
                            key={app.id}
                            className="flex flex-col gap-4 rounded-lg border border-border/40 p-4 transition-shadow hover:shadow-md md:flex-row"
                          >
                            <div className="w-full md:w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                              <SafeImage
                                src={app.gigs?.image_url}
                                alt={app.gigs?.title || "Unknown Opportunity"}
                                fallbackSrc="/images/totl-logo-transparent.png"
                                fill
                                className="object-cover"
                                placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                              />
                            </div>
                            <div className="flex-grow space-y-2">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <h4 className="font-semibold text-lg text-white">
                                  {app.gigs?.title}
                                </h4>
                                <ApplicationStatusBadge status={app.status} showIcon={true} />
                              </div>
                              <p className="text-[var(--oklch-text-secondary)] font-medium">
                                {app.gigs?.client_profiles?.company_name || "Private Client"}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--oklch-text-secondary)]">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <SafeDate date={app.created_at} />
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {app.gigs?.compensation || "TBD"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {app.gigs?.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {app.gigs?.compensation || "TBD"}
                                </div>
                              </div>
                            </div>
                            <div className="flex md:flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 md:flex-none bg-transparent"
                              >
                                View Details
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-[var(--oklch-text-tertiary)]" />
                    <p className="mb-4 text-[var(--oklch-text-secondary)]">You don&apos;t have any upcoming opportunities.</p>
                    <Button variant="default" className="rounded-full font-semibold" asChild>
                      <Link href="/gigs">Browse opportunities</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card className="grain-texture">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="card-header-row">
                      <CardTitle className="text-[var(--oklch-text-primary)]">My Applications</CardTitle>
                      <Badge variant="outline" className="status-chip">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="text-[var(--oklch-text-secondary)]">
                      Track all your opportunity applications and their status
                    </CardDescription>
                  </div>
                  <div className="hidden gap-2 sm:flex">
                    <Button type="button" variant="outline" size="sm" disabled className="border-white/15 opacity-60">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled className="border-white/15 opacity-60">
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* UPGRADE 2: Show applications-specific loading/error states (dashboard shell stays alive) */}
                {applicationsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-[var(--oklch-text-secondary)]">Loading your applications...</p>
                  </div>
                ) : applicationsError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Error Loading Applications"
                    description={applicationsError}
                    action={{
                      label: "Try Again",
                      onClick: () => {
                        refetch();
                      },
                    }}
                  />
                ) : applications.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="No Applications Yet"
                    description="You haven't applied to any opportunities yet. Browse available opportunities to get started!"
                    action={{
                      label: "Browse Opportunities",
                      onClick: () => {
                        router.push("/gigs");
                      },
                    }}
                  />
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {applications.map((app) => (
                        <div
                          key={`${app.id}-mobile`}
                          className="panel-frosted rounded-xl p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                              <SafeImage
                                src={app.gigs?.image_url}
                                alt={app.gigs?.title || "Unknown Opportunity"}
                                fallbackSrc="/images/totl-logo-transparent.png"
                                fill
                                className="object-cover"
                                placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                              />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-white truncate">
                                {app.gigs?.title}
                              </p>
                              <p className="text-xs text-[var(--oklch-text-secondary)]">
                                {app.gigs?.client_profiles?.company_name || "Private Client"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[var(--oklch-text-tertiary)]">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {app.gigs?.compensation || "TBD"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <SafeDate date={app.created_at} />
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <ApplicationStatusBadge status={app.status} showIcon={false} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[var(--oklch-text-muted)] hover:bg-white/10"
                                onClick={() => handleViewDetails(app)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="card-footer-row">
                            <span>Next action</span>
                            <button
                              type="button"
                              className="text-[var(--oklch-text-primary)] hover:underline"
                              onClick={() => handleViewDetails(app)}
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block space-y-4">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="panel-frosted flex flex-col gap-4 rounded-lg border border-border/40 p-4 transition-shadow hover:shadow-md md:flex-row"
                        >
                          <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={app.gigs?.image_url}
                              alt={app.gigs?.title || "Unknown Opportunity"}
                              fallbackSrc="/images/totl-logo-transparent.png"
                              fill
                              className="object-cover"
                              placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                            />
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-semibold text-lg text-white">{app.gigs?.title}</h4>
                              <ApplicationStatusBadge status={app.status} showIcon={true} />
                            </div>
                            <p className="text-[var(--oklch-text-secondary)] font-medium">
                              {app.gigs?.client_profiles?.company_name || "Private Client"}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-[var(--oklch-text-tertiary)]">
                              <Badge variant="outline" className={categoryBadgeClassName}>
                                {getCategoryLabel(app.gigs?.category || "")}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {app.gigs?.compensation || "TBD"}
                              </span>
                              <span>
                                Applied: <SafeDate date={app.created_at} />
                              </span>
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-white/15 bg-transparent md:flex-none hover:bg-white/10"
                              onClick={() => handleViewDetails(app)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--oklch-text-muted)] hover:bg-white/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card className="grain-texture">
              <CardHeader>
                <div className="card-header-row">
                  <CardTitle className="text-[var(--oklch-text-primary)]">My Bookings</CardTitle>
                  <Badge variant="outline" className="status-chip">
                    Upcoming
                  </Badge>
                </div>
                <CardDescription className="text-[var(--oklch-text-secondary)]">
                  Your confirmed and upcoming opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/70" />
                  </div>
                ) : bookings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No bookings yet"
                    description="When a client accepts your application, the booking will show here with date and details."
                    action={{
                      label: "Browse opportunities",
                      onClick: () => {
                        router.push("/gigs");
                      },
                    }}
                  />
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {bookings.map((booking) => (
                        <div
                          key={`${booking.id}-bookings-mobile`}
                          className="panel-frosted rounded-xl p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 relative rounded-lg overflow-hidden flex-shrink-0">
                              <SafeImage
                                src={booking.gigs?.image_url}
                                alt={booking.gigs?.title || "Unknown Opportunity"}
                                fallbackSrc="/images/totl-logo-transparent.png"
                                fill
                                className="object-cover"
                                placeholderQuery={booking.gigs?.category?.toLowerCase() || "general"}
                              />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-semibold text-white truncate">
                                {booking.gigs?.title}
                              </p>
                              <p className="text-xs text-[var(--oklch-text-secondary)]">
                                {booking.gigs?.client_profiles?.company_name || "Private Client"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[var(--oklch-text-tertiary)]">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <SafeDate date={booking.date} format="datetime" />
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {booking.compensation != null
                                    ? `$${Number(booking.compensation).toLocaleString()}`
                                    : booking.gigs?.compensation || "TBD"}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <ApplicationStatusBadge status="accepted" showIcon={false} />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[var(--oklch-text-muted)] hover:bg-white/10"
                                onClick={() => handleViewBookingDetails(booking)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="card-footer-row">
                            <span>Next action</span>
                            <button
                              type="button"
                              className="text-[var(--oklch-text-primary)] hover:underline"
                              onClick={() => handleViewBookingDetails(booking)}
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-4 rounded-lg border border-border/40 p-4 transition-shadow hover:shadow-md md:flex-row"
                        >
                          <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={booking.gigs?.image_url}
                              alt={booking.gigs?.title || "Unknown Opportunity"}
                              fallbackSrc="/images/totl-logo-transparent.png"
                              fill
                              className="object-cover"
                              placeholderQuery={booking.gigs?.category?.toLowerCase() || "general"}
                            />
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-semibold text-lg text-white">
                                {booking.gigs?.title}
                              </h4>
                              <ApplicationStatusBadge status="accepted" showIcon={true} />
                            </div>
                            <p className="text-[var(--oklch-text-secondary)] font-medium">
                              {booking.gigs?.client_profiles?.company_name || "Private Client"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--oklch-text-secondary)]">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <SafeDate date={booking.date} format="datetime" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {booking.compensation != null
                                  ? `$${Number(booking.compensation).toLocaleString()}`
                                  : booking.gigs?.compensation || "TBD"}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {booking.gigs?.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {booking.compensation != null
                                  ? `$${Number(booking.compensation).toLocaleString()}`
                                  : booking.gigs?.compensation || "TBD"}
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 md:flex-none bg-transparent"
                              onClick={() => handleViewBookingDetails(booking)}
                            >
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <Card className="grain-texture">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="card-header-row">
                      <CardTitle className="text-[var(--oklch-text-primary)]">Available Opportunities</CardTitle>
                      <Badge variant="outline" className="status-chip">
                        Live
                      </Badge>
                    </div>
                    <CardDescription className="text-[var(--oklch-text-secondary)]">
                      Discover new opportunities that match your profile
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled className="opacity-60">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled className="opacity-60">
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                    <Button variant="default" size="sm" className="rounded-full font-semibold" asChild>
                      <Link href="/gigs">
                        <Eye className="mr-2 h-4 w-4" />
                        View all opportunities
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-[var(--oklch-text-secondary)]">Loading available opportunities...</p>
                  </div>
                ) : dataError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Error Loading Opportunities"
                    description={dataError}
                    action={{
                      label: "Try Again",
                      onClick: () => {
                        refetch();
                      },
                    }}
                  />
                ) : gigs.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="No opportunities right now"
                    description={"There aren't any active listings at the moment. Check back soon or refresh."}
                    action={{
                      label: "Refresh",
                      onClick: () => {
                        refetch();
                      },
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs.map((gig) => (
                      <GigCard
                        key={gig.id}
                        gig={gig}
                        variant="dashboard"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile spacer so the sticky bottom CTA doesn’t cover content */}
        <div className="h-16 md:hidden" />
      </div>

      {/* Mobile sticky primary CTA */}
      <div className="panel-frosted md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40">
        <div className="container mx-auto px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Button variant="default" className="w-full rounded-full font-semibold" asChild>
            <Link href="/gigs">Browse opportunities</Link>
          </Button>
        </div>
      </div>

      <ApplicationDetailsModal
        application={selectedTalentApplication}
        isOpen={isModalOpen}
        onClose={closeModal}
        booking={
          selectedBooking
            ? {
                date: selectedBooking.date,
                compensation: selectedBooking.compensation,
                notes: selectedBooking.notes,
              }
            : null
        }
      />
    </PageShell>
  );
}

export function DashboardClient({
  initialData,
  disableClientFetch = false,
}: {
  initialData?: TalentDashboardData | null;
  disableClientFetch?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <PageShell className="grain-texture glow-backplate text-white" containerClassName="flex min-h-[70vh] items-center justify-center py-8">
          <p className="text-xl text-[var(--oklch-text-primary)]">Loading...</p>
        </PageShell>
      }
    >
      <TalentDashboardContent initialData={initialData} disableClientFetch={disableClientFetch} />
    </Suspense>
  );
}

export default DashboardClient;

