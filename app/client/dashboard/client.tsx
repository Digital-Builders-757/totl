"use client";

import {
  DollarSign,
  Users,
  CheckCircle,
  Clock as ClockIcon,
  Briefcase,
  BarChart3,
  Plus,
  User,
  Bell,
  LogOut,
  Activity,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import type { DashboardApplication, DashboardGig } from "@/app/client/dashboard/types";
import { useAuth } from "@/components/auth/auth-provider";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { ClientDashboardSkeleton } from "@/components/dashboard/client-dashboard-skeleton";
import { ClientStatCard } from "@/components/dashboard/client-stat-card";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { PageShell } from "@/components/layout/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientDashboardData } from "@/lib/actions/dashboard-actions";
import { logEmptyState, logFallbackUsage } from "@/lib/utils/error-logger";

const OverviewTabContent = dynamic(() => import("./tabs/overview-tab-content"), { ssr: false });
const GigsTabContent = dynamic(() => import("./tabs/gigs-tab-content"), { ssr: false });
const ApplicationsTabContent = dynamic(() => import("./tabs/applications-tab-content"), {
  ssr: false,
});
const CreateTabContent = dynamic(() => import("./tabs/create-tab-content"), { ssr: false });

interface ClientDashboardProps {
  initialData: ClientDashboardData | null;
}

export function ClientDashboard({ initialData }: ClientDashboardProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const hasHandledVerificationRef = useRef(false);

  // Use initialData from server component (no client-side fetching)
  const clientProfile = initialData?.clientProfile ?? null;
  const applications = useMemo(
    () => ((initialData?.applications ?? []) as DashboardApplication[]),
    [initialData?.applications]
  );
  const gigs = useMemo(() => ((initialData?.gigs ?? []) as DashboardGig[]), [initialData?.gigs]);

  // Memoize applications to prevent useEffect dependency changes
  const applicationsLength = applications.length;

  // Calculate dashboard stats from real data
  const dashboardStats = {
    totalGigs: gigs.length,
    activeGigs: gigs.filter((gig) => gig.status === "active").length,
    closedGigs: gigs.filter((gig) => gig.status === "closed").length,
    totalApplications: applications.length,
    newApplications: applications.filter(
      (app) => app.status === "new" || app.status === "under_review"
    ).length,
    // NOTE: `gig_status` enum is draft|active|closed|featured|urgent (no "completed").
    // If/when a completion concept exists, derive it from bookings/payment state instead.
    totalSpent: 0, // This would need to be calculated from bookings/payments
  };

  // Get upcoming deadlines (gigs with deadlines in the next 30 days)
  const upcomingDeadlines = gigs
    .filter((gig) => gig.status === "active" && gig.application_deadline)
    .filter((gig) => {
      if (!gig.application_deadline) return false;
      const deadline = new Date(gig.application_deadline);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return deadline <= thirtyDaysFromNow;
    })
    .slice(0, 5);

  // Check for incomplete profile
  const missingFields = [];
  if (!clientProfile?.company_name) missingFields.push("Company Name");
  if (!clientProfile?.contact_name) missingFields.push("Contact Name");
  if (!clientProfile?.contact_email) missingFields.push("Contact Email");

  // Log empty states for analytics
  useEffect(() => {
    if (user) {
      if (applicationsLength === 0) {
        logEmptyState("client_applications", user.id);
      }
      if (gigs.length === 0) {
        logEmptyState("client_gigs", user.id);
      }
    }
  }, [applicationsLength, gigs.length, user]);

  // Log fallback usage
  useEffect(() => {
    if (applicationsLength > 0 && user) {
      applications.forEach((app) => {
        if (!app.talent_profiles?.first_name && app.profiles?.display_name) {
          logFallbackUsage("display_name", "talent_name", user.id);
        }
        if (!app.talent_profiles?.location) {
          logFallbackUsage("location", "talent_location", user.id);
        }
        if (!app.talent_profiles?.experience) {
          logFallbackUsage("experience", "talent_experience", user.id);
        }
      });
    }
  }, [applications, applicationsLength, user]);

  useEffect(() => {
    const verifiedParam = searchParams.get("verified");
    if (verifiedParam !== "true" || hasHandledVerificationRef.current) {
      return;
    }

    hasHandledVerificationRef.current = true;
    setShowVerifiedMessage(true);

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("verified");
      router.replace(`${currentUrl.pathname}${currentUrl.search}`);
    } catch {
      // Non-blocking cleanup failure should never break dashboard rendering.
    }
  }, [searchParams, router]);

  // Status color helper removed: dashboard uses StatusBadge components instead.

  // Note: Category color logic can be enhanced with getCategoryBadgeVariant if needed
  const getCategoryColor = (category: string | undefined) => {
    void category;
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Show loading state if no initialData (server is fetching)
  if (!initialData) {
    return <ClientDashboardSkeleton />;
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center relative overflow-hidden">
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-3xl">
            <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 rounded-full" />
            <User className="h-16 w-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Welcome Back</h2>
            <p className="text-gray-300 mb-6 text-lg">
              You need to be logged in to access your Career Builder dashboard.
            </p>
            <Button
              asChild
              className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Link href="/login">Sign In to Continue</Link>
            </Button>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-3">New to TOTL?</p>
              <Link href="/client/apply" className="text-blue-400 hover:text-blue-200 transition-colors text-sm font-medium">
                Apply to become a Career Builder →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickStatCardClass = "text-white";
  const panelCardClass = "text-white";
  const tabTriggerClass =
    "flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-xs text-gray-200 transition hover:bg-gray-800 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg sm:text-sm";
  return (
    <PageShell topPadding={false} fullBleed>
      <ClientTerminalHeader
        title="Career Builder Dashboard"
        subtitle={clientProfile?.company_name || "Manage gigs and applications"}
        desktopPrimaryAction={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isSigningOut) return;
                setIsSigningOut(true);
                try {
                  await signOut();
                } catch {
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
              className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-6 lg:px-8">
        {showVerifiedMessage && (
          <Alert className="bg-green-900/30 border-green-700 mb-6">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertTitle className="text-green-300">Email verified successfully!</AlertTitle>
            <AlertDescription className="text-green-400">
              Your account is confirmed and ready to use.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ClientStatCard
              className={quickStatCardClass}
              title="Total Gigs"
              icon={<Briefcase className="h-4 w-4 text-blue-300" />}
              badgeLabel="All time"
              value={dashboardStats.totalGigs}
              footerLabel="Next action"
              footerActionText="Post a gig"
              footerActionHref="/post-gig"
            />

            <ClientStatCard
              className={quickStatCardClass}
              title="Active Gigs"
              icon={<Activity className="h-4 w-4 text-green-300" />}
              badgeLabel="Live"
              value={dashboardStats.activeGigs}
              footerLabel="Next action"
              footerActionText="Manage gigs"
              footerActionHref="/client/gigs"
            />

            <ClientStatCard
              className={quickStatCardClass}
              title="Applications"
              icon={<Users className="h-4 w-4 text-purple-300" />}
              badgeLabel="Total"
              value={dashboardStats.totalApplications}
              footerLabel="Next action"
              footerActionText="Review applicants"
              footerActionHref="/client/applications"
            />

            <ClientStatCard
              className={quickStatCardClass}
              title="New"
              icon={<ClockIcon className="h-4 w-4 text-yellow-300" />}
              badgeLabel="Incoming"
              value={dashboardStats.newApplications}
              footerLabel="Next action"
              footerActionText="Triage now"
              footerActionHref="/client/applications"
            />

            <ClientStatCard
              className={quickStatCardClass}
              title="Closed"
              icon={<CheckCircle className="h-4 w-4 text-green-300" />}
              badgeLabel="Closed"
              value={dashboardStats.closedGigs}
              footerLabel="Next action"
              footerActionText="View history"
              footerActionHref="/client/gigs"
            />

            <ClientStatCard
              className={quickStatCardClass}
              title="Total Spent"
              icon={<DollarSign className="h-4 w-4 text-emerald-300" />}
              badgeLabel="To date"
              value={`$${dashboardStats.totalSpent.toLocaleString()}`}
              footerLabel="Next action"
              footerActionText="Review budgets"
              footerActionHref="/client/gigs"
            />
          </div>
          <MobileTabRail>
            <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-2xl border border-gray-800 bg-gray-900 p-1">
              <TabsTrigger value="overview" className={tabTriggerClass}>
                <BarChart3 className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="gigs" className={tabTriggerClass}>
                <Briefcase className="h-3.5 w-3.5" />
                My Gigs
              </TabsTrigger>
              <TabsTrigger value="applications" className={tabTriggerClass}>
                <Users className="h-3.5 w-3.5" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="create" className={tabTriggerClass}>
                <Plus className="h-3.5 w-3.5" />
                Create Gig
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="hidden w-full grid-cols-4 gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-1 md:grid">
            <TabsTrigger value="overview" className={tabTriggerClass}>
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gigs" className={tabTriggerClass}>
              <Briefcase className="h-4 w-4" />
              My Gigs
            </TabsTrigger>
            <TabsTrigger value="applications" className={tabTriggerClass}>
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="create" className={tabTriggerClass}>
              <Plus className="h-4 w-4" />
              Create Gig
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTabContent
              missingFields={missingFields}
              dashboardStats={dashboardStats}
              gigs={gigs}
              applications={applications}
              upcomingDeadlines={upcomingDeadlines}
              panelCardClass={panelCardClass}
              getCategoryColor={getCategoryColor}
            />
          </TabsContent>

          <TabsContent value="gigs" className="space-y-6">
            <GigsTabContent gigs={gigs} getCategoryColor={getCategoryColor} />
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationsTabContent applications={applications} onCreateGig={() => setActiveTab("create")} />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CreateTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
