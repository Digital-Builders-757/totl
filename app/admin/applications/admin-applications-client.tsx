"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Building,
  Settings,
  LogOut,
  Bell,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { approveClientApplication, rejectClientApplication } from "@/lib/actions/client-actions";
import type { Database } from "@/types/database";

type ClientApplication = Database["public"]["Tables"]["client_applications"]["Row"];

interface AdminApplicationsClientProps {
  applications: ClientApplication[];
  user: User;
}

export function AdminApplicationsClient({
  applications: initialApplications,
  user,
}: AdminApplicationsClientProps) {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<ClientApplication[]>(initialApplications);
  const [filteredApplications, setFilteredApplications] = useState<ClientApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ClientApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Filter applications based on search query and active tab
  useEffect(() => {
    if (!applications.length) {
      setFilteredApplications([]);
      return;
    }

    let filtered = applications;

    // Filter by status based on active tab
    filtered = filtered.filter((app) => {
      if (activeTab === "pending") return app.status === "pending";
      if (activeTab === "approved") return app.status === "approved";
      if (activeTab === "rejected") return app.status === "rejected";
      return true;
    });

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.first_name.toLowerCase().includes(query) ||
          app.last_name.toLowerCase().includes(query) ||
          app.company_name.toLowerCase().includes(query) ||
          app.email.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchQuery, activeTab]);

  const handleApprove = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      const result = await approveClientApplication(selectedApplication.id, adminNotes);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // Update the local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: "approved", admin_notes: adminNotes }
              : app
          )
        );

        toast({
          title: "Application Approved",
          description: "The client application has been approved successfully.",
        });
      }
    } catch (error) {
      console.error("Error approving application:", error);
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
      const result = await rejectClientApplication(selectedApplication.id, adminNotes);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // Update the local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: "rejected", admin_notes: adminNotes }
              : app
          )
        );

        toast({
          title: "Application Rejected",
          description: "The client application has been rejected.",
        });
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
                <SafeImage
                  src="/images/totl-logo-transparent.png"
                  alt="TOTL Agency"
                  width={100}
                  height={40}
                  placeholderQuery="agency logo"
                  className="brightness-100"
                />
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-black">
                  Dashboard
                </Link>
                <Link href="/admin/applications" className="text-black font-medium">
                  Applications
                </Link>
                <Link href="/admin/talent" className="text-gray-600 hover:text-black">
                  Talent
                </Link>
                <Link href="/admin/gigs" className="text-gray-600 hover:text-black">
                  Gigs
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-black relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm font-medium text-gray-700 hover:text-black">
                    <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                      <UserIcon size={16} />
                    </div>
                    <span className="hidden md:inline">Admin</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Client Applications</h1>
            <p className="text-gray-600">Review and manage client applications</p>
          </div>
        </div>

        {/* Applications Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-xl font-bold">Applications</h2>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search applications"
                    className="pl-9 w-full md:w-60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b border-gray-100">
              <TabsList className="h-12">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Approved
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Rejected
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Pending Applications</h3>
                  <p className="text-gray-500">
                    There are currently no pending client applications to review.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Company
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Contact
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Industry
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Applied Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 mr-3 flex items-center justify-center">
                                <Building className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {application.company_name}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {application.website ? (
                                    <a
                                      href={application.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      Website
                                    </a>
                                  ) : (
                                    "No website"
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium">
                              {application.first_name} {application.last_name}
                            </div>
                            <div className="text-gray-500 text-sm">{application.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="capitalize">
                              {application.industry || "Not specified"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              className={`${
                                application.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : application.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {application.status.charAt(0).toUpperCase() +
                                application.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // View application details
                                    setSelectedApplication(application);
                                    // In a real app, you might navigate to a details page or show a modal
                                  }}
                                >
                                  <Search className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Approved Applications</h3>
                  <p className="text-gray-500">
                    There are currently no approved client applications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Company
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Contact
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Industry
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Applied Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 mr-3 flex items-center justify-center">
                                <Building className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {application.company_name}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {application.website ? (
                                    <a
                                      href={application.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      Website
                                    </a>
                                  ) : (
                                    "No website"
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium">
                              {application.first_name} {application.last_name}
                            </div>
                            <div className="text-gray-500 text-sm">{application.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="capitalize">
                              {application.industry || "Not specified"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Rejected Applications</h3>
                  <p className="text-gray-500">
                    There are currently no rejected client applications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Company
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Contact
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Industry
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Applied Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 mr-3 flex items-center justify-center">
                                <Building className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {application.company_name}
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {application.website ? (
                                    <a
                                      href={application.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      Website
                                    </a>
                                  ) : (
                                    "No website"
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium">
                              {application.first_name} {application.last_name}
                            </div>
                            <div className="text-gray-500 text-sm">{application.email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="capitalize">
                              {application.industry || "Not specified"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Client Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this client application? This will send an email to
              the client with instructions to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes about this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Client Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this client application? This will send an email to
              the client notifying them of the rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
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
    </div>
  );
}
