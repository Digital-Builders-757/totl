"use client";

import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Users,
  Briefcase,
  BarChart,
  Settings,
  LogOut,
  Bell,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter gigs based on search query
  const filteredGigs = activeGigs.filter(
    (gig) =>
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
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
                <Link href="/admin/dashboard" className="text-black font-medium">
                  Dashboard
                </Link>
                <Link href="/admin/gigs/create" className="text-gray-600 hover:text-black">
                  My Gigs
                </Link>
                <Link href="/talent" className="text-gray-600 hover:text-black">
                  Applications
                </Link>
                <Link href="/admin/talentdashboard" className="text-gray-600 hover:text-black">
                  Talent View
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-black relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm font-medium text-gray-700 hover:text-black">
                    <div className="w-8 h-8 bg-gray-200 rounded-full mr-2 flex items-center justify-center">
                      <UserIcon size={16} />
                    </div>
                    <span className="hidden md:inline">Eternal Diamonds</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Client Dashboard</h1>
            <p className="text-gray-600">Manage your gigs, applications, and talent connections</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild className="bg-black text-white hover:bg-black/90">
              <Link href="/admin/gigs/create">
                <Plus className="mr-2 h-4 w-4" /> Post New Gig
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/gigs/create" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Gigs</p>
                  <h3 className="text-3xl font-bold mt-1">7</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+2</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>
          </Link>

          <Link href="/talent" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Applications</p>
                  <h3 className="text-3xl font-bold mt-1">48</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+12</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>
          </Link>

          <Link href="/talent" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Hired Talent</p>
                  <h3 className="text-3xl font-bold mt-1">15</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600 flex items-center">
                <span className="font-medium">+5</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>
          </Link>

          <Link href="/talent" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Profile Views</p>
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
          </Link>
        </div>

        {/* My Gigs Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-xl font-bold">My Gigs</h2>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search gigs"
                    className="pl-9 w-full md:w-60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <div className="px-6 border-b border-gray-100">
              <TabsList className="h-12">
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Active Gigs (7)
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Drafts (2)
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
                >
                  Closed (5)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Gig Title
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Category
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Applications
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Posted Date
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGigs.map((gig) => (
                      <tr key={gig.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-200 mr-3">
                              <SafeImage
                                src={gig.image}
                                alt={gig.title}
                                width={40}
                                height={40}
                                placeholderQuery="gig"
                                className="rounded object-cover h-10 w-10"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{gig.title}</div>
                              <div className="text-gray-500 text-sm">{gig.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className="bg-gray-50">
                            {gig.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <span className="font-medium">{gig.applications}</span>
                            {gig.newApplications > 0 && (
                              <Badge className="ml-2 bg-green-500 text-white text-xs">
                                +{gig.newApplications} new
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            className={`${
                              gig.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : gig.status === "Featured"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {gig.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{gig.postedDate}</td>
                        <td className="py-4 px-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/gigs/${gig.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/admin/gigs/create">
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit Gig</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/talent">
                                  <Users className="mr-2 h-4 w-4" />
                                  <span>View Applications</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <XCircle className="mr-2 h-4 w-4" />
                                <span>Close Gig</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
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

            <TabsContent value="draft" className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Draft Gigs</h3>
                <p className="text-gray-500 mb-4">You have 2 gigs saved as drafts</p>
                <Button asChild variant="outline">
                  <Link href="/admin/gigs/create">View Drafts</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="closed" className="p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Closed Gigs</h3>
                <p className="text-gray-500 mb-4">You have 5 closed gigs</p>
                <Button asChild variant="outline">
                  <Link href="/admin/gigs/create">View Closed Gigs</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Applications</h2>
              <Link href="/talent" className="text-sm font-medium text-black hover:underline">
                View All
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    Applicant
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-6">
                    Gig
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
                {recentApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 mr-3">
                          <SafeImage
                            src={application.applicantImage}
                            alt={application.applicantName}
                            width={40}
                            height={40}
                            placeholderQuery="person"
                            className="rounded-full object-cover h-10 w-10"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {application.applicantName}
                          </div>
                          <div className="text-gray-500 text-sm">{application.applicantType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{application.gigTitle}</td>
                    <td className="py-4 px-6 text-gray-500">{application.appliedDate}</td>
                    <td className="py-4 px-6">
                      <Badge
                        className={`${
                          application.status === "Reviewed"
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
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/talent/${application.applicantId}`}>View Profile</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/gigs/create" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Post a New Gig</h3>
              <p className="text-gray-600 mb-4">
                Create a new casting call or job opportunity for talent.
              </p>
              <Button className="w-full bg-black text-white hover:bg-black/90">Create Gig</Button>
            </div>
          </Link>

          <Link href="/talent" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Browse Talent</h3>
              <p className="text-gray-600 mb-4">
                Discover and connect with professional models and talent.
              </p>
              <Button variant="outline" className="w-full">
                Browse Talent
              </Button>
            </div>
          </Link>

          <Link href="/admin/talentdashboard" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow h-full">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Talent Dashboard</h3>
              <p className="text-gray-600 mb-4">
                View the talent perspective of the TOTL Agency platform.
              </p>
              <Button variant="outline" className="w-full">
                View Talent Dashboard
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Mock data for active gigs
const activeGigs = [
  {
    id: 1,
    title: "Luxury Jewelry Campaign",
    location: "London, UK",
    category: "Commercial",
    applications: 18,
    newApplications: 3,
    status: "Featured",
    postedDate: "June 22, 2023",
    image: "/gig-jewelry.png",
  },
  {
    id: 2,
    title: "Summer Collection Lookbook",
    location: "Paris, France",
    category: "Editorial",
    applications: 12,
    newApplications: 0,
    status: "Active",
    postedDate: "June 15, 2023",
    image: "/gig-editorial.png",
  },
  {
    id: 3,
    title: "Promotional Event Models",
    location: "New York, NY",
    category: "Promotional",
    applications: 24,
    newApplications: 5,
    status: "Urgent",
    postedDate: "June 10, 2023",
    image: "/gig-promotional.png",
  },
  {
    id: 4,
    title: "Bridal Collection Campaign",
    location: "Milan, Italy",
    category: "Commercial",
    applications: 9,
    newApplications: 0,
    status: "Active",
    postedDate: "June 8, 2023",
    image: "/similar-gig-3.png",
  },
  {
    id: 5,
    title: "Fitness Apparel Shoot",
    location: "Los Angeles, CA",
    category: "Fitness",
    applications: 15,
    newApplications: 2,
    status: "Active",
    postedDate: "June 5, 2023",
    image: "/gig-fitness.png",
  },
];

// Mock data for recent applications
const recentApplications = [
  {
    id: 1,
    applicantName: "Sophia Chen",
    applicantType: "Editorial & Runway",
    applicantImage: "/images/model-1.png",
    gigTitle: "Luxury Jewelry Campaign",
    appliedDate: "June 23, 2023",
    status: "New",
    applicantId: 0,
  },
  {
    id: 2,
    applicantName: "Marcus Williams",
    applicantType: "Commercial & Print",
    applicantImage: "/images/model-2.png",
    gigTitle: "Summer Collection Lookbook",
    appliedDate: "June 22, 2023",
    status: "Reviewed",
    applicantId: 1,
  },
  {
    id: 3,
    applicantName: "Ava Rodriguez",
    applicantType: "High Fashion & Campaigns",
    applicantImage: "/images/model-3.png",
    gigTitle: "Luxury Jewelry Campaign",
    appliedDate: "June 22, 2023",
    status: "Shortlisted",
    applicantId: 2,
  },
];
