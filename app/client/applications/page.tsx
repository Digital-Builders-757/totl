"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FileText, Clock, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: string;
  message?: string;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  profiles?: {
    display_name: string;
    email_verified: boolean;
    role: string;
  };
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

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createClientComponentClient() : null;

  const fetchApplications = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(
          `
          *,
          gigs!inner(client_id),
          profiles!talent_id(display_name, email_verified, role)
        `
        )
        .eq("gigs.client_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching applications:", fetchError);
        setError("Failed to load applications");
      } else {
        setApplications(data || []);
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
    } else if (!isSupabaseConfigured) {
      setError("Supabase is not configured");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured, fetchApplications]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "under review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "interview scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "hired":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "under review":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "interview scheduled":
        return <Clock className="h-4 w-4 text-purple-600" />;
      case "hired":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <DollarSign className="h-4 w-4 text-red-600" />;
      case "withdrawn":
        return <DollarSign className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

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
      (activeTab === "interview" && application.status === "Interview Scheduled") ||
      (activeTab === "hired" && application.status === "Hired");

    return matchesSearch && matchesStatus && matchesGig && matchesTab;
  });

  const uniqueGigs = Array.from(new Set(applications.map((app) => app.gig_id)));

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Removed Users icon as it's no longer imported */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                <p className="text-gray-600">Review and manage talent applications for your gigs</p>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                </div>
                {/* Removed Users icon as it's no longer imported */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Under Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter((app) => app.status === "Under Review").length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter((app) => app.status === "Interview Scheduled").length}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hired</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.filter((app) => app.status === "Hired").length}
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-600" />
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
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {applications.filter((app) => app.status === "Interview Scheduled").length})
            </TabsTrigger>
            <TabsTrigger value="hired">
              Hired ({applications.filter((app) => app.status === "Hired").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  {/* Removed Users icon as it's no longer imported */}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600 mb-6">
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
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Removed Avatar component as it's no longer imported */}

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.profiles?.display_name}
                              </h3>
                              <p className="text-gray-600">{application.gigs?.title}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {application.gigs?.location}
                                </span>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  {/* Removed Star icon as it's no longer imported */}
                                  {application.profiles?.role}
                                </span>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Applied {application.created_at}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(application.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(application.status)}
                                {application.status}
                              </div>
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/talent/${application.talent_id}`}>
                                {/* Removed Eye icon as it's no longer imported */}
                                View Profile
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              {/* Removed Phone icon as it's no longer imported */}
                              Contact
                            </Button>
                            <Button variant="outline" size="sm">
                              {/* Removed Mail icon as it's no longer imported */}
                              Email
                            </Button>
                            {application.profiles?.email_verified && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`/talent/${application.talent_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Profile
                                </a>
                              </Button>
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
    </div>
  );
}
