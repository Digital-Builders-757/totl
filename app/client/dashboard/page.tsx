"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MoreVertical,
  Users,
  TrendingUp,
  Star,
  Eye,
  Heart,
  Camera,
  Award,
  Target,
  Activity,
  Bell,
  Settings,
  LogOut,
  Plus,
  Filter,
  Search,
  User,
  Phone,
  Globe,
  AlertCircle,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserCheck,
  Briefcase,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface ClientProfile {
  id?: string;
  user_id?: string;
  company_name: string;
  industry?: string | null;
  website?: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  company_size?: string | null;
}

interface Profile {
  id: string;
  role: string;
  display_name: string;
  email_verified: boolean;
}

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
  };
}

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  status?: string;
  image_url?: string;
  created_at: string;
  applications_count?: number;
}

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createClientComponentClient() : null;

  // Mock data for demonstration
  const dashboardStats = {
    totalGigs: 8,
    activeGigs: 5,
    totalApplications: 47,
    pendingApplications: 12,
    completedGigs: 3,
    totalSpent: 8500,
  };

  const recentGigs = [
    {
      id: "1",
      title: "Summer Fashion Editorial",
      category: "Editorial",
      location: "New York",
      compensation: "$800",
      status: "Active",
      applications_count: 8,
      created_at: "2025-07-20",
      image_url: "/gig-editorial.png",
    },
    {
      id: "2",
      title: "Sportswear Campaign",
      category: "Commercial",
      location: "Los Angeles",
      compensation: "$1,200",
      status: "Active",
      applications_count: 12,
      created_at: "2025-07-18",
      image_url: "/gig-sportswear.png",
    },
    {
      id: "3",
      title: "Beauty Product Launch",
      category: "Beauty",
      location: "Miami",
      compensation: "$1,500",
      status: "Completed",
      applications_count: 15,
      created_at: "2025-07-15",
      image_url: "/gig-beauty.png",
    },
  ];

  const recentApplications = [
    {
      id: "1",
      gigTitle: "Summer Fashion Editorial",
      talentName: "Sarah Johnson",
      appliedDate: "2025-07-22",
      status: "Under Review",
      location: "New York",
      experience: "5 years",
      image: "/images/model-1.png",
    },
    {
      id: "2",
      gigTitle: "Sportswear Campaign",
      talentName: "Michael Chen",
      appliedDate: "2025-07-21",
      status: "Interview Scheduled",
      location: "Los Angeles",
      experience: "3 years",
      image: "/images/model-2.png",
    },
    {
      id: "3",
      gigTitle: "Beauty Product Launch",
      talentName: "Emma Rodriguez",
      appliedDate: "2025-07-20",
      status: "Hired",
      location: "Miami",
      experience: "7 years",
      image: "/images/model-3.png",
    },
  ];

  const upcomingDeadlines = [
    {
      id: "1",
      title: "Summer Fashion Editorial",
      deadline: "2025-07-25",
      applications: 8,
      status: "Urgent",
    },
    {
      id: "2",
      title: "Sportswear Campaign",
      deadline: "2025-07-28",
      applications: 12,
      status: "Active",
    },
    {
      id: "3",
      title: "Beauty Product Launch",
      deadline: "2025-08-01",
      applications: 15,
      status: "Active",
    },
  ];

  useEffect(() => {
    if (user && supabase) {
      fetchDashboardData();
    } else if (!isSupabaseConfigured) {
      setSupabaseError("Supabase is not configured. Please check your environment variables.");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured]);

  const fetchDashboardData = async () => {
    if (!supabase || !user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      setProfile(profileData);

      // Fetch client profile
      const { data: clientProfileData, error: clientProfileError } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (clientProfileError) {
        console.error("Error fetching client profile:", clientProfileError);
      } else {
        setClientProfile(clientProfileData);
      }

      // Fetch client's gigs
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (gigsError) {
        console.error("Error fetching gigs:", gigsError);
      } else {
        setGigs(gigsData || []);
      }

      // Fetch applications for client's gigs
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select(
          `
          *,
          gigs!inner(client_id),
          talent_profiles(first_name, last_name, location)
        `
        )
        .eq("gigs.client_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
      } else {
        setApplications(applicationsData || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setSupabaseError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "under review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "interview scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "hired":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "editorial":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "commercial":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "runway":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "beauty":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "fitness":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const needsProfileCompletion = !clientProfile?.company_name || !clientProfile?.contact_name;

  // Show error state if Supabase is not configured
  if (supabaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access your client dashboard.
          </p>
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
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
              <Avatar className="h-12 w-12">
                <AvatarImage src="/images/agency-team.png" alt="Company" />
                <AvatarFallback>{clientProfile?.company_name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {clientProfile?.contact_name || "Client"}!
                </h1>
                <p className="text-gray-600">
                  {clientProfile?.company_name || "Manage your gigs and applications"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Completion Alert */}
        {needsProfileCompletion && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-orange-900">Complete Your Profile</h3>
                  <p className="text-sm text-orange-700">
                    Add your company information to get the most out of the platform.
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/client/profile">Complete Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalGigs}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Gigs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeGigs}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.totalApplications}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.pendingApplications}
                  </p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedGigs}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dashboardStats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gigs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              My Gigs
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Gig
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Gigs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Recent Gigs
                  </CardTitle>
                  <CardDescription>Your latest gig postings and their status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentGigs.map((gig) => (
                    <div key={gig.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <SafeImage
                        src={gig.image_url}
                        alt={gig.title}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                        fallbackSrc="/images/totl-logo-transparent.png"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{gig.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getCategoryColor(gig.category)}>
                            {gig.category}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(gig.status)}>
                            {gig.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {gig.applications_count} applications • {gig.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{gig.compensation}</p>
                        <p className="text-sm text-gray-600">{gig.created_at}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client/gigs">View All Gigs</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Latest talent applications to review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={application.image} alt={application.talentName} />
                        <AvatarFallback>
                          {application.talentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{application.talentName}</h4>
                        <p className="text-sm text-gray-600 truncate">{application.gigTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                          <span className="text-sm text-gray-600">{application.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{application.appliedDate}</p>
                        <p className="text-xs text-gray-500">{application.experience}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client/applications">View All Applications</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>Gigs with approaching application deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                          <p className="text-sm text-gray-600">
                            {deadline.applications} applications received
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">Due {deadline.deadline}</p>
                        <Badge variant="outline" className={getStatusColor(deadline.status)}>
                          {deadline.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Gigs Tab */}
          <TabsContent value="gigs" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Gigs</h2>
                <p className="text-gray-600">Manage your posted gigs and track their performance</p>
              </div>
              <Button asChild>
                <Link href="/post-gig">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Gig
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentGigs.map((gig) => (
                <Card key={gig.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{gig.title}</CardTitle>
                        <CardDescription className="mt-1">{gig.location}</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SafeImage
                      src={gig.image_url}
                      alt={gig.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                      fallbackSrc="/images/totl-logo-transparent.png"
                    />

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getCategoryColor(gig.category)}>
                        {gig.category}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(gig.status)}>
                        {gig.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Compensation:</span>
                        <span className="font-medium">{gig.compensation}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Applications:</span>
                        <span className="font-medium">{gig.applications_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Posted:</span>
                        <span className="font-medium">{gig.created_at}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="h-4 w-4 mr-2" />
                        Applications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
                <p className="text-gray-600">Review and manage talent applications for your gigs</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {recentApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={application.image} alt={application.talentName} />
                        <AvatarFallback className="text-lg">
                          {application.talentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.talentName}
                            </h3>
                            <p className="text-gray-600">{application.gigTitle}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-600">
                                <MapPin className="h-4 w-4 inline mr-1" />
                                {application.location}
                              </span>
                              <span className="text-sm text-gray-600">
                                <Clock className="h-4 w-4 inline mr-1" />
                                {application.experience}
                              </span>
                              <span className="text-sm text-gray-600">
                                Applied {application.appliedDate}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Create Gig Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Plus className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Next Gig</h2>
              <p className="text-gray-600 mb-8">
                Post a new casting call or gig to find the perfect talent for your project. Our
                platform connects you with qualified models, actors, and performers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center p-6">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Easy Setup</h3>
                  <p className="text-sm text-gray-600">
                    Fill out a simple form with your project details
                  </p>
                </Card>

                <Card className="text-center p-6">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Applications</h3>
                  <p className="text-sm text-gray-600">
                    Receive applications from qualified talent
                  </p>
                </Card>

                <Card className="text-center p-6">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Hiring</h3>
                  <p className="text-sm text-gray-600">
                    Review profiles and hire the perfect match
                  </p>
                </Card>
              </div>

              <Button size="lg" asChild>
                <Link href="/post-gig">
                  <Plus className="h-5 w-5 mr-2" />
                  Start Creating Gig
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
