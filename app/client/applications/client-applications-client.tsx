"use client";

import { Clock, DollarSign, CheckCircle2, Briefcase } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { Application } from "@/app/client/applications/types";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TotlAtmosphereShell } from "@/components/ui/totl-atmosphere-shell";
import { getClientApplications } from "@/lib/actions/client-applications-actions";

const AcceptApplicationDialog = dynamic(
  () =>
    import("@/components/client/accept-application-dialog").then((module) => ({
      default: module.AcceptApplicationDialog,
    })),
  { ssr: false }
);

const RejectApplicationDialog = dynamic(
  () =>
    import("@/components/client/reject-application-dialog").then((module) => ({
      default: module.RejectApplicationDialog,
    })),
  { ssr: false }
);

const MobileApplicationsList = dynamic(
  () => import("./components/mobile-applications-list"),
  { ssr: false }
);

const DesktopApplicationsList = dynamic(
  () => import("./components/desktop-applications-list"),
  { ssr: false }
);

interface ClientApplicationsClientProps {
  userId: string;
  initialApplications: Application[];
}

export default function ClientApplicationsClient({
  userId,
  initialApplications,
}: ClientApplicationsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gigFilter, setGigFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const {
    data: applications = initialApplications ?? [],
    mutate,
  } = useSWR<Application[]>(
    userId ? ["client-applications", userId] : null,
    async () => {
      const result = await getClientApplications();
      if (result.error) {
        throw new Error(result.error);
      }
      return (result.applications as Application[]) ?? [];
    },
    {
      fallbackData: initialApplications ?? [],
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleAcceptClick = (application: Application) => {
    setSelectedApplication(application);
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleDialogSuccess = (nextStatus: Application["status"]) => {
    if (!selectedApplication) {
      mutate();
      return;
    }

    mutate(
      applications.map((application) =>
        application.id === selectedApplication.id
          ? { ...application, status: nextStatus }
          : application
      ),
      { revalidate: false }
    );
    setSelectedApplication(null);
    setAcceptDialogOpen(false);
    setRejectDialogOpen(false);
    mutate();
  };

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const name = (application.profiles?.display_name ?? "").toLowerCase();
      const title = (application.gigs?.title ?? "").toLowerCase();

      const matchesSearch = !query || name.includes(query) || title.includes(query);
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const matchesGig = gigFilter === "all" || application.gig_id === gigFilter;
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "new" && application.status === "new") ||
        (activeTab === "interview" && application.status === "shortlisted") ||
        (activeTab === "hired" && application.status === "accepted");

      return matchesSearch && matchesStatus && matchesGig && matchesTab;
    });
  }, [applications, searchTerm, statusFilter, gigFilter, activeTab]);

  const uniqueGigs = useMemo(
    () => Array.from(new Set(applications.map((app) => app.gig_id))),
    [applications]
  );
  const activeFilterCount = gigFilter !== "all" ? 1 : 0;
  const selectedGigLabel = useMemo(
    () =>
      gigFilter === "all"
        ? null
        : applications.find((app) => app.gig_id === gigFilter)?.gigs?.title || "Selected opportunity",
    [applications, gigFilter]
  );
  const applicationsByStatus = useMemo(() => {
    const counts = {
      new: 0,
      under_review: 0,
      shortlisted: 0,
      accepted: 0,
    };

    for (const app of applications) {
      if (app.status in counts) {
        counts[app.status as keyof typeof counts] += 1;
      }
    }

    return counts;
  }, [applications]);

  const summaryItems = useMemo(
    () => [
      { label: "All", value: applications.length, icon: Briefcase },
      { label: "New", value: applicationsByStatus.new, icon: Clock },
      {
        label: "Interviews",
        value: applicationsByStatus.shortlisted,
        icon: Clock,
      },
      { label: "Hired", value: applicationsByStatus.accepted, icon: CheckCircle2 },
    ],
    [applications.length, applicationsByStatus.accepted, applicationsByStatus.new, applicationsByStatus.shortlisted]
  );

  const getTalentName = (application: Application) => {
    if (application.talent_profiles?.first_name || application.talent_profiles?.last_name) {
      return `${application.talent_profiles?.first_name ?? ""} ${application.talent_profiles?.last_name ?? ""}`.trim();
    }
    return application.profiles?.display_name || "Talent";
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "—";
    if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase();
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  };

  const getTalentProfileHref = (application: Application) =>
    `/talent/${application.talent_id}`;

  return (
    <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
      <ClientTerminalHeader
        title="Applications"
        subtitle="Review and manage talent applications for your opportunities"
        desktopPrimaryAction={
          <Button variant="outline" asChild>
            <Link href="/client/gigs">View My Opportunities</Link>
          </Button>
        }
        mobileSecondaryAction={<SecondaryActionLink href="/client/gigs">My opportunities →</SecondaryActionLink>}
      />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="mb-4 md:mb-8 md:hidden">
          <details>
            <summary className="cursor-pointer list-none text-sm font-medium text-[var(--oklch-text-secondary)]">
              <span className="inline-flex items-center gap-2">
                Show stats
                <span className="text-xs text-[var(--oklch-text-tertiary)]">({applications.length} total)</span>
              </span>
            </summary>
            <div className="mt-2">
              <MobileSummaryRow items={summaryItems} />
            </div>
          </details>
        </div>

        <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Under Review</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.under_review}
                  </p>
                </div>
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <Clock className="h-4 w-4 text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Interviews</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.shortlisted}
                  </p>
                </div>
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Clock className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Hired</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.accepted}
                  </p>
                </div>
                <div className="rounded-full bg-green-500/20 p-2">
                  <DollarSign className="h-4 w-4 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:gap-4">
          <div className="relative flex-1">
            <input
              placeholder="Search by talent name, opportunity title, or location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-[var(--oklch-text-tertiary)] focus:border-[var(--oklch-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            />
          </div>
          <div className="hidden gap-2 md:flex">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--oklch-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={gigFilter}
              onChange={(event) => setGigFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--oklch-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            >
              <option value="all">All Opportunities</option>
              {uniqueGigs.map((gigId) => {
                const gig = applications.find((app) => app.gig_id === gigId)?.gigs;
                return (
                  <option key={gigId} value={gigId}>
                    {gig?.title || `Opportunity ${gigId}`}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="md:hidden">
            <FiltersSheet
              open={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              activeCount={activeFilterCount}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              <div className="space-y-2">
                <label htmlFor="mobile-opportunity-filter" className="text-sm text-[var(--oklch-text-secondary)]">
                  Opportunity
                </label>
                <select
                  id="mobile-opportunity-filter"
                  value={gigFilter}
                  onChange={(event) => setGigFilter(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--oklch-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                >
                  <option value="all">All Opportunities</option>
                  {uniqueGigs.map((gigId) => {
                    const gig = applications.find((app) => app.gig_id === gigId)?.gigs;
                    return (
                      <option key={gigId} value={gigId}>
                        {gig?.title || `Opportunity ${gigId}`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setGigFilter("all");
                  setIsFiltersOpen(false);
                }}
              >
                Clear filters
              </Button>
            </FiltersSheet>
          </div>
        </div>

        {selectedGigLabel ? (
          <div className="mb-3 flex flex-wrap gap-2 md:hidden">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[var(--oklch-text-secondary)]">
              Gig: {selectedGigLabel}
            </span>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <MobileTabRail>
            <TabsList className="panel-frosted inline-flex h-auto min-w-max gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                All ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="new" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                New ({applicationsByStatus.new})
              </TabsTrigger>
              <TabsTrigger value="interview" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Interviews ({applicationsByStatus.shortlisted})
              </TabsTrigger>
              <TabsTrigger value="hired" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Hired ({applicationsByStatus.accepted})
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="panel-frosted hidden w-full grid-cols-4 border border-white/10 bg-white/5 md:grid">
            <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="new">
              New ({applicationsByStatus.new})
            </TabsTrigger>
            <TabsTrigger value="interview">
              Interviews ({applicationsByStatus.shortlisted})
            </TabsTrigger>
            <TabsTrigger value="hired">
              Hired ({applicationsByStatus.accepted})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredApplications.length === 0 ? (
              <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
                <CardContent className="p-12 text-center">
                  <h3 className="mb-2 text-lg font-medium text-white">No applications yet</h3>
                  <p className="mb-6 text-[var(--oklch-text-secondary)]">
                    {searchTerm || statusFilter !== "all" || gigFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "When talent applies to your opportunities, their applications will show up here."}
                  </p>
                  {!searchTerm && statusFilter === "all" && gigFilter === "all" && (
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Button asChild>
                        <Link href="/client/post-gig">Post an opportunity</Link>
                      </Button>
                      <Link href="/client/help/applications" className="text-sm text-[var(--oklch-text-tertiary)] underline hover:text-white">
                        How applications work
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {isDesktop === null ? (
                  <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
                    <CardContent className="p-6 text-sm text-[var(--oklch-text-secondary)]">
                      Loading applications view...
                    </CardContent>
                  </Card>
                ) : isDesktop ? (
                  <DesktopApplicationsList
                    applications={filteredApplications}
                    getTalentName={getTalentName}
                    getTalentProfileHref={getTalentProfileHref}
                    getInitials={getInitials}
                    onAccept={handleAcceptClick}
                    onReject={handleRejectClick}
                  />
                ) : (
                  <MobileApplicationsList
                    applications={filteredApplications}
                    getTalentName={getTalentName}
                    getTalentProfileHref={getTalentProfileHref}
                    onAccept={handleAcceptClick}
                    onReject={handleRejectClick}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedApplication && (
        <>
          <AcceptApplicationDialog
            open={acceptDialogOpen}
            onOpenChange={setAcceptDialogOpen}
            applicationId={selectedApplication.id}
            talentName={selectedApplication.profiles?.display_name || "Talent"}
            gigTitle={selectedApplication.gigs?.title || "Opportunity"}
            suggestedCompensation={selectedApplication.gigs?.compensation}
            onSuccess={() => handleDialogSuccess("accepted")}
          />
          <RejectApplicationDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            applicationId={selectedApplication.id}
            talentName={selectedApplication.profiles?.display_name || "Talent"}
            gigTitle={selectedApplication.gigs?.title || "Opportunity"}
            onSuccess={() => handleDialogSuccess("rejected")}
          />
        </>
      )}
    </TotlAtmosphereShell>
  );
}
