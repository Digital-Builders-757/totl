"use client";
/* eslint-disable react/prop-types */

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Building2,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { DataTableShell } from "@/components/layout/data-table-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
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
import { LongToken } from "@/components/ui/long-token";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  approveClientApplication,
  rejectClientApplication,
  sendClientApplicationFollowUpReminders,
} from "@/lib/actions/client-actions";
import { logger } from "@/lib/utils/logger";
import { Database } from "@/types/supabase";

type ClientApplication = Database["public"]["Tables"]["client_applications"]["Row"] & {
  follow_up_sent_at?: string | null;
};

interface AdminClientApplicationsClientProps {
  applications: ClientApplication[];
  user: User;
}

export function AdminClientApplicationsClient({
  applications: initialApplications,
  user,
}: AdminClientApplicationsClientProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApplication, setSelectedApplication] = useState<ClientApplication | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingFollowUps, setIsSendingFollowUps] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [existingAccountInviteEmail, setExistingAccountInviteEmail] = useState<string | null>(null);
  const [isSendingExistingUserLink, setIsSendingExistingUserLink] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState<"all" | "sent" | "not_sent">("all");
  const { toast } = useToast();

  // Filter applications by status and search
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by status based on active tab
    if (activeTab === "pending") {
      filtered = filtered.filter((app) => app.status === "pending");
    } else if (activeTab === "approved") {
      filtered = filtered.filter((app) => app.status === "approved");
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((app) => app.status === "rejected");
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.company_name.toLowerCase().includes(query) ||
          app.first_name.toLowerCase().includes(query) ||
          app.last_name.toLowerCase().includes(query) ||
          app.email.toLowerCase().includes(query) ||
          (app.industry && app.industry.toLowerCase().includes(query))
      );
    }

    if (followUpFilter === "sent") {
      filtered = filtered.filter((app) => Boolean(app.follow_up_sent_at));
    } else if (followUpFilter === "not_sent") {
      filtered = filtered.filter((app) => !app.follow_up_sent_at);
    }

    return filtered;
  }, [applications, searchQuery, activeTab, followUpFilter]);

  // Group by status for stats
  const pendingApplications = applications.filter((app) => app.status === "pending");
  const approvedApplications = applications.filter((app) => app.status === "approved");
  const rejectedApplications = applications.filter((app) => app.status === "rejected");
  const followUpSentCount = applications.filter((app) => Boolean(app.follow_up_sent_at)).length;
  const followUpNotSentCount = applications.length - followUpSentCount;
  const activeFilterCount = followUpFilter === "all" ? 0 : 1;

  const formatFollowUpDate = (value: string | null) => {
    if (!value) {
      return null;
    }
    return new Date(value).toLocaleDateString();
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderApplicationActions = (application: ClientApplication) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="panel-frosted border-border/50">
        <DropdownMenuItem
          onClick={() => {
            setSelectedApplication(application);
            setIsDetailsDialogOpen(true);
          }}
          className="text-gray-300 hover:bg-gray-700"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {application.status === "pending" && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setSelectedApplication(application);
                setAdminNotes("");
                setIsApproveDialogOpen(true);
              }}
              className="text-gray-300 hover:bg-gray-700"
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedApplication(application);
                setAdminNotes("");
                setIsRejectDialogOpen(true);
              }}
              className="text-gray-300 hover:bg-gray-700"
            >
              <XCircle className="mr-2 h-4 w-4 text-red-400" />
              Reject
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderApplicationsContent = (
    emptyTitle: string,
    emptyDescription: string
  ) => {
    if (filteredApplications.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
            <Clock className="h-7 w-7 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-gray-400">{emptyDescription}</p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3 md:hidden">
          {filteredApplications.map((application) => (
            <MobileListRowCard
              key={`mobile-${application.id}`}
              title={application.company_name}
              subtitle={`${application.first_name} ${application.last_name}`}
              meta={[
                { label: "Email", value: application.email },
                { label: "Industry", value: application.industry || "N/A" },
                {
                  label: "Follow-up",
                  value: application.follow_up_sent_at
                    ? `Sent ${formatFollowUpDate(application.follow_up_sent_at)}`
                    : "Not sent",
                },
              ]}
              badge={getStatusBadge(application.status)}
              trailing={renderApplicationActions(application)}
            />
          ))}
        </div>
        <DataTableShell className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-card/45 to-card/28">
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Company Name
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Contact
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Industry
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Applied Date
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Follow-Up
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-card/22 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div className="font-medium text-white text-sm">{application.company_name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-white text-sm">
                      {application.first_name} {application.last_name}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Mail className="h-3 w-3" />
                      {application.email}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {application.industry || "—"}
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {new Date(application.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(application.status)}</td>
                  <td className="py-4 px-6">
                    {application.follow_up_sent_at ? (
                      <span className="text-sm text-green-300">
                        Sent {formatFollowUpDate(application.follow_up_sent_at)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not sent</span>
                    )}
                  </td>
                  <td className="py-4 px-6">{renderApplicationActions(application)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </>
    );
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const result = await approveClientApplication(selectedApplication.id, adminNotes || undefined);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const emailNote =
          result.didPromote === false
            ? "Already approved (no new email sent)."
            : "Approval email sent.";
        toast({
          title: "Application Approved",
          description: `${selectedApplication.company_name} has been approved. ${emailNote}`,
        });

        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: "approved", admin_notes: adminNotes || null }
              : app
          )
        );

        setIsApproveDialogOpen(false);
        setSelectedApplication(null);
        setAdminNotes("");
      }
    } catch (error) {
      logger.error("Error approving application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const result = await rejectClientApplication(selectedApplication.id, adminNotes || undefined);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const emailNote =
          result.didDecide === false
            ? "Already rejected (no new email sent)."
            : "Notification email sent.";
        toast({
          title: "Application Rejected",
          description: `${selectedApplication.company_name} has been rejected. ${emailNote}`,
        });

        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: "rejected", admin_notes: adminNotes || null }
              : app
          )
        );

        setIsRejectDialogOpen(false);
        setSelectedApplication(null);
        setAdminNotes("");
      }
    } catch (error) {
      logger.error("Error rejecting application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendFollowUps = async () => {
    setIsSendingFollowUps(true);
    try {
      const result = await sendClientApplicationFollowUpReminders();

      if (result.sentIds.length) {
        const now = new Date().toISOString();
        setApplications((prev) =>
          prev.map((app) =>
            result.sentIds.includes(app.id) ? { ...app, follow_up_sent_at: now } : app
          )
        );
      }

      if (result.processed === 0) {
        toast({
          title: "No follow-ups needed",
          description: "All pending applications are still within the 3-day review window.",
        });
      } else if (result.success) {
        toast({
          title: "Follow-up emails sent",
          description: `Sent reminder emails for ${result.processed} pending application${result.processed === 1 ? "" : "s"}.`,
        });
      }

      if (!result.success && result.failures.length) {
        toast({
          title: result.processed ? "Some follow-ups failed" : "Follow-up emails failed",
          description:
            result.error ||
            `${result.failures.length} reminder${result.failures.length === 1 ? "" : "s"} could not be sent. Check logs for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error sending follow-up reminders", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending follow-ups.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFollowUps(false);
    }
  };

  const handleSendInvite = async () => {
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast({
        title: "Email required",
        description: "Enter an email address to send the invite.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingInvite(true);
    try {
      setExistingAccountInviteEmail(null);
      const response = await fetch("/api/admin/invite-career-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        if (response.status === 409) {
          setExistingAccountInviteEmail(normalizedEmail);
        }
        toast({
          title: response.status === 409 ? "User already exists" : "Invite failed",
          description:
            payload.error ??
            "Could not send invite right now. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Invite sent",
        description: `${normalizedEmail} received a Career Builder application invite.`,
      });
      setInviteEmail("");
    } catch (error) {
      logger.error("Error sending Career Builder invite", error);
      toast({
        title: "Invite failed",
        description: "Unexpected error while sending invite.",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSendExistingUserLink = async () => {
    if (!existingAccountInviteEmail) {
      return;
    }

    setIsSendingExistingUserLink(true);
    try {
      const response = await fetch("/api/admin/send-career-builder-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: existingAccountInviteEmail }),
      });

      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        toast({
          title: "Sign-in link failed",
          description: payload.error ?? "Could not send a sign-in link right now.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sign-in link sent",
        description: `${existingAccountInviteEmail} received a direct link back to /client/apply.`,
      });
      setExistingAccountInviteEmail(null);
      setInviteEmail("");
    } catch (error) {
      logger.error("Error sending existing-user Career Builder sign-in link", error);
      toast({
        title: "Sign-in link failed",
        description: "Unexpected error while sending sign-in link.",
        variant: "destructive",
      });
    } finally {
      setIsSendingExistingUserLink(false);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvHeaders = [
      "Application ID",
      "Company Name",
      "Contact Name",
      "Email",
      "Phone",
      "Industry",
      "Status",
      "Submitted Date",
      "Business Description",
      "Needs",
      "Website",
      "Admin Notes",
      "Follow Up Sent",
    ];

    const csvRows = filteredApplications.map((app) => [
      app.id,
      app.company_name,
      `${app.first_name} ${app.last_name}`,
      app.email,
      app.phone || "",
      app.industry || "",
      app.status,
      new Date(app.created_at).toLocaleDateString(),
      `"${app.business_description.replace(/"/g, '""')}"`,
      `"${app.needs_description.replace(/"/g, '""')}"`,
      app.website || "",
      app.admin_notes ? `"${app.admin_notes.replace(/"/g, '""')}"` : "",
      app.follow_up_sent_at ? new Date(app.follow_up_sent_at).toLocaleDateString() : "",
    ]);

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `career-builder-applications-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredApplications.length} applications to CSV`,
    });
  };

  return (
    <PageShell
      topPadding={false}
      fullBleed
      className="bg-gradient-to-br from-gray-900 via-black to-gray-800"
    >
      <AdminHeader user={user} />

      <div className="container mx-auto space-y-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PageHeader
          title="Career Builder Applications"
          subtitle="Manage companies applying to become Career Builders on the platform"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-2 text-sm font-medium text-white md:block">
                {pendingApplications.length} Pending
              </div>
              <div className="hidden rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-medium text-white md:block">
                {approvedApplications.length} Approved
              </div>
              <div className="hidden rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-3 py-2 text-sm font-medium text-white md:block">
                {rejectedApplications.length} Rejected
              </div>
              <Button
                onClick={handleSendFollowUps}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
                disabled={isSendingFollowUps}
              >
                <Mail className="h-4 w-4" />
                {isSendingFollowUps ? "Sending..." : "Send follow-ups"}
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          }
        />

        <SectionCard className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="vip-invite-email" className="text-gray-300">
                Invite VIP Career Builder Applicant
              </Label>
              <Input
                id="vip-invite-email"
                type="email"
                placeholder="client@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <Button
              type="button"
              onClick={handleSendInvite}
              disabled={isSendingInvite}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {isSendingInvite ? "Sending invite..." : "Send invite"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Invite links land recipients on the Career Builder application flow after auth.
          </p>
          {existingAccountInviteEmail ? (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">
                This email already belongs to an existing user.
              </p>
              <p className="mt-1 text-sm text-amber-100/80">
                Send a direct sign-in link so they can continue at <code>/client/apply</code>
                without creating a duplicate account.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleSendExistingUserLink}
                  disabled={isSendingExistingUserLink}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isSendingExistingUserLink ? "Sending sign-in link..." : "Send sign-in link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExistingAccountInviteEmail(null)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <div className="md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Pending", value: pendingApplications.length, icon: Clock },
              { label: "Approved", value: approvedApplications.length, icon: CheckCircle },
              { label: "Rejected", value: rejectedApplications.length, icon: XCircle },
            ]}
          />
        </div>

        {/* Applications Section */}
        <SectionCard paddingClassName="p-0">
          <div className="border-b border-border/40 bg-gradient-to-r from-card/40 to-card/25 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Applications</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by company, name, email, or industry..."
                    className="pl-9 w-full md:w-60 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:hidden">
                  <FiltersSheet
                    open={isFiltersOpen}
                    onOpenChange={setIsFiltersOpen}
                    activeCount={activeFilterCount}
                    title="Application Filters"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Follow-up status</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant={followUpFilter === "all" ? "default" : "outline"}
                          className={followUpFilter === "all" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setFollowUpFilter("all")}
                        >
                          All ({applications.length})
                        </Button>
                        <Button
                          type="button"
                          variant={followUpFilter === "sent" ? "default" : "outline"}
                          className={followUpFilter === "sent" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setFollowUpFilter("sent")}
                        >
                          Follow-up sent ({followUpSentCount})
                        </Button>
                        <Button
                          type="button"
                          variant={followUpFilter === "not_sent" ? "default" : "outline"}
                          className={followUpFilter === "not_sent" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setFollowUpFilter("not_sent")}
                        >
                          Follow-up not sent ({followUpNotSentCount})
                        </Button>
                      </div>
                    </div>
                  </FiltersSheet>
                </div>
                <div className="hidden md:block">
                  <Button
                    variant="outline"
                    onClick={() => setFollowUpFilter("all")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {activeFilterCount > 0 ? "Filters (1)" : "Filters"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <div className="border-b border-gray-700 px-4 sm:px-6">
              <TabsList className="h-12 bg-gray-700/50 border border-gray-600">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Pending ({pendingApplications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Approved ({approvedApplications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Rejected ({rejectedApplications.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="p-0">
              {renderApplicationsContent(
                "No Pending Applications",
                searchQuery
                  ? "Try adjusting your search query."
                  : "All Career Builder applications have been reviewed."
              )}
            </TabsContent>

            <TabsContent value="approved" className="p-0">
              {renderApplicationsContent(
                "No Approved Applications",
                "There are currently no approved Career Builder applications."
              )}
            </TabsContent>

            <TabsContent value="rejected" className="p-0">
              {renderApplicationsContent(
                "No Rejected Applications",
                "There are currently no rejected Career Builder applications."
              )}
            </TabsContent>
          </Tabs>
        </SectionCard>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Approve Career Builder Application
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Approve <strong className="text-white">{selectedApplication?.company_name}</strong> as a Career Builder. They will
              receive an email with instructions to access the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes" className="text-gray-300">Welcome Message (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add a personalized welcome message for the Career Builder..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400">
                This message will be included in the approval email
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setAdminNotes("");
              }}
              disabled={isProcessing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve & Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <XCircle className="h-5 w-5 text-red-400" />
              Reject Career Builder Application
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Reject <strong className="text-white">{selectedApplication?.company_name}</strong>&apos;s application. They will
              receive a professional decline email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes" className="text-gray-300">Feedback (Optional)</Label>
              <Textarea
                id="reject-notes"
                placeholder="Optionally provide feedback for internal tracking or to share with the applicant..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400">
                If provided, this will be included in the rejection email
              </p>
            </div>

            <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-md">
              <p className="text-sm text-yellow-300">
                ⚠️ This will send a rejection email to the applicant. This action cannot be reversed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setAdminNotes("");
              }}
              disabled={isProcessing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject & Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5" />
              Career Builder Application Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Submitted {selectedApplication && new Date(selectedApplication.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Company Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="space-y-2 bg-gray-700/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Company Name</p>
                      <p className="font-medium text-white">{selectedApplication.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Industry</p>
                      <p className="font-medium text-white">{selectedApplication.industry || "Not specified"}</p>
                    </div>
                  </div>
                  {selectedApplication.website && (
                    <div>
                      <p className="text-sm text-gray-400">Website</p>
                      <LongToken
                        as="a"
                        value={selectedApplication.website}
                        href={selectedApplication.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-400 hover:underline"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-white">Contact Information</h3>
                <div className="space-y-2 bg-gray-700/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium text-white">
                        {selectedApplication.first_name} {selectedApplication.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium text-white">{selectedApplication.email}</p>
                    </div>
                  </div>
                  {selectedApplication.phone && (
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-medium text-white">{selectedApplication.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Description */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-white">Business Description</h3>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {selectedApplication.business_description}
                  </p>
                </div>
              </div>

              {/* Talent Needs */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-white">Talent Needs</h3>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {selectedApplication.needs_description}
                  </p>
                </div>
              </div>

              {/* Application Metadata */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-white">Application Metadata</h3>
                <div className="bg-gray-700/50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between gap-4 min-w-0">
                    <span className="text-gray-400">Application ID</span>
                    <LongToken
                      as="span"
                      value={selectedApplication.id}
                      className="font-mono text-xs text-gray-300 text-right min-w-0"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Submitted</span>
                    <span className="text-gray-300">{new Date(selectedApplication.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span className="text-gray-300">{new Date(selectedApplication.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedApplication.admin_notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-white">Admin Notes</h3>
                  <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {selectedApplication.admin_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {selectedApplication.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      setIsApproveDialogOpen(true);
                    }}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Application
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      setIsRejectDialogOpen(true);
                    }}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
