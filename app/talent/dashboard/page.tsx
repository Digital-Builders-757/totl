"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  FileText,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Star,
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
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserCheck,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Globe,
  MoreVertical,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

interface TalentProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  age?: number | null;
  location?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  height?: string | null;
  measurements?: string | null;
  hair_color?: string | null;
  eye_color?: string | null;
  shoe_size?: string | null;
  languages?: string[] | null;
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
  message?: string;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
    image_url?: string;
    client_profiles?: {
      company_name: string;
    };
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
  application_deadline?: string;
}

export default function TalentDashboard() {
  const { user, signOut } = useAuth();
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createClientComponentClient() : null;

  // Calculate dashboard stats from real data
  const dashboardStats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(
      (app) => app.status === "new" || app.status === "under_review"
    ).length,
    acceptedApplications: applications.filter((app) => app.status === "accepted").length,
    completedGigs: applications.filter((app) => app.status === "completed").length,
    activeGigs: gigs.filter((gig) => gig.status === "active").length,
    totalGigs: gigs.length,
  };

  const needsProfileCompletion =
    !talentProfile?.first_name || !talentProfile?.last_name || !talentProfile?.location;

  const fetchDashboardData = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      // Fetch talent profile
      const { data: talentProfileData, error: talentProfileError } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (talentProfileError) {
        console.error("Error fetching talent profile:", talentProfileError);
      } else {
        setTalentProfile(talentProfileData);
      }

      // Fetch talent's applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select("*, gigs(title, category, location, compensation, image_url)")
        .eq("talent_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
      } else {
        setApplications(applicationsData || []);
      }

      // Fetch active gigs for discovery
      console.log("Starting gigs fetch..."); // Debug log
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("Gigs fetch result:", { gigsData, gigsError }); // Debug log

      if (gigsError) {
        console.error("Error fetching gigs:", gigsError);
        setError("Failed to load gigs");
      } else {
        console.log("Fetched gigs:", gigsData); // Debug logging
        setGigs(gigsData || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user && supabase) {
      fetchDashboardData();
    } else if (!isSupabaseConfigured) {
      setError("Supabase is not configured");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, supabase, isSupabaseConfigured, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "new":
      case "under_review":
      case "interview_scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
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

  // Show error state if Supabase is not configured
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            You need to be logged in to access your talent dashboard.
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
                <AvatarImage src="/images/totl-logo-transparent.png" alt="Profile" />
                <AvatarFallback>
                  {talentProfile?.first_name?.[0]}
                  {talentProfile?.last_name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {talentProfile?.first_name || "Talent"}!
                </h1>
                <p className="text-gray-600">Ready to discover your next opportunity?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
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
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800">Complete Your Profile</h3>
                  <p className="text-sm text-amber-700">
                    Add your name and contact information to make your profile visible to clients.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Link href="/talent/profile">Complete Profile</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Eye className="h-4 w-4 text-blue-600" />
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
                <div className="bg-green-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.completedGigs}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">${0}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-full">
                  <Star className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                </div>
                <div className="bg-teal-100 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Completion */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Profile Strength
                  </CardTitle>
                  <CardDescription>Complete your profile to get more opportunities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completion</span>
                      <span className="font-medium">{needsProfileCompletion ? "60%" : "85%"}</span>
                    </div>
                    <Progress value={needsProfileCompletion ? 60 : 85} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Basic Information
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          needsProfileCompletion
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }
                      >
                        {needsProfileCompletion ? "Incomplete" : "Complete"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Details
                      </span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Complete
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Complete
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/talent/profile" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Update Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Browse Available Gigs */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    Available Gigs
                  </CardTitle>
                  <CardDescription>Discover new opportunities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{gigs.length}</div>
                    <p className="text-sm text-gray-600">Active gigs available</p>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/gigs" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Browse All Gigs
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>Your activity summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardStats.totalApplications}
                      </div>
                      <p className="text-xs text-gray-600">Applications</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardStats.acceptedApplications}
                      </div>
                      <p className="text-xs text-gray-600">Accepted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Gigs */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Upcoming Gigs
                </CardTitle>
                <CardDescription>Your confirmed and pending bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.filter((app) => app.status === "accepted").length > 0 ? (
                  <div className="space-y-4">
                    {applications
                      .filter((app) => app.status === "accepted")
                      .map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="w-full md:w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={app.gigs?.image_url || "/images/totl-logo-transparent.png"}
                              alt={app.gigs?.title || "Unknown Gig"}
                              fill
                              className="object-cover"
                              placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                            />
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {app.gigs?.title}
                              </h4>
                              <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                            </div>
                            <p className="text-gray-600 font-medium">
                              {app.gigs?.client_profiles?.company_name || "Private Client"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(app.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {app.gigs?.compensation || "TBD"}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {app.gigs?.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {app.gigs?.compensation || "TBD"}
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 md:flex-none bg-transparent"
                            >
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You don&apos;t have any upcoming gigs.</p>
                    <Button onClick={() => setActiveTab("discover")}>Browse Available Gigs</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>
                      Track all your gig applications and their status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                        <SafeImage
                          src={app.gigs?.image_url || "/images/totl-logo-transparent.png"}
                          alt={app.gigs?.title || "Unknown Gig"}
                          fill
                          className="object-cover"
                          placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                        />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg text-gray-900">{app.gigs?.title}</h4>
                          <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                        </div>
                        <p className="text-gray-600 font-medium">
                          {app.gigs?.client_profiles?.company_name || "Private Client"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <Badge
                            variant="outline"
                            className={getCategoryColor(app.gigs?.category || "General")}
                          >
                            {app.gigs?.category || "General"}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {app.gigs?.compensation || "TBD"}
                          </span>
                          <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none bg-transparent"
                        >
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
                <CardDescription>Your confirmed and upcoming gigs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications
                    .filter((app) => app.status === "accepted")
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                          <SafeImage
                            src={app.gigs?.image_url || "/images/totl-logo-transparent.png"}
                            alt={app.gigs?.title || "Unknown Gig"}
                            fill
                            className="object-cover"
                            placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                          />
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h4 className="font-semibold text-lg text-gray-900">
                              {app.gigs?.title}
                            </h4>
                            <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                          </div>
                          <p className="text-gray-600 font-medium">
                            {app.gigs?.client_profiles?.company_name || "Private Client"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(app.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {app.gigs?.compensation || "TBD"}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.gigs?.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {app.gigs?.compensation || "TBD"}
                            </div>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 md:flex-none bg-transparent"
                          >
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Available Gigs</CardTitle>
                    <CardDescription>
                      Discover new opportunities that match your profile
                    </CardDescription>
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
                    <Button asChild size="sm">
                      <Link href="/gigs">
                        <Eye className="h-4 w-4 mr-2" />
                        View All Gigs
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading available gigs...</p>
                  </div>
                ) : error ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="Error Loading Gigs"
                    description={error}
                    action={{
                      label: "Try Again",
                      onClick: fetchDashboardData,
                    }}
                  />
                ) : gigs.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title="No Gigs Available"
                    description="There are currently no active gigs available. Check back soon for new opportunities!"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs.map((gig) => (
                      <Card
                        key={gig.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow group"
                      >
                        <div className="h-48 relative">
                          <SafeImage
                            src={gig.image_url || "/images/totl-logo-transparent.png"}
                            alt={gig.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            placeholderQuery={gig.category?.toLowerCase() || "general"}
                          />
                          {gig.application_deadline &&
                            new Date(gig.application_deadline) <
                              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                              <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                                Urgent
                              </Badge>
                            )}
                          <div className="absolute top-3 right-3 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-white/80 hover:bg-white"
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 line-clamp-1">
                              {gig.title}
                            </h4>
                            <p className="text-gray-600 text-sm">{gig.description}</p>
                          </div>
                          <div className="space-y-2">
                            <Badge
                              variant="outline"
                              className={getCategoryColor(gig.category || "General")}
                            >
                              {gig.category || "General"}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              {gig.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              Deadline:{" "}
                              {gig.application_deadline
                                ? new Date(gig.application_deadline).toLocaleDateString()
                                : "No deadline"}
                            </div>
                            <div className="flex items-center text-sm font-medium text-gray-900">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {gig.compensation}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1" asChild>
                              <Link href={`/gigs/${gig.id}/apply`}>Apply Now</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/gigs/${gig.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
