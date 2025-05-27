"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Camera,
  BarChart,
  Settings,
  LogOut,
  Bell,
  UserIcon,
  Calendar,
  DollarSign,
  Star,
  ImageIcon,
  FileText,
  MessageSquare,
  Briefcase,
  MapPin,
  AlertCircle,
  Edit,
} from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { Avatar } from "@/components/ui/avatar"
import { RequireAuth } from "@/components/require-auth"
import { EmailVerificationReminder } from "@/components/email-verification-reminder"
import { useAuth } from "@/components/auth-provider"

export default function TalentDashboard() {
  const [activeTab, setActiveTab] = useState("active")
  const { supabase, user } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // FIXED: Using explicit column selection and eq filter
        const { data, error } = await supabase
          .from("talent_profiles")
          .select("id, user_id, first_name, last_name, phone, age, location, experience")
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        setProfileData(data)

        // Check if required fields are filled - now done client-side
        const requiredFields = ["phone", "age", "location", "experience"]
        const complete = requiredFields.every((field) => !!data[field])
        setIsProfileComplete(complete)
      } catch (err) {
        console.error("Error fetching profile data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProfileData()
    }
  }, [user, supabase])

  return (
    <RequireAuth>
      <div className="bg-gray-50">
        {/* Admin Header */}
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
                  <Link href="/admin/talentdashboard/profile" className="text-gray-600 hover:text-black">
                    Profile
                  </Link>
                  <Link href="/admin/talentdashboard/portfolio" className="text-gray-600 hover:text-black">
                    Portfolio
                  </Link>
                  <Link href="/admin/talentdashboard/applications" className="text-gray-600 hover:text-black">
                    Applications
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-black relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    5
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center text-sm font-medium text-gray-700 hover:text-black">
                      <Avatar src="/images/model-1.png" alt="Sophia Chen" size="sm" className="mr-2" />
                      <span className="hidden md:inline">Sophia Chen</span>
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

          {/* Profile Completion Alert */}
          {!isProfileComplete && !isLoading && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 flex items-center justify-between">
                <span>
                  Your profile is incomplete. Complete your profile to increase your chances of being discovered.
                </span>
                <Button asChild variant="outline" size="sm" className="ml-4">
                  <Link href="/admin/talentdashboard/profile">
                    <Edit className="mr-2 h-4 w-4" /> Complete Profile
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Dashboard Header */}
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

          {/* Profile Summary */}
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
                      src="/images/model-1.png"
                      alt="Sophia Chen"
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
                      <h2 className="text-2xl font-bold mb-1">
                        {profileData ? `${profileData.first_name} ${profileData.last_name}` : "Your Name"}
                      </h2>
                      <p className="text-gray-600">Editorial & Runway Model</p>
                    </div>
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button asChild variant="outline">
                        <Link href="/admin/talentdashboard/profile">Edit Profile</Link>
                      </Button>
                      <Button asChild className="bg-black text-white hover:bg-black/90">
                        <Link href="/talent/0">
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Applications</p>
                  <h3 className="text-3xl font-bold mt-1">12</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+3</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Upcoming Bookings</p>
                  <h3 className="text-3xl font-bold mt-1">3</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+1</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Earnings</p>
                  <h3 className="text-3xl font-bold mt-1">$4,800</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+$1,200</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Portfolio Views</p>
                  <h3 className="text-3xl font-bold mt-1">324</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+86</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>
          </div>

          {/* My Applications */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h2 className="text-xl font-bold">My Applications</h2>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input placeholder="Search applications" className="pl-9 w-full md:w-60" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
              <div className="px-6 border-b border-gray-100">
                <TabsList className="h-12">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                  >
                    Active (5)
                  </TabsTrigger>
                  <TabsTrigger
                    value="accepted"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                  >
                    Accepted (3)
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                  >
                    Rejected (4)
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Gig
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Company
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Applied Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 mr-3">
                                <SafeImage
                                  src={application.image}
                                  alt={application.title}
                                  width={40}
                                  height={40}
                                  placeholderQuery="fashion photoshoot"
                                  className="rounded object-cover h-10 w-10"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{application.title}</div>
                                <div className="text-gray-500 text-sm">{application.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-500">{application.company}</td>
                          <td className="py-4 px-6 text-gray-500">{application.appliedDate}</td>
                          <td className="py-4 px-6">
                            <Badge
                              className={`${
                                application.status === "Under Review"
                                  ? "bg-blue-100 text-blue-800"
                                  : application.status === "Shortlisted"
                                    ? "bg-green-100 text-green-800"
                                    : application.status === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {application.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/gigs/${application.gigId}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>View Gig</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/talentdashboard/applications/${application.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>View Application</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  <span>Contact Client</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  <span>Withdraw Application</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="accepted" className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Accepted Applications</h3>
                  <p className="text-gray-500 mb-4">You have 3 accepted applications</p>
                  <Button asChild variant="outline">
                    <Link href="/admin/talentdashboard/applications?status=accepted">View Accepted Applications</Link>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="rejected" className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Rejected Applications</h3>
                  <p className="text-gray-500 mb-4">You have 4 rejected applications</p>
                  <Button asChild variant="outline">
                    <Link href="/admin/talentdashboard/applications?status=rejected">View Rejected Applications</Link>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Upcoming Bookings</h2>
                <Link href="/admin/talentdashboard/bookings" className="text-sm font-medium text-black hover:underline">
                  View All
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="md:w-1/4">
                      <div className="aspect-video relative rounded-lg overflow-hidden">
                        <SafeImage
                          src={booking.image}
                          alt={booking.title}
                          fill
                          placeholderQuery="fashion photoshoot"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="md:w-3/4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{booking.title}</h3>
                        <Badge className="w-fit mt-1 md:mt-0 bg-green-100 text-green-800">Confirmed</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{booking.company}</p>
                      <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="mr-1 h-4 w-4" />
                          {booking.date}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="mr-1 h-4 w-4" />
                          {booking.time}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="mr-1 h-4 w-4" />
                          {booking.location}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="mr-1 h-4 w-4" />
                          {booking.compensation}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/talentdashboard/bookings/${booking.id}`}>View Details</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/talentdashboard/bookings/${booking.id}/calendar`}>Add to Calendar</Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Client
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Preview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Portfolio Highlights</h2>
                <Link
                  href="/admin/talentdashboard/portfolio"
                  className="text-sm font-medium text-black hover:underline"
                >
                  Manage Portfolio
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portfolioHighlights.map((item, index) => (
                  <div key={index} className="aspect-[3/4] relative rounded-md overflow-hidden group">
                    <SafeImage
                      src={item.image}
                      alt={item.caption}
                      fill
                      placeholderQuery="fashion model"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium text-center px-2">{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/admin/talentdashboard/portfolio/upload">
                    <ImageIcon className="mr-2 h-4 w-4" /> Upload New Photos
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Find New Gigs</h3>
              <p className="text-gray-600 mb-4">Browse available casting calls and job opportunities.</p>
              <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                <Link href="/gigs">Browse Gigs</Link>
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Update Portfolio</h3>
              <p className="text-gray-600 mb-4">Add new photos and update your portfolio to showcase your best work.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/talentdashboard/portfolio">Manage Portfolio</Link>
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">View Analytics</h3>
              <p className="text-gray-600 mb-4">Track your profile views, application success rate, and earnings.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/talentdashboard/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

// Mock data for active applications
const activeApplications = [
  {
    id: 1,
    gigId: 0,
    title: "Luxury Fashion Editorial",
    company: "Vogue Magazine",
    location: "New York, NY",
    appliedDate: "June 23, 2023",
    status: "Shortlisted",
    image: "/gig-editorial.png",
  },
  {
    id: 2,
    gigId: 1,
    title: "Summer Collection Lookbook",
    company: "Luxury Brand",
    location: "Paris, France",
    appliedDate: "June 20, 2023",
    status: "Under Review",
    image: "/similar-gig-1.png",
  },
  {
    id: 3,
    gigId: 6,
    title: "Luxury Jewelry Campaign",
    company: "Eternal Diamonds",
    location: "London, UK",
    appliedDate: "June 18, 2023",
    status: "Interview Scheduled",
    image: "/gig-jewelry.png",
  },
  {
    id: 4,
    gigId: 2,
    title: "Runway Models for Fashion Week",
    company: "Luxury Design House",
    location: "Milan, Italy",
    appliedDate: "June 15, 2023",
    status: "Under Review",
    image: "/gig-runway.png",
  },
  {
    id: 5,
    gigId: 3,
    title: "Beauty Campaign for Skincare Line",
    company: "Luminous Beauty",
    location: "Miami, FL",
    appliedDate: "June 10, 2023",
    status: "Under Review",
    image: "/gig-beauty.png",
  },
]

// Mock data for upcoming bookings
const upcomingBookings = [
  {
    id: 1,
    title: "Luxury Jewelry Campaign",
    company: "Eternal Diamonds",
    date: "July 15, 2023",
    time: "9:00 AM - 5:00 PM",
    location: "London Studio, UK",
    compensation: "$3,000",
    image: "/gig-jewelry.png",
  },
  {
    id: 2,
    title: "Summer Fashion Editorial",
    company: "Vogue Magazine",
    date: "July 22, 2023",
    time: "10:00 AM - 4:00 PM",
    location: "New York Studio, NY",
    compensation: "$2,000",
    image: "/gig-editorial.png",
  },
  {
    id: 3,
    title: "Paris Fashion Week Runway",
    company: "Luxury Design House",
    date: "September 28, 2023",
    time: "All Day",
    location: "Paris, France",
    compensation: "$5,000",
    image: "/gig-runway.png",
  },
]

// Mock data for portfolio highlights
const portfolioHighlights = [
  {
    image: "/ethereal-bloom.png",
    caption: "Vogue Editorial",
  },
  {
    image: "/fashion-forward-strut.png",
    caption: "NYFW Runway",
  },
  {
    image: "/urban-threads.png",
    caption: "Summer Campaign",
  },
  {
    image: "/radiant-portrait.png",
    caption: "Beauty Editorial",
  },
]
