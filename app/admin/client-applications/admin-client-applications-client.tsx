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
  Phone,
  Globe,
  Briefcase,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { approveClientApplication, rejectClientApplication } from "@/lib/actions/client-actions";
import { Database } from "@/types/supabase";

type ClientApplication = Database["public"]["Tables"]["client_applications"]["Row"];

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
  const [selectedApplication, setSelectedApplication] = useState<ClientApplication | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Filter applications by status and search
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.industry && app.industry.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [applications, searchQuery]);

  // Group by status
  const pendingApplications = filteredApplications.filter((app) => app.status === "pending");
  const approvedApplications = filteredApplications.filter((app) => app.status === "approved");
  const rejectedApplications = filteredApplications.filter((app) => app.status === "rejected");

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
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
        toast({
          title: "Application Approved",
          description: `${selectedApplication.company_name} has been approved. Approval email sent.`,
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
      console.error("Error approving application:", error);
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
        toast({
          title: "Application Rejected",
          description: `${selectedApplication.company_name} has been rejected. Notification email sent.`,
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
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
    ]);

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `client-applications-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredApplications.length} applications to CSV`,
    });
  };

  // Application card component
  const ApplicationCard = ({ application }: { application: ClientApplication }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">{application.company_name}</h3>
            </div>
            <p className="text-gray-600 text-sm">
              {application.first_name} {application.last_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedApplication(application);
                    setIsDetailsDialogOpen(true);
                  }}
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
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedApplication(application);
                        setAdminNotes("");
                        setIsRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            {application.email}
          </div>
          {application.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {application.phone}
            </div>
          )}
          {application.industry && (
            <div className="flex items-center text-gray-600">
              <Briefcase className="h-4 w-4 mr-2" />
              {application.industry}
            </div>
          )}
          {application.website && (
            <div className="flex items-center text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {application.website}
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
          <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
          <span>ID: {application.id.slice(0, 8)}...</span>
        </div>

        {application.admin_notes && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="font-semibold text-blue-800 mb-1">Admin Notes:</p>
            <p className="text-blue-700">{application.admin_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Applications</h1>
              <p className="text-gray-600 mt-1">
                Manage businesses applying to become clients on the platform
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company, name, email, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-600">
                  Pending: <strong>{pendingApplications.length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">
                  Approved: <strong>{approvedApplications.length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">
                  Rejected: <strong>{rejectedApplications.length}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="all">All ({filteredApplications.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* All Applications */}
          <TabsContent value="all" className="mt-6">
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Applications Found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No client applications have been submitted yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Applications */}
          <TabsContent value="pending" className="mt-6">
            {pendingApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Pending Applications
                  </h3>
                  <p className="text-gray-600">All applications have been reviewed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Approved Applications */}
          <TabsContent value="approved" className="mt-6">
            {approvedApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Approved Applications
                  </h3>
                  <p className="text-gray-600">No applications have been approved yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvedApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rejected Applications */}
          <TabsContent value="rejected" className="mt-6">
            {rejectedApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Rejected Applications
                  </h3>
                  <p className="text-gray-600">No applications have been rejected</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rejectedApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Client Application
            </DialogTitle>
            <DialogDescription>
              Approve <strong>{selectedApplication?.company_name}</strong> as a client. They will
              receive an email with instructions to access the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Welcome Message (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add a personalized welcome message for the client..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
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
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing} className="gap-2">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Client Application
            </DialogTitle>
            <DialogDescription>
              Reject <strong>{selectedApplication?.company_name}</strong>'s application. They will
              receive a professional decline email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Feedback (Optional)</Label>
              <Textarea
                id="reject-notes"
                placeholder="Optionally provide feedback for internal tracking or to share with the applicant..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                If provided, this will be included in the rejection email
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This will send a rejection email to the applicant. This action can be reversed
                later if needed.
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Client Application Details
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedApplication && new Date(selectedApplication.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Company Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Company Name</p>
                      <p className="font-medium">{selectedApplication.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Industry</p>
                      <p className="font-medium">{selectedApplication.industry || "Not specified"}</p>
                    </div>
                  </div>
                  {selectedApplication.website && (
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <a
                        href={selectedApplication.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {selectedApplication.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">
                        {selectedApplication.first_name} {selectedApplication.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                  </div>
                  {selectedApplication.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Description */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Business Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedApplication.business_description}
                  </p>
                </div>
              </div>

              {/* Client Needs */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Talent Needs</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedApplication.needs_description}
                  </p>
                </div>
              </div>

              {/* Application Metadata */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Application Metadata</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Application ID</span>
                    <span className="font-mono text-xs">{selectedApplication.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted</span>
                    <span>{new Date(selectedApplication.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span>{new Date(selectedApplication.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedApplication.admin_notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Admin Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.admin_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {selectedApplication.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      setIsApproveDialogOpen(true);
                    }}
                    className="flex-1 gap-2"
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
    </div>
  );
}

