"use client";

import {
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
  Calendar,
  TrendingUp,
  Target,
  Award,
  Globe,
  MoreVertical,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { ApplicationDetailsModal } from "@/components/application-details-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { SafeDate } from "@/components/safe-date";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SafeImage } from "@/components/ui/safe-image";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { UrgentBadge } from "@/components/urgent-badge";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

// Force dynamic rendering to prevent build-time issues
export const dynamic = "force-dynamic";

// Use proper database types
type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
type ClientProfileRow = Database["public"]["Tables"]["client_profiles"]["Row"];

// Type for application with joined gig and client data (matching modal type)
interface TalentApplication extends ApplicationRow {
  gigs?: GigRow & {
    client_profiles?: Pick<ClientProfileRow, "company_name"> | null;
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
  application_deadline?: string | null;
}

function TalentDashboardContent() {
  const router = useRouter();
  const { user, signOut, profile, isLoading } = useAuth();
  const subscriptionProfile =
    profile && profile.role === "talent"
      ? {
          role: "talent" as const,
          subscription_status: profile.subscription_status ?? "none",
        }
      : null;
  const showSubscriptionBanner = subscriptionProfile
    ? subscriptionProfile.subscription_status !== "active"
    : false;
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [applications, setApplications] = useState<TalentApplication[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalentApplication, setSelectedTalentApplication] = useState<TalentApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if Supabase is configured
  const isSupabaseConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured ? createSupabaseBrowser() : null;

  // Redirect unauthenticated users away from dashboard and show clear CTA
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/talent/dashboard")}`);
    }
  }, [isLoading, user, router]);

  // Calculate dashboard stats from real data
  const dashboardStats = {
    totalApplications: applications.length,
    newApplications: applications.filter(
      (app) => app.status === "new" || app.status === "under_review"
    ).length,
    acceptedTalentApplications: applications.filter((app) => app.status === "accepted").length,
    activeGigs: gigs.filter((gig) => gig.status === "active").length,
    totalGigs: gigs.length,
  };

  const needsProfileCompletion =
    !talentProfile?.first_name || !talentProfile?.last_name || !talentProfile?.location;

  const fetchDashboardData = useCallback(async () => {
    if (!supabase || !user) return;

    try {
      // Profile data is already available from auth context (avatar_url, display_name, etc.)
      // No need to fetch it again - this eliminates N+1 query issue

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
        setApplications((applicationsData as TalentApplication[]) || []);
      }

      // Fetch active gigs for discovery
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      if (gigsError) {
        console.error("Error fetching gigs:", gigsError);
        setError("Failed to load gigs");
      } else {
        setGigs((gigsData as Gig[]) || []);
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

  // Show success toast when application is submitted
  useEffect(() => {
    const applied = searchParams.get("applied");
    if (applied === "success") {
      toast({
        title: "TalentApplication Submitted Successfully! 🎉",
        description:
          "Your application has been sent to the client. You'll be notified when they respond.",
        duration: 5000,
      });

      // Clean up URL by removing the parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("applied");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, toast]);

  const handleViewDetails = (application: TalentApplication) => {
    setSelectedTalentApplication(application);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTalentApplication(null);
  };

  // Removed getStatusColor - now using ApplicationStatusBadge component

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

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      
      // Call signOut and wait for it to complete
      await signOut();
      
      // Force immediate hard refresh to ensure clean state
      // This ensures cookies are cleared and page refreshes
      window.location.href = '/login';
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
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
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
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
              You need to be logged in to access your talent dashboard.
            </p>
            <Button asChild className="bg-white text-black hover:bg-gray-200 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
              <Link href="/login">Sign In to Continue</Link>
            </Button>
            
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-500 mb-3">New to TOTL?</p>
              <Link 
                href="/choose-role" 
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
              >
                Create an account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={profile?.avatar_url || "/images/totl-logo-transparent.png"}
                  alt="Profile"
                />
                <AvatarFallback>
                  {talentProfile?.first_name?.[0]}
                  {talentProfile?.last_name?.[0] || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {talentProfile?.first_name || "Talent"}!
                </h1>
                <p className="text-gray-300">Ready to discover your next opportunity?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <Link href="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {showSubscriptionBanner && (
          <SubscriptionPrompt profile={subscriptionProfile} variant="banner" context="general" />
        )}
        {/* Profile Completion Alert */}
        {needsProfileCompletion && (
          <div className="mb-6 bg-amber-900/20 border border-amber-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="font-medium text-amber-200">Complete Your Profile</h3>
                  <p className="text-sm text-amber-300">
                    Add your name and contact information to make your profile visible to clients.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Link href="/talent/profile">Complete Profile</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Profile Views</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-full">
                  <Eye className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Total Applications</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardStats.totalApplications}
                  </p>
                </div>
                <div className="bg-green-900/30 p-2 rounded-full">
                  <Users className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Accepted</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.acceptedTalentApplications}</p>
                </div>
                <div className="bg-purple-900/30 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Earnings</p>
                  <p className="text-2xl font-bold text-white">${0}</p>
                </div>
                <div className="bg-yellow-900/30 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Rating</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <div className="bg-orange-900/30 p-2 rounded-full">
                  <Star className="h-4 w-4 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Success Rate</p>
                  <p className="text-2xl font-bold text-white">0%</p>
                </div>
                <div className="bg-teal-900/30 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 text-white data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4" />
              TalentApplications
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger
              value="discover"
              className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
            >
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Completion */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="h-5 w-5 text-blue-400" />
                    Profile Strength
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Complete your profile to get more opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white">
                      <span>Profile Completion</span>
                      <span className="font-medium">{needsProfileCompletion ? "60%" : "85%"}</span>
                    </div>
                    <Progress value={needsProfileCompletion ? 60 : 85} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <User className="h-4 w-4" />
                        Basic Information
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          needsProfileCompletion
                            ? "bg-red-900/30 text-red-400 border-red-700"
                            : "bg-green-900/30 text-green-400 border-green-700"
                        }
                      >
                        {needsProfileCompletion ? "Incomplete" : "Complete"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <Phone className="h-4 w-4" />
                        Contact Details
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-900/30 text-green-400 border-green-700"
                      >
                        Complete
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-white">
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-900/30 text-green-400 border-green-700"
                      >
                        Complete
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                      variant="outline"
                      asChild
                    >
                      <Link href="/talent/profile" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Complete Profile
                      </Link>
                    </Button>
                    <Button
                      className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
                      variant="outline"
                      asChild
                    >
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Browse Available Gigs */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Briefcase className="h-5 w-5 text-green-400" />
                    Available Gigs
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Discover new opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{gigs.length}</div>
                    <p className="text-sm text-white">Active gigs available</p>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
                    <Link href="/gigs" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Browse All Gigs
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription className="text-gray-300">Your activity summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {dashboardStats.totalApplications}
                      </div>
                      <p className="text-xs text-white">Total Applications</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {dashboardStats.acceptedTalentApplications}
                      </div>
                      <p className="text-xs text-white">Accepted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Gigs */}
            <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Upcoming Gigs
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your confirmed and pending bookings
                </CardDescription>
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
                              src={app.gigs?.image_url}
                              alt={app.gigs?.title || "Unknown Gig"}
                              fallbackSrc="/images/totl-logo-transparent.png"
                              fill
                              className="object-cover"
                              placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                            />
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-semibold text-lg text-white">
                                {app.gigs?.title}
                              </h4>
                              <ApplicationStatusBadge status={app.status} showIcon={true} />
                            </div>
                            <p className="text-gray-300 font-medium">
                              {app.gigs?.client_profiles?.company_name || "Private Client"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <SafeDate date={app.created_at} />
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
                    <p className="text-gray-300 mb-4">You don&apos;t have any upcoming gigs.</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/gigs">Browse Available Gigs</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-white">My TalentApplications</CardTitle>
                    <CardDescription className="text-gray-300">
                      Track all your gig applications and their status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
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
                      className="flex flex-col md:flex-row gap-4 p-4 border border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-800"
                    >
                      <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                        <SafeImage
                          src={app.gigs?.image_url}
                          alt={app.gigs?.title || "Unknown Gig"}
                          fallbackSrc="/images/totl-logo-transparent.png"
                          fill
                          className="object-cover"
                          placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                        />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg text-white">{app.gigs?.title}</h4>
                          <ApplicationStatusBadge status={app.status} showIcon={true} />
                        </div>
                        <p className="text-gray-300 font-medium">
                          {app.gigs?.client_profiles?.company_name || "Private Client"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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
                          <span>
                            Applied: <SafeDate date={app.created_at} />
                          </span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none bg-transparent border-gray-700 text-white hover:bg-gray-700"
                          onClick={() => handleViewDetails(app)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:bg-gray-700"
                        >
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
                            src={app.gigs?.image_url}
                            alt={app.gigs?.title || "Unknown Gig"}
                            fallbackSrc="/images/totl-logo-transparent.png"
                            fill
                            className="object-cover"
                            placeholderQuery={app.gigs?.category?.toLowerCase() || "general"}
                          />
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h4 className="font-semibold text-lg text-white">
                              {app.gigs?.title}
                            </h4>
                            <ApplicationStatusBadge status={app.status} showIcon={true} />
                          </div>
                          <p className="text-gray-300 font-medium">
                            {app.gigs?.client_profiles?.company_name || "Private Client"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <SafeDate date={app.created_at} />
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
                            onClick={() => handleViewDetails(app)}
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
                    <p className="mt-4 text-gray-300">Loading available gigs...</p>
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
                        <div className="h-32 md:h-48 relative">
                          <SafeImage
                            src={gig.image_url}
                            alt={gig.title}
                            fallbackSrc="/images/totl-logo-transparent.png"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            placeholderQuery={gig.category?.toLowerCase() || "general"}
                          />
                          {gig.application_deadline && (
                            <UrgentBadge deadline={gig.application_deadline} />
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
                            <h4 className="font-semibold text-lg text-white line-clamp-1">
                              {gig.title}
                            </h4>
                            <p className="text-gray-300 text-sm">{gig.description}</p>
                          </div>
                          <div className="space-y-2">
                            <Badge
                              variant="outline"
                              className={getCategoryColor(gig.category || "General")}
                            >
                              {gig.category || "General"}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-300">
                              <MapPin className="h-4 w-4 mr-1" />
                              {gig.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-300">
                              <Calendar className="h-4 w-4 mr-1" />
                              Deadline:{" "}
                              {gig.application_deadline ? (
                                <SafeDate date={gig.application_deadline} />
                              ) : (
                                "No deadline"
                              )}
                            </div>
                            <div className="flex items-center text-sm font-medium text-white">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {gig.compensation}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1 button-glow border-0" asChild>
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

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        application={selectedTalentApplication}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

export default function TalentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <TalentDashboardContent />
    </Suspense>
  );
}
