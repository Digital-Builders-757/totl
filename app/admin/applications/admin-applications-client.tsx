"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Settings,
  LogOut,
  Bell,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

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
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

// Type for the joined application data
type ApplicationWithDetails = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs: null;
  talent: null;
};

interface AdminApplicationsClientProps {
  applications: ApplicationWithDetails[];
  user: User;
}

export function AdminApplicationsClient({
  applications: initialApplications,
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

  const { toast } = useToast();
  const supabase = createSupabaseBrowser();

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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.gig_id.toLowerCase().includes(query) ||
          app.talent_id.toLowerCase().includes(query) ||
          app.status.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchQuery, activeTab]);

  const handleApprove = async () => {
    if (!selectedApplication || !supabase) return;

    setIsProcessing(true);
    try {
      // Update application status to accepted
      const { error } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", selectedApplication.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
    if (!selectedApplication || !supabase) return;

    setIsProcessing(true);
    try {
      // Update application status to rejected
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", selectedApplication.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
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
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen">
      {/* Admin Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-30">
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
                <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Dashboard
                </Link>
                <Link href="/admin/applications" className="text-white font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Applications
                </Link>
                <Link href="/admin/talent" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Talent
                </Link>
                <Link href="/admin/gigs" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Gigs
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white relative transition-colors duration-200">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  3
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2 flex items-center justify-center">
                      <UserIcon size={16} className="text-white" />
                    </div>
                    <span className="hidden md:inline">Admin</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-700">
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Talent Applications
            </h1>
            <p className="text-gray-400 text-lg">Review and manage talent applications for gigs</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
              {applications.filter(app => app.status === 'new').length} New
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium">
              {applications.filter(app => app.status === 'accepted').length} Approved
            </div>
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium">
              {applications.filter(app => app.status === 'rejected').length} Rejected
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden mb-8">
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
                    placeholder="Search applications"
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

          <Tabs defaultValue="new" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b border-gray-700">
              <TabsList className="h-12 bg-gray-700/50 border border-gray-600">
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  New ({applications.filter(app => app.status === 'new').length})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Approved ({applications.filter(app => app.status === 'accepted').length})
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Rejected ({applications.filter(app => app.status === 'rejected').length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new" className="p-0">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Clock className="h-10 w-10 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No New Applications</h3>
                  <p className="text-gray-400 text-lg">
                    There are currently no new talent applications to review.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Application ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Gig ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Talent ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Applied Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Status
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
                            <div className="font-medium text-white text-sm">{application.id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{application.gig_id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{application.talent_id.slice(0, 8)}...</div>
                          </td>
                          <td className="py-4 px-6 text-gray-400">
                            {new Date(application.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              className={`${
                                application.status === "new"
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                                  : application.status === "accepted"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                    : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                              }`}
                            >
                              {application.status.charAt(0).toUpperCase() +
                                application.status.slice(1)}
                            </Badge>
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
                                    setShowApproveDialog(true);
                                  }}
                                  className="text-gray-300 hover:bg-gray-700"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setShowRejectDialog(true);
                                  }}
                                  className="text-gray-300 hover:bg-gray-700"
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-400" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // View application details
                                    setSelectedApplication(application);
                                    // In a real app, you might navigate to a details page or show a modal
                                  }}
                                  className="text-gray-300 hover:bg-gray-700"
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
                    There are currently no approved talent applications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Application ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Gig ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Talent ID
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
                            <div className="font-medium text-gray-900">{application.id}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{application.gig_id}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{application.talent_id}</div>
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
                    There are currently no rejected talent applications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Application ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Gig ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Talent ID
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
                            <div className="font-medium text-gray-900">{application.id}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{application.gig_id}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{application.talent_id}</div>
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
            <DialogTitle>Approve Talent Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this talent application? This will notify the talent
              and client.
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
            <DialogTitle>Reject Talent Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this talent application? This will notify the talent.
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
