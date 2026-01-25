"use client";
/* eslint-disable react/prop-types */

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Eye,
  Building2,
  Mail,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
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

    return filtered;
  }, [applications, searchQuery, activeTab]);

  // Group by status for stats
  const pendingApplications = applications.filter((app) => app.status === "pending");
  const approvedApplications = applications.filter((app) => app.status === "approved");
  const rejectedApplications = applications.filter((app) => app.status === "rejected");

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
      <AdminHeader user={user} notificationCount={3} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="Career Builder Applications"
          subtitle="Manage companies applying to become Career Builders on the platform"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium">
                {pendingApplications.length} Pending
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
                {approvedApplications.length} Approved
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium">
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

        {/* Applications Section */}
        <SectionCard className="border-gray-700 bg-gray-800/50" paddingClassName="p-0">
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80">
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
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b border-gray-700">
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
              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Clock className="h-10 w-10 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Pending Applications</h3>
                  <p className="text-gray-400 text-lg">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "All Career Builder applications have been reviewed."}
                  </p>
                </div>
              ) : (
                <DataTableShell>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
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
                    <tbody className="divide-y divide-gray-700">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-700/50 transition-colors duration-200">
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
                          <td className="py-4 px-6">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="py-4 px-6">
                            {application.follow_up_sent_at ? (
                              <span className="text-sm text-green-300">
                                Sent {formatFollowUpDate(application.follow_up_sent_at)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Not sent</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableShell>
              )}
            </TabsContent>

            <TabsContent value="approved" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Approved Applications</h3>
                  <p className="text-gray-400 text-lg">
                    There are currently no approved Career Builder applications.
                  </p>
                </div>
              ) : (
                <DataTableShell>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
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
                    <tbody className="divide-y divide-gray-700">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-700/50 transition-colors duration-200">
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
                          <td className="py-4 px-6">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="py-4 px-6">
                            {application.follow_up_sent_at ? (
                              <span className="text-sm text-green-300">
                                Sent {formatFollowUpDate(application.follow_up_sent_at)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Not sent</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableShell>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <XCircle className="h-10 w-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Rejected Applications</h3>
                  <p className="text-gray-400 text-lg">
                    There are currently no rejected Career Builder applications.
                  </p>
                </div>
              ) : (
                <DataTableShell>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
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
                    <tbody className="divide-y divide-gray-700">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-700/50 transition-colors duration-200">
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
                          <td className="py-4 px-6">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="py-4 px-6">
                            {application.follow_up_sent_at ? (
                              <span className="text-sm text-green-300">
                                Sent {formatFollowUpDate(application.follow_up_sent_at)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Not sent</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableShell>
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
