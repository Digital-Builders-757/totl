"use client";

import { Clock, MapPin, DollarSign, CheckCircle2, XCircle, MoreVertical, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AcceptApplicationDialog } from "@/components/client/accept-application-dialog";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { RejectApplicationDialog } from "@/components/client/reject-application-dialog";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaThumb } from "@/components/ui/media-thumb";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createNameSlug } from "@/lib/utils/slug";
import { publicBucketUrl } from "@/lib/utils/storage-urls";

export interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
  message: string | null;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  profiles?: {
    display_name: string | null;
    email_verified: boolean;
    role: string;
    avatar_url: string | null;
    avatar_path: string | null;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ClientApplicationsClientProps {
  initialApplications: Application[];
}

export default function ClientApplicationsClient({
  initialApplications,
}: ClientApplicationsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gigFilter, setGigFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const applications = initialApplications ?? [];

  const handleAcceptClick = (application: Application) => {
    setSelectedApplication(application);
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    router.refresh();
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

  const uniqueGigs = Array.from(new Set(applications.map((app) => app.gig_id)));
  const activeFilterCount = gigFilter !== "all" ? 1 : 0;
  const selectedGigLabel =
    gigFilter === "all"
      ? null
      : applications.find((app) => app.gig_id === gigFilter)?.gigs?.title || "Selected gig";
  const summaryItems = [
    { label: "All", value: applications.length, icon: Briefcase },
    { label: "New", value: applications.filter((app) => app.status === "new").length, icon: Clock },
    { label: "Interviews", value: applications.filter((app) => app.status === "shortlisted").length, icon: Clock },
    { label: "Hired", value: applications.filter((app) => app.status === "accepted").length, icon: CheckCircle2 },
  ];

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
        subtitle="Review and manage talent applications for your gigs"
        desktopPrimaryAction={
          <Button variant="outline" asChild>
            <Link href="/client/gigs">View My Gigs</Link>
          </Button>
        }
        mobileSecondaryAction={<SecondaryActionLink href="/client/gigs">My gigs →</SecondaryActionLink>}
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

        <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Under Review</p>
                  <p className="text-2xl font-bold text-white">
                    {applications.filter((app) => app.status === "under_review").length}
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Interviews</p>
                  <p className="text-2xl font-bold text-white">
                    {applications.filter((app) => app.status === "shortlisted").length}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Hired</p>
                  <p className="text-2xl font-bold text-white">
                    {applications.filter((app) => app.status === "accepted").length}
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
              placeholder="Search by talent name, gig title, or location..."
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
                    {gig?.title || `Gig ${gigId}`}
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
                <label htmlFor="mobile-gig-filter" className="text-sm text-gray-300">
                  Gig
                </label>
                <select
                  id="mobile-gig-filter"
                  value={gigFilter}
                  onChange={(event) => setGigFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Gigs</option>
                  {uniqueGigs.map((gigId) => {
                    const gig = applications.find((app) => app.gig_id === gigId)?.gigs;
                    return (
                      <option key={gigId} value={gigId}>
                        {gig?.title || `Gig ${gigId}`}
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
          <div className="relative md:hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-black to-transparent" />
            <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
                <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  All ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="new" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  New ({applications.filter((app) => app.status === "new").length})
                </TabsTrigger>
                <TabsTrigger value="interview" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Interviews ({applications.filter((app) => app.status === "shortlisted").length})
                </TabsTrigger>
                <TabsTrigger value="hired" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Hired ({applications.filter((app) => app.status === "accepted").length})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsList className="hidden w-full grid-cols-4 md:grid">
            <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="new">
              New ({applications.filter((app) => app.status === "new").length})
            </TabsTrigger>
            <TabsTrigger value="interview">
              Interviews ({applications.filter((app) => app.status === "shortlisted").length})
            </TabsTrigger>
            <TabsTrigger value="hired">
              Hired ({applications.filter((app) => app.status === "accepted").length})
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
                      : "When talent applies to your gigs, their applications will show up here."}
                  </p>
                  {!searchTerm && statusFilter === "all" && gigFilter === "all" && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button asChild>
                        <Link href="/post-gig">Post a gig</Link>
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
                <div className="space-y-3 md:hidden">
                  {filteredApplications.map((application) => {
                    const talentName = getTalentName(application);
                    const profileHref = getTalentProfileHref(application);
                    const appliedDate = new Date(application.created_at).toLocaleDateString();
                    const showDecisionMenu =
                      application.status === "new" || application.status === "under_review";

                    return (
                      <MobileListRowCard
                        key={`${application.id}-mobile`}
                        title={talentName}
                        subtitle={application.gigs?.title || "Gig"}
                        badge={<ApplicationStatusBadge status={application.status} showIcon={false} />}
                        meta={[
                          {
                            label: "Location",
                            value: application.gigs?.location || "Location TBD",
                          },
                          {
                            label: "Comp",
                            value: application.gigs?.compensation || "Comp TBD",
                          },
                          {
                            label: "Applied",
                            value: appliedDate,
                          },
                        ]}
                        trailing={
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="More actions"
                                className="h-11 w-11 text-gray-400 hover:bg-gray-700"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                              <DropdownMenuItem asChild className="text-gray-200 focus:text-white">
                                <Link href={profileHref}>Review profile</Link>
                              </DropdownMenuItem>
                              {showDecisionMenu ? (
                                <>
                                  <DropdownMenuItem
                                    data-test="accept-application"
                                    onClick={() => handleAcceptClick(application)}
                                    className="text-gray-200 focus:text-white"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                                    Accept
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRejectClick(application)}
                                    className="text-gray-200 focus:text-white"
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-400" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        }
                        footer={
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Next action</span>
                            <Link href={profileHref} className="text-[var(--oklch-text-primary)] hover:underline">
                              Review profile
                            </Link>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
                <div className="hidden space-y-4 md:block">
                  {filteredApplications.map((application) => {
                    const talentName = getTalentName(application);
                    const talentInitials = getInitials(talentName);
                    const profileHref = getTalentProfileHref(application);
                    const appliedDate = new Date(application.created_at).toLocaleDateString();
                    const showDecisionMenu =
                      application.status === "new" || application.status === "under_review";

                    const avatarSrc =
                      application.profiles?.avatar_url ||
                      publicBucketUrl("avatars", application.profiles?.avatar_path);

                    return (
                      <Card key={application.id} className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start">
                            <MediaThumb
                              src={avatarSrc}
                              alt={`${talentName} profile`}
                              variant="talent"
                              fallbackText={talentInitials}
                              className="w-16 md:w-20"
                            />
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-semibold text-white">{talentName}</h3>
                                  <p className="text-sm text-gray-300">{application.gigs?.title || "Gig"}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {application.gigs?.location || "Location TBD"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {application.gigs?.compensation || "Comp TBD"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Applied {appliedDate}
                                    </span>
                                  </div>
                                </div>
                                <ApplicationStatusBadge status={application.status} showIcon={true} />
                              </div>
                              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                                <span className="text-xs text-gray-400">Next action</span>
                                <div className="flex items-center gap-2">
                                  <Link href={profileHref} className="text-[var(--oklch-text-primary)] hover:underline">
                                    Review profile
                                  </Link>
                                  {showDecisionMenu ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="More actions"
                                          className="h-11 w-11 text-gray-400 hover:bg-gray-700"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                                        <DropdownMenuItem
                                          data-test="accept-application"
                                          onClick={() => handleAcceptClick(application)}
                                          className="text-gray-200 focus:text-white"
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                                          Accept
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleRejectClick(application)}
                                          className="text-gray-200 focus:text-white"
                                        >
                                          <XCircle className="mr-2 h-4 w-4 text-red-400" />
                                          Reject
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      {application.status === "accepted" ? "Accepted" : "Rejected"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
            gigTitle={selectedApplication.gigs?.title || "Gig"}
            suggestedCompensation={selectedApplication.gigs?.compensation}
            onSuccess={handleDialogSuccess}
          />
          <RejectApplicationDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            applicationId={selectedApplication.id}
            talentName={selectedApplication.profiles?.display_name || "Talent"}
            gigTitle={selectedApplication.gigs?.title || "Gig"}
            onSuccess={handleDialogSuccess}
          />
        </>
      )}
    </div>
  );
}
