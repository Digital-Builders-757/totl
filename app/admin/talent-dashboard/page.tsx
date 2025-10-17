import {
  Eye,
  CheckCircle,
  Settings,
  LogOut,
  Bell,
  UserIcon,
  Calendar,
  Star,
  Briefcase,
  AlertCircle,
  Edit,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TalentDashboardClient } from "./talent-dashboard-client";
import { RequireAuth } from "@/components/auth/require-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailVerificationReminder } from "@/components/ui/email-verification-reminder";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import {
  type TalentProfileRow,
  type ProfileRow,
  type PortfolioItemRow,
  type AdminTalentDashboardRow,
  type AdminBookingsDashboardRow,
} from "@/types/database-helpers";

export default async function TalentDashboard() {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not found - redirecting to login");
    redirect("/login?returnUrl=/admin/talent-dashboard");
  }

  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileData: TalentProfileRow | null = null;
  let isProfileComplete = false;
  let applicationsData: AdminTalentDashboardRow[] = [];
  let bookingsData: AdminBookingsDashboardRow[] = [];
  let portfolioData: PortfolioItemRow[] = [];
  let mainProfileData: ProfileRow | null = null;

  if (user) {
    const [profileResult, applicationsResult, bookingsResult, portfolioResult, mainProfileResult] =
      await Promise.all([
        supabase
          .from("talent_profiles")
          .select("*")
          .eq("user_id", user.id as string)
          .single(),
        supabase
          .from("admin_talent_dashboard")
          .select(
            "application_id,talent_id,application_status,application_created_at,gig_id,gig_title,gig_status,gig_location,talent_display_name,talent_avatar_url,client_company_name"
          )
          .eq("talent_id", user.id as string),
        supabase
          .from("admin_bookings_dashboard")
          .select(
            "booking_id,booking_date,booking_compensation,gig_id,gig_title,gig_status,gig_location,talent_display_name,talent_avatar_url,client_company_name"
          )
          .eq("talent_id", user.id as string),
        supabase
          .from("portfolio_items")
          .select("image_url, caption")
          .eq("talent_id", user.id as string)
          .limit(4),
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id as string)
          .single(),
      ]);

    if (profileResult.error) console.error("Error fetching talent profile:", profileResult.error);
    if (applicationsResult.error)
      console.error("Error fetching applications:", applicationsResult.error);
    if (bookingsResult.error) console.error("Error fetching bookings:", bookingsResult.error);
    if (portfolioResult.error) console.error("Error fetching portfolio:", portfolioResult.error);
    if (mainProfileResult.error)
      console.error("Error fetching main profile:", mainProfileResult.error);

    if (profileResult.data) {
      profileData = profileResult.data;
      const requiredFields: (keyof TalentProfileRow)[] = ["height", "weight", "experience_years"];
      isProfileComplete = requiredFields.every((field) => !!profileData?.[field]);
    }

    applicationsData = (applicationsResult.data || []) as AdminTalentDashboardRow[];
    bookingsData = (bookingsResult.data || []) as AdminBookingsDashboardRow[];
    portfolioData = (portfolioResult.data || []) as PortfolioItemRow[];
    mainProfileData = mainProfileResult.data as ProfileRow | null;
  }

  const gigs = {
    active:
      applicationsData
        ?.filter(
          (app) =>
            app.application_status &&
            ["new", "under_review", "shortlisted"].includes(app.application_status)
        )
        .map((app) => ({
          id: parseInt(app.application_id || "0") || 0,
          gigId: parseInt(app.gig_id || "0") || 0,
          title: app.gig_title || "Unknown Gig",
          company: app.client_company_name || "Private Client",
          location: app.gig_location || "Unknown Location",
          appliedDate: app.application_created_at
            ? new Date(app.application_created_at).toLocaleDateString()
            : "Unknown Date",
          status: app.application_status || "new",
          image: "/gig-editorial.png",
        })) || [],
    accepted:
      applicationsData
        ?.filter((app) => app.application_status === "accepted")
        .map((app) => ({
          id: parseInt(app.application_id || "0") || 0,
          gigId: parseInt(app.gig_id || "0") || 0,
          title: app.gig_title || "Unknown Gig",
          company: app.client_company_name || "Private Client",
          location: app.gig_location || "Unknown Location",
          appliedDate: app.application_created_at
            ? new Date(app.application_created_at).toLocaleDateString()
            : "Unknown Date",
          status: app.application_status || "accepted",
          image: "/gig-editorial.png",
        })) || [],
    rejected:
      applicationsData
        ?.filter((app) => app.application_status === "rejected")
        .map((app) => ({
          id: parseInt(app.application_id || "0") || 0,
          gigId: parseInt(app.gig_id || "0") || 0,
          title: app.gig_title || "Unknown Gig",
          company: app.client_company_name || "Private Client",
          location: app.gig_location || "Unknown Location",
          appliedDate: app.application_created_at
            ? new Date(app.application_created_at).toLocaleDateString()
            : "Unknown Date",
          status: app.application_status || "rejected",
          image: "/gig-editorial.png",
        })) || [],
  };

  const upcomingBookings =
    bookingsData?.map((booking) => ({
      id: booking.booking_id || "0",
      title: booking.gig_title || "Unknown Gig",
      company: booking.client_company_name || "Private Client",
      date: booking.booking_date
        ? new Date(booking.booking_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Unknown Date",
      time: booking.booking_date
        ? new Date(booking.booking_date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown Time",
      location: booking.gig_location || "Unknown Location",
      compensation: `$${booking.booking_compensation || 0}`,
      image: "/gig-jewelry.png",
    })) || [];

  const portfolioHighlights =
    portfolioData?.map((item) => ({
      image: item.image_url || "/placeholder.jpg",
      caption: item.caption,
    })) || [];

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={mainProfileData?.avatar_url || "/images/totl-logo-transparent.png"}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    {user?.email?.charAt(0).toUpperCase() || "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Welcome back, {user?.email || "Talent"}!
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
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {gigs.active.length}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Link href="/admin/talent-dashboard/profile">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Profile Completion Alert */}
          {!isProfileComplete && profileData && (
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
                  <Link href="/admin/talent-dashboard/profile">
                    <Edit className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Profile Views</p>
                  <p className="text-2xl font-bold text-white">324</p>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-full">
                  <Eye className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Applications</p>
                  <p className="text-2xl font-bold text-white">{gigs.active.length}</p>
                </div>
                <div className="bg-green-900/30 p-2 rounded-full">
                  <Briefcase className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Bookings</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
                <div className="bg-purple-900/30 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Earnings</p>
                  <p className="text-2xl font-bold text-white">$15,200</p>
                </div>
                <div className="bg-yellow-900/30 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Rating</p>
                  <p className="text-2xl font-bold text-white">4.9</p>
                </div>
                <div className="bg-orange-900/30 p-2 rounded-full">
                  <Star className="h-4 w-4 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Success Rate</p>
                  <p className="text-2xl font-bold text-white">85%</p>
                </div>
                <div className="bg-teal-900/30 p-2 rounded-full">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Application Overview */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-white">Application Overview</h3>
            <TalentDashboardClient gigs={gigs} />
          </div>

          {/* Upcoming Bookings */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-white">Upcoming Bookings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-gray-900 border-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="h-40 bg-gray-800">
                    <SafeImage
                      src={booking.image}
                      alt={booking.title}
                      width={400}
                      height={160}
                      placeholderQuery="booking image"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400">{booking.date}</p>
                    <h4 className="font-bold my-1 text-white">{booking.title}</h4>
                    <p className="text-sm text-gray-300 mb-2">{booking.company}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="mr-1.5 h-3 w-3" />
                      <span>
                        {booking.date} at {booking.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingBookings.length === 0 && (
                <div className="text-center py-8 col-span-full">
                  <p className="text-gray-400">You have no upcoming bookings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Highlights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Portfolio Highlights</h3>
              <Button asChild variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <Link href="/admin/talent-dashboard/portfolio">Manage Portfolio</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {portfolioHighlights.map((item, index) => (
                <div key={index} className="group relative rounded-xl overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.caption || "Portfolio image"}
                    width={300}
                    height={400}
                    placeholderQuery="portfolio image"
                    className="object-cover w-full h-full aspect-[3/4] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-medium text-sm">{item.caption}</p>
                  </div>
                </div>
              ))}
              {portfolioHighlights.length === 0 && (
                <div className="text-center py-8 col-span-full">
                  <p className="text-gray-400">Your portfolio is empty. Add some highlights!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
