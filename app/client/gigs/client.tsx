"use client";

import {
  Plus,
  AlertCircle,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TotlAtmosphereShell } from "@/components/ui/totl-atmosphere-shell";
import { getClientGigs, type ClientGig } from "@/lib/actions/client-gigs-actions";
import { userSafeMessage } from "@/lib/errors/user-safe-message";

const GigsStatsOverview = dynamic(() => import("./components/gigs-stats-overview"), { ssr: false });
const GigsResultsContent = dynamic(() => import("./components/gigs-results-content"), { ssr: false });

interface ClientGigsClientProps {
  userId: string;
  initialGigs: ClientGig[];
}

function normalizeStatus(status?: string | null): "active" | "completed" | "draft" | "other" {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "active") return "active";
  if (normalized === "completed" || normalized === "closed") return "completed";
  if (normalized === "draft") return "draft";
  return "other";
}

export default function ClientGigsClient({ userId, initialGigs }: ClientGigsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: gigs = initialGigs, error, isLoading, mutate } = useSWR<ClientGig[]>(
    userId ? ["client-gigs", userId] : null,
    async () => {
      const result = await getClientGigs();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.gigs ?? [];
    },
    {
      fallbackData: initialGigs,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
    }
  );

  // Removed getStatusColor - now using GigStatusBadge component

  // Note: Category color logic can be enhanced with getCategoryBadgeVariant if needed
  // For now, keeping a simple fallback since badge styling may vary
  const getCategoryColor = (category: string) => {
    void category;
    // Default fallback - can be enhanced with getCategoryBadgeVariant
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const statusCounts = useMemo(() => {
    const counts = {
      active: 0,
      completed: 0,
      draft: 0,
    };
    for (const gig of gigs) {
      const status = normalizeStatus(gig.status);
      if (status === "active" || status === "completed" || status === "draft") {
        counts[status] += 1;
      }
    }
    return counts;
  }, [gigs]);

  const totalApplications = useMemo(
    () => gigs.reduce((sum, gig) => sum + (gig.applications_count || 0), 0),
    [gigs]
  );

  const filteredGigs = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return gigs.filter((gig) => {
      const matchesSearch =
        gig.title.toLowerCase().includes(query) ||
        gig.description.toLowerCase().includes(query) ||
        gig.location.toLowerCase().includes(query);

      const normalized = normalizeStatus(gig.status);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && normalized === "active") ||
        (activeTab === "completed" && normalized === "completed") ||
        (activeTab === "draft" && normalized === "draft");

      return matchesSearch && matchesTab;
    });
  }, [activeTab, gigs, searchTerm]);

  // Removed getStatusIcon - now using GigStatusBadge component

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
        <div className="flex min-h-[100dvh] items-center justify-center px-4">
          <div className="panel-frosted card-backlit max-w-md rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold">Unable to load gigs</h2>
            <p className="mb-4 text-[var(--oklch-text-muted)]">
              {userSafeMessage(error, "Failed to load opportunities")}
            </p>
            <Button onClick={() => mutate()}>Try Again</Button>
          </div>
        </div>
      </TotlAtmosphereShell>
    );
  }

  if (isLoading) {
    return (
      <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
        <div className="px-4 py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-9 w-56 rounded-lg bg-muted/40" />
              <Skeleton className="h-4 w-72 max-w-full rounded-lg bg-muted/35" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
            </div>
            <Skeleton className="h-[460px] w-full rounded-xl bg-muted/35" />
          </div>
        </div>
      </TotlAtmosphereShell>
    );
  }

  return (
    <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
      <ClientTerminalHeader
        title="My Opportunities"
        subtitle="Manage your posted opportunities and track applications"
        desktopPrimaryAction={
          <Button asChild>
            <Link href="/client/post-gig">
              <Plus className="h-4 w-4 mr-2" />
              Post New Opportunity
            </Link>
          </Button>
        }
        mobileSecondaryAction={<SecondaryActionLink href="/client/post-gig">Post new opportunity →</SecondaryActionLink>}
      />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <GigsStatsOverview
          totalGigs={gigs.length}
          activeCount={statusCounts.active}
          completedCount={statusCounts.completed}
          totalApplications={totalApplications}
        />

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--oklch-text-muted)]" />
            <Input
              placeholder="Search opportunities by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <MobileTabRail>
            <TabsList className="tabs-list-surface inline-flex h-auto min-w-max gap-1 rounded-xl p-1">
              <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                All Opportunities ({gigs.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="completed" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Completed ({statusCounts.completed})
              </TabsTrigger>
              <TabsTrigger value="draft" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Draft ({statusCounts.draft})
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="tabs-list-surface hidden w-full grid-cols-4 md:grid">
            <TabsTrigger value="all">All Opportunities ({gigs.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({statusCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({statusCounts.draft})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <GigsResultsContent
              filteredGigs={filteredGigs}
              searchTerm={searchTerm}
              getCategoryColor={getCategoryColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TotlAtmosphereShell>
  );
}
