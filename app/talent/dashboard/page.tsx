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
  created_at: string;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  pay_rate: string;
  image?: string;
  created_at: string;
}

export default function TalentDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Mock data for enhanced UI (these would be replaced with real data)
  const profileStats = {
    profileViews: 1247,
    applications: 12,
    interviews: 5,
    bookings: 3,
    earnings: 2450,
    rating: 4.8,
    completionRate: 95,
  };

  const upcomingGigs = [
    {
      id: 1,
      title: "Summer Fashion Editorial",
      company: "Vogue Magazine",
      date: "July 15, 2023",
      time: "9:00 AM - 5:00 PM",
      location: "New York Studio",
      status: "Confirmed",
      pay: "$800",
      image: "/images/totl-logo-transparent.png",
      category: "Editorial",
    },
    {
      id: 2,
      title: "Sportswear Campaign",
      company: "Nike",
      date: "July 22, 2023",
      time: "10:00 AM - 4:00 PM",
      location: "Los Angeles",
      status: "Pending",
      pay: "$1,200",
      image: "/images/totl-logo-transparent.png",
      category: "Commercial",
    },
  ];

  const recentApplications = [
    {
      id: 1,
      gigTitle: "Luxury Jewelry Campaign",
      company: "Tiffany & Co",
      appliedDate: "June 28, 2023",
      status: "Under Review",
      image: "/images/totl-logo-transparent.png",
      category: "Commercial",
      pay: "$1,500",
    },
    {
      id: 2,
      gigTitle: "Summer Collection Lookbook",
      company: "Zara",
      appliedDate: "June 25, 2023",
      status: "Interview Scheduled",
      image: "/images/totl-logo-transparent.png",
      category: "Editorial",
      pay: "$900",
    },
    {
      id: 3,
      gigTitle: "Fitness Apparel Shoot",
      company: "Lululemon",
      appliedDate: "June 20, 2023",
      status: "Rejected",
      image: "/images/totl-logo-transparent.png",
      category: "Fitness",
      pay: "$700",
    },
  ];

  const availableGigs = [
    {
      id: 1,
      title: "Runway Show - Fall Collection",
      company: "Fashion Week NYC",
      deadline: "July 10, 2023",
      location: "New York",
      pay: "$1,500",
      image: "/images/totl-logo-transparent.png",
      category: "Runway",
      urgent: true,
    },
    {
      id: 2,
      title: "Beauty Campaign",
      company: "Sephora",
      deadline: "July 15, 2023",
      location: "Los Angeles",
      pay: "$2,000",
      image: "/images/totl-logo-transparent.png",
      category: "Beauty",
      urgent: false,
    },
    {
      id: 3,
      title: "E-commerce Photoshoot",
      company: "ASOS",
      deadline: "July 20, 2023",
      location: "Miami",
      pay: "$800",
      image: "/images/totl-logo-transparent.png",
      category: "E-commerce",
      urgent: false,
    },
  ];

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch talent profile
      const { data: talentData, error: talentError } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (talentError && talentError.code !== "PGRST116") throw talentError;
      setTalentProfile(talentData);

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("applications")
        .select("*")
        .eq("talent_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);

      // Fetch available gigs
      const { data: gigsData, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (gigsError) throw gigsError;
      setGigs(gigsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "under review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "interview scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
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

  const needsProfileCompletion = !talentProfile?.first_name || !talentProfile?.last_name;

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
                  Welcome back, {profile?.display_name || "Talent"}!
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
                  <p className="text-2xl font-bold text-gray-900">{profileStats.profileViews}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{profileStats.bookings}</p>
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
                  <p className="text-2xl font-bold text-gray-900">${profileStats.earnings}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{profileStats.rating}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{profileStats.completionRate}%</p>
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
                  {upcomingGigs.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingGigs.map((gig) => (
                        <div
                          key={gig.id}
                          className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="w-full md:w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={gig.image}
                              alt={gig.title}
                              fill
                              className="object-cover"
                              placeholderQuery={gig.category.toLowerCase()}
                            />
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <h4 className="font-semibold text-lg text-gray-900">{gig.title}</h4>
                              <Badge className={getStatusColor(gig.status)}>{gig.status}</Badge>
                            </div>
                            <p className="text-gray-600 font-medium">{gig.company}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {gig.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {gig.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {gig.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {gig.pay}
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
                      <p className="text-gray-500 mb-4">You don't have any upcoming gigs.</p>
                      <Button onClick={() => setActiveTab("discover")}>
                        Browse Available Gigs
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest applications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                        <SafeImage
                          src={app.image}
                          alt={app.gigTitle}
                          fill
                          className="object-cover"
                          placeholderQuery={app.category.toLowerCase()}
                        />
                      </div>
                      <div className="flex-grow">
                        <h5 className="font-medium text-gray-900">{app.gigTitle}</h5>
                        <p className="text-sm text-gray-600">{app.company}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{app.appliedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {recentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                        <SafeImage
                          src={app.image}
                          alt={app.gigTitle}
                          fill
                          className="object-cover"
                          placeholderQuery={app.category.toLowerCase()}
                        />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg text-gray-900">{app.gigTitle}</h4>
                          <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                        </div>
                        <p className="text-gray-600 font-medium">{app.company}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <Badge variant="outline" className={getCategoryColor(app.category)}>
                            {app.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {app.pay}
                          </span>
                          <span>Applied: {app.appliedDate}</span>
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
                  {upcomingGigs.map((gig) => (
                    <div
                      key={gig.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="w-full md:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                        <SafeImage
                          src={gig.image}
                          alt={gig.title}
                          fill
                          className="object-cover"
                          placeholderQuery={gig.category.toLowerCase()}
                        />
                      </div>
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h4 className="font-semibold text-lg text-gray-900">{gig.title}</h4>
                          <Badge className={getStatusColor(gig.status)}>{gig.status}</Badge>
                        </div>
                        <p className="text-gray-600 font-medium">{gig.company}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {gig.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {gig.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {gig.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {gig.pay}
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableGigs.map((gig) => (
                    <Card
                      key={gig.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <div className="h-48 relative">
                        <SafeImage
                          src={gig.image}
                          alt={gig.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          placeholderQuery={gig.category.toLowerCase()}
                        />
                        {gig.urgent && (
                          <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                            Urgent
                          </Badge>
                        )}
                        <div className="absolute top-3 right-3 flex gap-1">
                          <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900 line-clamp-1">
                            {gig.title}
                          </h4>
                          <p className="text-gray-600 text-sm">{gig.company}</p>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="outline" className={getCategoryColor(gig.category)}>
                            {gig.category}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {gig.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            Deadline: {gig.deadline}
                          </div>
                          <div className="flex items-center text-sm font-medium text-gray-900">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {gig.pay}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1">Apply Now</Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
