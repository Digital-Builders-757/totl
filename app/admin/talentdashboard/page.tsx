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
import { EmailVerificationReminder } from "@/components/email-verification-reminder";
import { RequireAuth } from "@/components/require-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SafeImage } from "@/components/ui/safe-image";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import type { Database } from "@/types/database";

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

// Type definitions for joined data using views
type ApplicationWithGigAndClient = Database["public"]["Views"]["admin_talent_dashboard"]["Row"];
type BookingWithGigAndClient = Database["public"]["Views"]["admin_bookings_dashboard"]["Row"];

interface PortfolioItemWithCaption {
  image_url: string | null;
  caption: string | null;
}

interface MainProfileData {
  avatar_url: string | null;
}

export default async function TalentDashboard() {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not found - redirecting to login");
    redirect("/login?returnUrl=/admin/talentdashboard");
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileData: TalentProfile | null = null;
  let isProfileComplete = false;
  let applicationsData: ApplicationWithGigAndClient[] = [];
  let bookingsData: BookingWithGigAndClient[] = [];
  let portfolioData: PortfolioItemWithCaption[] = [];
  let mainProfileData: MainProfileData | null = null;

  if (user) {
    const [profileResult, applicationsResult, bookingsResult, portfolioResult, mainProfileResult] =
      await Promise.all([
        supabase.from("talent_profiles").select("*").eq("user_id", user.id).single(),
        supabase
          .from("admin_talent_dashboard")
          .select(
            "application_id,talent_id,application_status,application_created_at,gig_id,gig_title,gig_status,gig_location,talent_display_name,talent_avatar_url,client_company_name"
          )
          .eq("talent_id", user.id),
        supabase
          .from("admin_bookings_dashboard")
          .select(
            "booking_id,booking_date,booking_compensation,gig_id,gig_title,gig_status,gig_location,talent_display_name,talent_avatar_url,client_company_name"
          )
          .eq("talent_id", user.id),
        supabase
          .from("portfolio_items")
          .select("image_url, caption")
          .eq("talent_id", user.id)
          .limit(4),
        supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
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
      const requiredFields: (keyof TalentProfile)[] = ["height", "weight", "experience_years"];
      isProfileComplete = requiredFields.every((field) => !!profileData?.[field]);
    }

    applicationsData = applicationsResult.data || [];
    bookingsData = bookingsResult.data || [];
    portfolioData = portfolioResult.data || [];
    mainProfileData = mainProfileResult.data || null;
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
      <div className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
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
                  <Link href="/admin/talentdashboard" className="text-black font-medium">
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/talentdashboard/profile"
                    className="text-gray-600 hover:text-black"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/admin/talentdashboard/portfolio"
                    className="text-gray-600 hover:text-black"
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/admin/talentdashboard/applications"
                    className="text-gray-600 hover:text-black"
                  >
                    Applications
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-black relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {gigs.active.length}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center text-sm font-medium text-gray-700 hover:text-black">
                      <Avatar className="mr-2 h-8 w-8">
                        <AvatarImage
                          src={mainProfileData?.avatar_url || "/images/totl-logo.png"}
                          alt={user?.email || "User"}
                        />
                        <AvatarFallback>
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline">{user?.email || "Talent"}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/talentdashboard/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <EmailVerificationReminder />

          {!isProfileComplete && profileData && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 flex items-center justify-between">
                <span>
                  Your profile is incomplete. Complete your profile to increase your chances of
                  being discovered.
                </span>
                <Button asChild variant="outline" size="sm" className="ml-4">
                  <Link href="/admin/talentdashboard/profile">
                    <Edit className="mr-2 h-4 w-4" /> Complete Profile
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Talent Dashboard</h1>
              <p className="text-gray-600">Manage your portfolio, applications, and bookings</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button asChild className="bg-black text-white hover:bg-black/90">
                <Link href="/gigs">
                  <Briefcase className="mr-2 h-4 w-4" /> Browse Gigs
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="relative h-40 md:h-48 bg-gradient-to-r from-gray-900 to-gray-700">
              <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                <SafeImage
                  src="/vibrant-runway-show.png"
                  alt="Cover"
                  fill
                  placeholderQuery="fashion runway"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="relative px-6 md:px-8 pb-6">
              <div className="flex flex-col md:flex-row">
                <div className="relative -mt-16 md:-mt-20 mb-4 md:mb-0 md:mr-8">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-md">
                    <SafeImage
                      src={mainProfileData?.avatar_url || "/images/totl-logo.png"}
                      alt={user?.email || "User"}
                      width={128}
                      height={128}
                      placeholderQuery="model portrait"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="flex-1 pt-0 md:pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{user?.email || "Your Name"}</h2>
                      <p className="text-gray-600">Editorial & Runway Model</p>
                    </div>
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button asChild variant="outline">
                        <Link href="/admin/talentdashboard/profile">Edit Profile</Link>
                      </Button>
                      <Button asChild className="bg-black text-white hover:bg-black/90">
                        <Link href={`/talent/${profileData?.id || 0}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Public Profile
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <Star className="mr-2 h-4 w-4 text-amber-500" />
                      <span>4.9 Rating</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4 text-gray-500" />
                      <span>324 Profile Views</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>Verified Profile</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Available Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Applications</p>
                <p className="text-2xl font-bold">{gigs.active.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Gigs Completed</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center">
              <div className="p-3 bg-amber-100 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold">$15,200</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Application Overview</h3>
            <TalentDashboardClient gigs={gigs} />
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Upcoming Bookings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-40 bg-gray-200">
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
                    <p className="text-xs text-gray-500">{booking.date}</p>
                    <h4 className="font-bold my-1">{booking.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{booking.company}</p>
                    <div className="flex items-center text-xs text-gray-500">
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
                  <p className="text-gray-500">You have no upcoming bookings.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Portfolio Highlights</h3>
              <Button asChild variant="outline">
                <Link href="/admin/talentdashboard/portfolio">Manage Portfolio</Link>
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
                  <p className="text-gray-500">Your portfolio is empty. Add some highlights!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
