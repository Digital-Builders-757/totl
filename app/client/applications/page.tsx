"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Star,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: string;
  created_at: string;
  talent?: {
    first_name: string;
    last_name: string;
    email: string;
    location?: string;
    experience?: string;
    portfolio_url?: string;
  };
  gig?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
}

export default function ClientApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gigFilter, setGigFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createClientComponentClient() : null;

  // Mock data for demonstration
  const mockApplications: Application[] = [
    {
      id: "1",
      gig_id: "1",
      talent_id: "talent-1",
      status: "Under Review",
      created_at: "2025-07-22",
      talent: {
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sarah.johnson@email.com",
        location: "New York",
        experience: "5 years",
        portfolio_url: "https://sarahjohnson.com",
      },
      gig: {
        title: "Summer Fashion Editorial",
        category: "Editorial",
        location: "New York",
        compensation: "$800",
      },
    },
    {
      id: "2",
      gig_id: "2",
      talent_id: "talent-2",
      status: "Interview Scheduled",
      created_at: "2025-07-21",
      talent: {
        first_name: "Michael",
        last_name: "Chen",
        email: "michael.chen@email.com",
        location: "Los Angeles",
        experience: "3 years",
        portfolio_url: "https://michaelchen.com",
      },
      gig: {
        title: "Sportswear Campaign",
        category: "Commercial",
        location: "Los Angeles",
        compensation: "$1,200",
      },
    },
    {
      id: "3",
      gig_id: "3",
      talent_id: "talent-3",
      status: "Hired",
      created_at: "2025-07-20",
      talent: {
        first_name: "Emma",
        last_name: "Rodriguez",
        email: "emma.rodriguez@email.com",
        location: "Miami",
        experience: "7 years",
        portfolio_url: "https://emmarodriguez.com",
      },
      gig: {
        title: "Beauty Product Launch",
        category: "Beauty",
        location: "Miami",
        compensation: "$1,500",
      },
    },
    {
      id: "4",
      gig_id: "1",
      talent_id: "talent-4",
      status: "Rejected",
      created_at: "2025-07-19",
      talent: {
        first_name: "Alex",
        last_name: "Thompson",
        email: "alex.thompson@email.com",
        location: "Chicago",
        experience: "2 years",
        portfolio_url: "https://alexthompson.com",
      },
      gig: {
        title: "Summer Fashion Editorial",
        category: "Editorial",
        location: "New York",
        compensation: "$800",
      },
    },
  ];

  useEffect(() => {
    if (user && supabase) {
      fetchApplications();
    } else if (!isSupabaseConfigured) {
      setSupabaseError("Supabase is not configured. Please check your environment variables.");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured]);

  const fetchApplications = async () => {
    if (!supabase || !user) return;

    try {
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(
          `
          *,
          gigs!inner(client_id),
          talent_profiles(first_name, last_name, location, experience, portfolio_url)
        `
        )
        .eq("gigs.client_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        // Use mock data for now
        setApplications(mockApplications);
      } else {
        setApplications(applicationsData || mockApplications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setSupabaseError("Failed to load applications. Please try again.");
      // Use mock data for now
      setApplications(mockApplications);
    } finally {
      setLoading(false);
    }
  };

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
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case "hired":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "withdrawn":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.talent?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.talent?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.gig?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.talent?.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || application.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesGig = gigFilter === "all" || application.gig_id === gigFilter;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && application.status === "Under Review") ||
      (activeTab === "interview" && application.status === "Interview Scheduled") ||
      (activeTab === "hired" && application.status === "Hired");

    return matchesSearch && matchesStatus && matchesGig && matchesTab;
  });

  const uniqueGigs = Array.from(new Set(applications.map((app) => app.gig_id)));

  // Show error state if Supabase is not configured
  if (supabaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{supabaseError}</p>
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
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                <p className="text-gray-600">Review and manage talent applications for your gigs</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/client/gigs">
                <Building className="h-4 w-4 mr-2" />
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
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
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
                  <Calendar className="h-4 w-4 text-purple-600" />
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
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
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
                const gig = applications.find((app) => app.gig_id === gigId)?.gig;
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
            <TabsTrigger value="pending">
              Pending ({applications.filter((app) => app.status === "Under Review").length})
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
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={`/images/model-${Math.floor(Math.random() * 3) + 1}.png`}
                            alt={`${application.talent?.first_name} ${application.talent?.last_name}`}
                          />
                          <AvatarFallback className="text-lg">
                            {application.talent?.first_name?.[0]}
                            {application.talent?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.talent?.first_name} {application.talent?.last_name}
                              </h3>
                              <p className="text-gray-600">{application.gig?.title}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {application.talent?.location}
                                </span>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {application.talent?.experience}
                                </span>
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
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
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                            {application.talent?.portfolio_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={application.talent.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Portfolio
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
