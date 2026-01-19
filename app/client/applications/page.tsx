"use client";

import { FileText, Clock, MapPin, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AcceptApplicationDialog } from "@/components/client/accept-application-dialog";
import { RejectApplicationDialog } from "@/components/client/reject-application-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { createNameSlug } from "@/lib/utils/slug";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface Application {
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
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function ClientApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gigFilter, setGigFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  // Dialog states
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // HARDENING: Use hook instead of direct call - ensures browser-only execution
  // Hook throws if env vars missing (fail-fast, no zombie state)
  const supabase = useSupabase();

  const handleAcceptClick = (application: Application) => {
    setSelectedApplication(application);
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (application: Application) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    // Refresh applications
    fetchApplications();
  };

  const fetchApplications = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(
          `
          id,
          gig_id,
          talent_id,
          status,
          message,
          created_at,
          updated_at,
          gigs!inner(title, category, location, compensation),
          profiles!talent_id(display_name, email_verified, role)
        `
        )
        .eq("gigs.client_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching applications:", fetchError);
        setError("Failed to load applications");
      } else {
        const rows = (data || []) as Application[];
        const talentIds = Array.from(new Set(rows.map((a) => a.talent_id).filter(Boolean)));

        const talentProfileByUserId = new Map<string, { first_name: string; last_name: string }>();
        if (talentIds.length > 0) {
          const { data: talentProfiles } = await supabase
            .from("talent_profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", talentIds);

          (talentProfiles || []).forEach((tp) => {
            talentProfileByUserId.set(tp.user_id, {
              first_name: tp.first_name,
              last_name: tp.last_name,
            });
          });
        }

        const applicationsWithTalent = rows.map((app) => ({
          ...app,
          talent_profiles: talentProfileByUserId.get(app.talent_id) || null,
        }));

        setApplications(applicationsWithTalent);
      }
    } catch (err) {
      console.error("Error in fetchApplications:", err);
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user && supabase) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user, supabase, fetchApplications]);

  // Removed getStatusColor and getStatusIcon - now using ApplicationStatusBadge component

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.gigs?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || application.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesGig = gigFilter === "all" || application.gig_id === gigFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "new" && application.status === "new") ||
      (activeTab === "interview" && application.status === "shortlisted") ||
      (activeTab === "hired" && application.status === "accepted");

    return matchesSearch && matchesStatus && matchesGig && matchesTab;
  });

  const uniqueGigs = Array.from(new Set(applications.map((app) => app.gig_id)));

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Configuration Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="apple-glass border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Removed Users icon as it's no longer imported */}
              <div>
                <h1 className="text-2xl font-bold text-white">Applications</h1>
                <p className="text-gray-300">Review and manage talent applications for your gigs</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/client/gigs">
                {/* Removed Building icon as it's no longer imported */}
                View My Gigs
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{applications.length}</p>
                </div>
                {/* Removed Users icon as it's no longer imported */}
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

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            {/* Removed Search icon as it's no longer imported */}
            <input
              placeholder="Search by talent name, gig title, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-md px-3 py-2 border"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="under review">Under Review</option>
              <option value="interview scheduled">Interview Scheduled</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={gigFilter}
              onChange={(e) => setGigFilter(e.target.value)}
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="new">
              New ({applications.filter((app) => app.status === "new").length})
            </TabsTrigger>
            <TabsTrigger value="interview">
              Interviews (
              {applications.filter((app) => app.status === "shortlisted").length})
            </TabsTrigger>
            <TabsTrigger value="hired">
              Hired ({applications.filter((app) => app.status === "accepted").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredApplications.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  {/* Removed Users icon as it's no longer imported */}
                  <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
                  <p className="text-gray-300 mb-6">
                    {searchTerm || statusFilter !== "all" || gigFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Applications will appear here once talent applies to your gigs"}
                  </p>
                  {!searchTerm && statusFilter === "all" && gigFilter === "all" && (
                    <Button asChild>
                      <Link href="/post-gig">Post a New Gig</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Removed Avatar component as it's no longer imported */}

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {application.profiles?.display_name}
                              </h3>
                              <p className="text-gray-300">{application.gigs?.title}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-300 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {application.gigs?.location}
                                </span>
                                <span className="text-sm text-gray-300 flex items-center gap-1">
                                  {/* Removed Star icon as it's no longer imported */}
                                  {application.profiles?.role}
                                </span>
                                <span className="text-sm text-gray-300 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Applied {application.created_at}
                                </span>
                              </div>
                            </div>
                            <ApplicationStatusBadge status={application.status} showIcon={true} />
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="apple-glass border-white/30 text-white">
                              <Link href={application.talent_profiles 
                                ? `/talent/${createNameSlug(application.talent_profiles.first_name, application.talent_profiles.last_name)}`
                                : `/talent/${application.talent_id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            </Button>
                            
                            {application.status === "new" || application.status === "under_review" ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  data-test="accept-application"
                                  onClick={() => handleAcceptClick(application)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectClick(application)}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 px-3 py-2">
                                {application.status === "accepted" ? "✓ Accepted" : "✗ Rejected"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
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
