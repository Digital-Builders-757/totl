"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { DataTableShell } from "@/components/layout/data-table-shell";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { adminSetApplicationStatusAction } from "@/lib/actions/admin-application-actions";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type ApplicationWithDetails = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs: { id: string; title: string; location: string | null } | null;
  talent: { id: string; name: string; location: string | null } | null;
};

interface AdminApplicationsClientProps {
  applications: ApplicationWithDetails[];
  user: User;
}

export function AdminApplicationsClient({
  applications: initialApplications,
  user,
}: AdminApplicationsClientProps) {
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<ApplicationWithDetails[]>(initialApplications);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyWithMessage, setOnlyWithMessage] = useState(false);

  const { toast } = useToast();

  // Filter applications based on search query and active tab
  useEffect(() => {
    if (!applications.length) {
      setFilteredApplications([]);
      return;
    }

    let filtered = applications;

    // Filter by status based on active tab
    filtered = filtered.filter((app) => {
      if (activeTab === "new") return app.status === "new";
      if (activeTab === "approved") return app.status === "accepted";
      if (activeTab === "rejected") return app.status === "rejected";
      return true;
    });

    if (onlyWithMessage) {
      filtered = filtered.filter((app) => Boolean(app.message?.trim()));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((app) => {
        const gigTitle = app.gigs?.title?.toLowerCase?.() ?? "";
        const gigLocation = app.gigs?.location?.toLowerCase?.() ?? "";
        const talentName = app.talent?.name?.toLowerCase?.() ?? "";
        const talentLocation = app.talent?.location?.toLowerCase?.() ?? "";

        return (
          app.gig_id.toLowerCase().includes(query) ||
          app.talent_id.toLowerCase().includes(query) ||
          gigTitle.includes(query) ||
          gigLocation.includes(query) ||
          talentName.includes(query) ||
          talentLocation.includes(query) ||
          app.status.toLowerCase().includes(query)
        );
      });
    }

    setFilteredApplications(filtered);
  }, [applications, searchQuery, activeTab, onlyWithMessage]);

  const newCount = applications.filter((app) => app.status === "new").length;
  const approvedCount = applications.filter((app) => app.status === "accepted").length;
  const rejectedCount = applications.filter((app) => app.status === "rejected").length;
  const activeFilterCount = onlyWithMessage ? 1 : 0;

  const handleApprove = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const result = await adminSetApplicationStatusAction({
        applicationId: selectedApplication.id,
        status: "accepted",
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // Update the local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id ? { ...app, status: "accepted" } : app
          )
        );

        toast({
          title: "Application Approved",
          description: "The talent application has been approved successfully.",
        });
      }
    } catch (error) {
      logger.error("Error approving application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowApproveDialog(false);
      setSelectedApplication(null);
      setAdminNotes("");
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const result = await adminSetApplicationStatusAction({
        applicationId: selectedApplication.id,
        status: "rejected",
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // Update the local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id ? { ...app, status: "rejected" } : app
          )
        );

        toast({
          title: "Application Rejected",
          description: "The talent application has been rejected.",
        });
      }
    } catch (error) {
      logger.error("Error rejecting application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowRejectDialog(false);
      setSelectedApplication(null);
      setAdminNotes("");
    }
  };

  const renderInlineActions = (application: ApplicationWithDetails) => (
    <div className="flex flex-wrap items-center gap-2">
      {activeTab === "new" ? (
        <>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-green-600 text-white hover:bg-green-700"
            onClick={() => {
              setSelectedApplication(application);
              setShowApproveDialog(true);
            }}
          >
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 border-red-600/60 bg-transparent text-red-300 hover:bg-red-900/20"
            onClick={() => {
              setSelectedApplication(application);
              setShowRejectDialog(true);
            }}
          >
            Reject
          </Button>
        </>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
        asChild
      >
        <Link href={`/admin/applications/${application.id}`}>View details</Link>
      </Button>
    </div>
  );

  return (
    <PageShell topPadding={false} fullBleed>
      <AdminHeader user={user} />
      <div className="container mx-auto space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        <PageHeader
          title="Talent Applications"
          subtitle="Review and manage talent applications for opportunities."
        />

        <div className="md:hidden">
          <MobileSummaryRow
            items={[
              { label: "New", value: newCount, icon: Clock },
              { label: "Approved", value: approvedCount, icon: CheckCircle },
              { label: "Rejected", value: rejectedCount, icon: XCircle },
            ]}
          />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">{newCount} New</Badge>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/40">{approvedCount} Approved</Badge>
          <Badge className="bg-red-500/20 text-red-300 border-red-500/40">{rejectedCount} Rejected</Badge>
        </div>

        <div className="rounded-2xl panel-frosted card-backlit p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]" size={16} />
              <Input
                placeholder="Search applications"
                className="w-full border-white/10 bg-white/5 pl-9 text-white placeholder:text-[var(--oklch-text-tertiary)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <FiltersSheet
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                  activeCount={activeFilterCount}
                  title="Application Filters"
                >
                  <Button
                    type="button"
                    variant={onlyWithMessage ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setOnlyWithMessage((prev) => !prev)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {onlyWithMessage ? "Only with message (on)" : "Only with message"}
                  </Button>
                </FiltersSheet>
              </div>
              <Button
                type="button"
                variant={onlyWithMessage ? "default" : "outline"}
                size="sm"
                className="hidden border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white md:inline-flex"
                onClick={() => setOnlyWithMessage((prev) => !prev)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {onlyWithMessage ? "With message" : "All messages"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="new" className="w-full space-y-4" onValueChange={setActiveTab}>
            <MobileTabRail edgeColorClassName="from-[rgba(6,8,18,0.98)]">
              <TabsList className="panel-frosted inline-flex h-auto min-w-max gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                <TabsTrigger value="new" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  New ({newCount})
                </TabsTrigger>
                <TabsTrigger value="approved" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Approved ({approvedCount})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                  Rejected ({rejectedCount})
                </TabsTrigger>
              </TabsList>
            </MobileTabRail>

            <TabsList className="panel-frosted hidden h-11 border border-white/10 bg-white/5 p-1 md:grid md:grid-cols-3">
              <TabsTrigger
                value="new"
                className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white"
              >
                New ({newCount})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
              >
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-amber-400" />
                  <p className="text-sm text-[var(--oklch-text-secondary)]">No new applications found.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredApplications.map((application) => (
                      <MobileListRowCard
                        key={application.id}
                        title={application.gigs?.title ?? `Application #${application.id.slice(0, 8)}`}
                        subtitle={application.talent?.name ?? `Talent ${application.talent_id.slice(0, 8)}...`}
                        meta={[
                          { label: "Location", value: application.gigs?.location ?? "—" },
                          { label: "Applied", value: new Date(application.created_at).toLocaleDateString() },
                        ]}
                        badge={<ApplicationStatusBadge status={application.status} showIcon={true} />}
                        footer={renderInlineActions(application)}
                      />
                    ))}
                  </div>

                  <DataTableShell className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-card/45 to-card/28">
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Opportunity</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Talent</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Applied</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredApplications.map((application) => (
                          <tr key={application.id} className="transition-colors duration-200 hover:bg-card/22">
                            <td className="px-6 py-4">
                              <Link href={`/admin/gigs/${application.gig_id}`} className="block focus-hint">
                                <div className="text-sm font-medium text-white hover:underline">
                                  {application.gigs?.title ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.gig_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/talent/${application.talent_id}`} className="block focus-hint">
                                <div className="text-sm text-white hover:underline">
                                  {application.talent?.name ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.talent_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">{new Date(application.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><ApplicationStatusBadge status={application.status} showIcon={true} /></td>
                            <td className="px-6 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white">
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      queueMicrotask(() => setShowApproveDialog(true));
                                    }}
                                    className="text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                                    <span>Approve</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      queueMicrotask(() => setShowRejectDialog(true));
                                    }}
                                    className="text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-400" />
                                    <span>Reject</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white">
                                    <Link href={`/admin/applications/${application.id}`}>
                                      <Search className="mr-2 h-4 w-4" />
                                      <span>View Details</span>
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTableShell>
                </>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle className="mx-auto mb-3 h-8 w-8 text-green-400" />
                  <p className="text-sm text-[var(--oklch-text-secondary)]">No approved applications found.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredApplications.map((application) => (
                      <MobileListRowCard
                        key={application.id}
                        title={application.gigs?.title ?? `Application #${application.id.slice(0, 8)}`}
                        subtitle={application.talent?.name ?? `Talent ${application.talent_id.slice(0, 8)}...`}
                        meta={[
                          { label: "Location", value: application.gigs?.location ?? "—" },
                          { label: "Applied", value: new Date(application.created_at).toLocaleDateString() },
                        ]}
                        badge={<ApplicationStatusBadge status={application.status} showIcon={true} />}
                        footer={renderInlineActions(application)}
                      />
                    ))}
                  </div>

                  <DataTableShell className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-card/45 to-card/28">
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Opportunity</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Talent</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Applied</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredApplications.map((application) => (
                          <tr key={application.id} className="transition-colors duration-200 hover:bg-card/22">
                            <td className="px-6 py-4">
                              <Link href={`/admin/gigs/${application.gig_id}`} className="block focus-hint">
                                <div className="text-sm font-medium text-white hover:underline">
                                  {application.gigs?.title ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.gig_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/talent/${application.talent_id}`} className="block focus-hint">
                                <div className="text-sm text-white hover:underline">
                                  {application.talent?.name ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.talent_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">{new Date(application.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><ApplicationStatusBadge status={application.status} showIcon={true} /></td>
                            <td className="px-6 py-4">{renderInlineActions(application)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTableShell>
                </>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="py-10 text-center">
                  <XCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
                  <p className="text-sm text-[var(--oklch-text-secondary)]">No rejected applications found.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredApplications.map((application) => (
                      <MobileListRowCard
                        key={application.id}
                        title={application.gigs?.title ?? `Application #${application.id.slice(0, 8)}`}
                        subtitle={application.talent?.name ?? `Talent ${application.talent_id.slice(0, 8)}...`}
                        meta={[
                          { label: "Location", value: application.gigs?.location ?? "—" },
                          { label: "Applied", value: new Date(application.created_at).toLocaleDateString() },
                        ]}
                        badge={<ApplicationStatusBadge status={application.status} showIcon={true} />}
                        footer={renderInlineActions(application)}
                      />
                    ))}
                  </div>

                  <DataTableShell className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-card/45 to-card/28">
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Opportunity</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Talent</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Applied</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredApplications.map((application) => (
                          <tr key={application.id} className="transition-colors duration-200 hover:bg-card/22">
                            <td className="px-6 py-4">
                              <Link href={`/admin/gigs/${application.gig_id}`} className="block focus-hint">
                                <div className="text-sm font-medium text-white hover:underline">
                                  {application.gigs?.title ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.gig_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/talent/${application.talent_id}`} className="block focus-hint">
                                <div className="text-sm text-white hover:underline">
                                  {application.talent?.name ?? "Unknown"}
                                </div>
                                <div className="text-xs text-[var(--oklch-text-tertiary)]">{application.talent_id.slice(0, 8)}…</div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">{new Date(application.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><ApplicationStatusBadge status={application.status} showIcon={true} /></td>
                            <td className="px-6 py-4">{renderInlineActions(application)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTableShell>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle>Approve Talent Application</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              Are you sure you want to approve this talent application? This will notify the talent
              and client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes" className="text-[var(--oklch-text-secondary)]">
                Admin Notes (Optional)
              </Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes about this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-white/10 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Approve Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle>Reject Talent Application</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              Are you sure you want to reject this talent application? This will notify the talent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason" className="text-[var(--oklch-text-secondary)]">
                Rejection Reason
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Processing..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
