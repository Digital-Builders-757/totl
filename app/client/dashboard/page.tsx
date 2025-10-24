"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MoreVertical,
  Users,
  FileText,
  CheckCircle,
  Clock as ClockIcon,
  UserCheck,
  Briefcase,
  BarChart3,
  AlertCircle,
  Plus,
  User,
  Bell,
  Settings,
  LogOut,
  Activity,
  Eye,
  Filter,
  Search,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileCompletionBanner } from "@/components/ui/profile-completion-banner";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import { logEmptyState, logFallbackUsage } from "@/lib/utils/error-logger";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface ClientProfile {
  id?: string;
  user_id?: string;
  company_name: string;
  industry?: string | null;
  website?: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone?: string | null;
  company_size?: string | null;
}

interface Application {
  id: string;
  gig_id: string;
  talent_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
    location: string | null;
    experience: string | null;
  };
  profiles?: {
    display_name: string | null;
    email_verified: boolean;
    role: string;
    avatar_url: string | null;
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
  image_url?: string | null;
  created_at: string;
  applications_count?: number;
  application_deadline?: string | null;
}

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [userProfile, setUserProfile] = useState<{
    avatar_url?: string | null;
    display_name?: string | null;
  } | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createSupabaseBrowser() : null;

  // Calculate dashboard stats from real data
  const dashboardStats = {
    totalGigs: gigs.length,
    activeGigs: gigs.filter((gig) => gig.status === "active").length,
    totalApplications: applications.length,
    newApplications: applications.filter(
      (app) => app.status === "new" || app.status === "under_review"
    ).length,
    completedGigs: gigs.filter((gig) => gig.status === "completed").length,
    totalSpent: 0, // This would need to be calculated from bookings/payments
  };

  // Get upcoming deadlines (gigs with deadlines in the next 30 days)
  const upcomingDeadlines = gigs
    .filter((gig) => gig.status === "active" && gig.application_deadline)
    .filter((gig) => {
      if (!gig.application_deadline) return false;
      const deadline = new Date(gig.application_deadline);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return deadline <= thirtyDaysFromNow;
    })
    .slice(0, 5);

  const fetchDashboardData = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      // Fetch user profile with avatar
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, avatar_path, display_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (profileData) {
        setUserProfile(profileData);
      }

      // Fetch client profile
      const { data: clientProfileData, error: clientProfileError } = await supabase
        .from("client_profiles")
        .select(`
          id,
          user_id,
          company_name,
          industry,
          website,
          contact_name,
          contact_email,
          contact_phone,
          company_size,
          created_at,
          updated_at
        `)
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
        .select(`
          id,
          client_id,
          title,
          description,
          category,
          location,
          compensation,
          status,
          application_deadline,
          created_at,
          updated_at
        `)
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
          gigs!inner(title, category, location, compensation),
          talent_profiles!talent_id(first_name, last_name, location, experience),
          profiles!talent_id(display_name, email_verified, role, avatar_url)
        `
        )
        .eq("gigs.client_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
      } else {
        setApplications((applicationsData as Application[]) || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setSupabaseError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user && supabase) {
      fetchDashboardData();
    } else if (!isSupabaseConfigured) {
      setSupabaseError("Supabase is not configured. Please check your environment variables.");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured, fetchDashboardData]);

  // Check for incomplete profile
  const missingFields = [];
  if (!clientProfile?.company_name) missingFields.push("Company Name");
  if (!clientProfile?.contact_name) missingFields.push("Contact Name");
  if (!clientProfile?.contact_email) missingFields.push("Contact Email");

  // Log empty states for analytics
  useEffect(() => {
    if (!loading && user) {
      if (applications.length === 0) {
        logEmptyState("client_applications", user.id);
      }
      if (gigs.length === 0) {
        logEmptyState("client_gigs", user.id);
      }
    }
  }, [applications.length, gigs.length, loading, user]);

  // Log fallback usage
  useEffect(() => {
    if (applications.length > 0 && user) {
      applications.forEach((app) => {
        if (!app.talent_profiles?.first_name && app.profiles?.display_name) {
          logFallbackUsage("display_name", "talent_name", user.id);
        }
        if (!app.talent_profiles?.location) {
          logFallbackUsage("location", "talent_location", user.id);
        }
        if (!app.talent_profiles?.experience) {
          logFallbackUsage("experience", "talent_experience", user.id);
        }
      });
    }
  }, [applications, user]);

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string | undefined) => {
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
      case "e-commerce":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

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
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Subtle gradient background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
        
        <div className="text-center max-w-md mx-auto p-8 relative z-10">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-white/5 p-8 backdrop-blur-sm">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-gray-600 via-white to-gray-600 mb-6" />
            
            <User className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Welcome Back</h2>
            <p className="text-gray-400 mb-6 text-lg">
              You need to be logged in to access your client dashboard.
            </p>
            <Button asChild className="bg-white text-black hover:bg-gray-200 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
              <Link href="/login">Sign In to Continue</Link>
            </Button>
            
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-500 mb-3">New to TOTL?</p>
              <Link 
                href="/client/apply" 
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
              >
                Apply to become a client →
              </Link>
            </div>
          </div>
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
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={userProfile?.avatar_url || "/images/totl-logo.png"}
                  alt="Company"
                />
                <AvatarFallback>{clientProfile?.company_name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {clientProfile?.contact_name || "Client"}!
                </h1>
                <p className="text-gray-300">
                  {clientProfile?.company_name || "Manage your gigs and applications"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="apple-glass border-white/30 text-white">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" asChild className="apple-glass border-white/30 text-white">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut} className="apple-glass border-white/30 text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completion Banner */}
        <ProfileCompletionBanner
          userRole="client"
          missingFields={missingFields}
          profileUrl="/client/profile"
        />

        {/* Welcome Section */}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Gigs</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalGigs}</p>
                </div>
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <Briefcase className="h-4 w-4 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Active Gigs</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.activeGigs}</p>
                </div>
                <div className="bg-green-500/20 p-2 rounded-full">
                  <Activity className="h-4 w-4 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Applications</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardStats.totalApplications}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">New</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardStats.newApplications}
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <ClockIcon className="h-4 w-4 text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.completedGigs}</p>
                </div>
                <div className="bg-green-500/20 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Spent</p>
                  <p className="text-2xl font-bold text-white">
                    ${dashboardStats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-emerald-300" />
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
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Briefcase className="h-5 w-5 text-white" />
                    Recent Gigs
                  </CardTitle>
                  <CardDescription className="text-gray-400">Your latest gig postings and their status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gigs.length > 0 ? (
                    gigs.slice(0, 3).map((gig) => (
                      <div key={gig.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-700">
                        <SafeImage
                          src={gig.image_url || "/images/totl-logo.png"}
                          alt={gig.title}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                          fallbackSrc="/images/totl-logo-transparent.png"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{gig.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getCategoryColor(gig.category)}>
                              {gig.category}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(gig.status)}>
                              {gig.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {gig.applications_count || 0} applications â€¢ {gig.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{gig.compensation}</p>
                          <p className="text-sm text-gray-400">{gig.created_at}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No gigs posted yet"
                      description="Start by creating your first gig to attract talent"
                      action={{
                        label: "Post Your First Gig",
                        href: "/post-gig",
                      }}
                    />
                  )}
                  <Button variant="outline" className="w-full apple-glass border-white/30 text-white" asChild>
                    <Link href="/client/gigs">View All Gigs</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-white" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription className="text-gray-400">Latest talent applications to review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {applications.length > 0 ? (
                    applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-700">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              application.profiles?.avatar_url ||
                              "/images/totl-logo-transparent.png"
                            }
                            alt={`${application.talent_profiles?.first_name || "Talent"} ${application.talent_profiles?.last_name || ""}`}
                          />
                          <AvatarFallback>
                            {`${application.talent_profiles?.first_name || "T"}`.charAt(0)}
                            {`${application.talent_profiles?.last_name || ""}`.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white">
                            {application.talent_profiles?.first_name}{" "}
                            {application.talent_profiles?.last_name}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {application.gigs?.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {application.talent_profiles?.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {application.talent_profiles?.experience}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No applications yet"
                      description="Applications will appear here once talent starts applying to your gigs"
                    />
                  )}
                  <Button variant="outline" className="w-full apple-glass border-white/30 text-white" asChild>
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
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                            <p className="text-sm text-gray-600">
                              {deadline.applications_count || 0} applications received
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            Due {deadline.application_deadline}
                          </p>
                          <Badge variant="outline" className={getStatusColor(deadline.status)}>
                            {deadline.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={Calendar}
                      title="No upcoming deadlines"
                      description="Deadlines will appear here for gigs with application deadlines"
                    />
                  )}
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
              {gigs.map((gig) => (
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
                      src={gig.image_url || "/images/totl-logo.png"}
                      alt={gig.title}
                      width={300}
                      height={200}
                      className="w-full h-32 md:h-48 object-cover rounded-lg"
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
              {applications.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No applications yet"
                  description="Applications will appear here once talent starts applying to your gigs. Make sure your gigs are active and visible to talent."
                  action={{
                    label: "Create a Gig",
                    onClick: () => setActiveTab("create"),
                  }}
                />
              ) : (
                applications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={
                              application.profiles?.avatar_url ||
                              "/images/totl-logo-transparent.png"
                            }
                            alt={
                              application.talent_profiles?.first_name &&
                              application.talent_profiles?.last_name
                                ? `${application.talent_profiles.first_name} ${application.talent_profiles.last_name}`
                                : application.profiles?.display_name || "Talent"
                            }
                          />
                          <AvatarFallback className="text-lg">
                            {application.talent_profiles?.first_name &&
                            application.talent_profiles?.last_name
                              ? `${application.talent_profiles.first_name.charAt(0)}${application.talent_profiles.last_name.charAt(0)}`
                              : application.profiles?.display_name?.charAt(0) || "T"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.talent_profiles?.first_name &&
                                application.talent_profiles?.last_name
                                  ? `${application.talent_profiles.first_name} ${application.talent_profiles.last_name}`
                                  : application.profiles?.display_name || "Talent User"}
                              </h3>
                              <p className="text-gray-600">{application.gigs?.title}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-600">
                                  <MapPin className="h-4 w-4 inline mr-1" />
                                  {application.talent_profiles?.location ||
                                    "Location not specified"}
                                </span>
                                <span className="text-sm text-gray-600">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  {application.talent_profiles?.experience ||
                                    "Experience not specified"}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Applied {new Date(application.created_at).toLocaleDateString()}
                                </span>
                                {application.profiles?.email_verified && (
                                  <span className="text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4 inline mr-1" />
                                    Verified
                                  </span>
                                )}
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
                ))
              )}
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
