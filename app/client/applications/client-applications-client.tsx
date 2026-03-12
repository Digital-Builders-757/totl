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
import { getClientApplications } from "@/lib/actions/client-applications-actions";
import { createNameSlug } from "@/lib/utils/slug";

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
    application.talent_profiles
      ? `/talent/${createNameSlug(application.talent_profiles.first_name, application.talent_profiles.last_name)}`
      : `/talent/${application.talent_id}`;

  return (
    <div className="min-h-screen bg-black text-white">
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
            <summary className="cursor-pointer list-none text-sm font-medium text-gray-300">
              <span className="inline-flex items-center gap-2">
                Show stats
                <span className="text-xs text-gray-500">({applications.length} total)</span>
              </span>
            </summary>
            <div className="mt-2">
              <MobileSummaryRow items={summaryItems} />
            </div>
          </details>
        </div>

        <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          <Card className="min-w-0 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Under Review</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.under_review}
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Interviews</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.shortlisted}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Hired</p>
                  <p className="text-2xl font-bold text-white">
                    {applicationsByStatus.accepted}
                  </p>
                </div>
                <div className="bg-green-500/20 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex-1 relative">
            <input
              placeholder="Search by talent name, opportunity title, or location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-md px-3 py-2 border"
            />
          </div>
          <div className="hidden md:flex gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Gigs</option>
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
              className="border-gray-700 text-white hover:bg-white/5"
            >
              <div className="space-y-2">
                <label htmlFor="mobile-opportunity-filter" className="text-sm text-gray-300">
                  Gig
                </label>
                <select
                  id="mobile-opportunity-filter"
                  value={gigFilter}
                  onChange={(event) => setGigFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Gigs</option>
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
                className="w-full border-gray-700 text-white hover:bg-white/5"
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
            <span className="rounded-full border border-white/15 bg-gray-800 px-3 py-1 text-xs text-gray-200">
              Gig: {selectedGigLabel}
            </span>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <MobileTabRail>
            <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
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
          <TabsList className="hidden w-full grid-cols-4 md:grid">
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
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">No applications yet</h3>
                  <p className="text-gray-300 mb-6">
                    {searchTerm || statusFilter !== "all" || gigFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "When talent applies to your opportunities, their applications will show up here."}
                  </p>
                  {!searchTerm && statusFilter === "all" && gigFilter === "all" && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button asChild>
                        <Link href="/post-gig">Post an opportunity</Link>
                      </Button>
                      <Link href="/about" className="text-sm text-gray-400 hover:text-white underline">
                        How applications work
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {isDesktop === null ? (
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6 text-sm text-gray-300">
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
    </div>
  );
}
