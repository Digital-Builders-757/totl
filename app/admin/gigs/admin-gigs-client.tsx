"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  Filter,
  Briefcase,
  MapPin,
  Eye,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { GigStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Gig = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string;
  application_deadline: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  client_profiles: {
    company_name: string;
  };
};

interface AdminGigsClientProps {
  gigs: Gig[];
  user: User;
}

export function AdminGigsClient({ gigs: initialGigs, user }: AdminGigsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter gigs based on search query and active tab
  const filteredGigs = useMemo(() => {
    let filtered = initialGigs;

    // Filter by status based on active tab
    if (activeTab === "active") {
      filtered = filtered.filter((gig) => gig.status === "active");
    } else if (activeTab === "draft") {
      filtered = filtered.filter((gig) => gig.status === "draft");
    } else if (activeTab === "closed") {
      filtered = filtered.filter((gig) => gig.status === "closed");
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (gig) =>
          gig.title.toLowerCase().includes(query) ||
          gig.location.toLowerCase().includes(query) ||
          gig.category.toLowerCase().includes(query) ||
          gig.client_profiles.company_name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [initialGigs, searchQuery, activeTab]);

  // Group by status for stats
  const activeGigs = initialGigs.filter((gig) => gig.status === "active");
  const draftGigs = initialGigs.filter((gig) => gig.status === "draft");
  const closedGigs = initialGigs.filter((gig) => gig.status === "closed");

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen">
      <AdminHeader user={user} notificationCount={3} />

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              All Gigs
            </h1>
            <p className="text-gray-400 text-lg">View and manage all gigs posted by Career Builders</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
              {activeGigs.length} Active
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium">
              {draftGigs.length} Draft
            </div>
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg font-medium">
              {closedGigs.length} Closed
            </div>
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Link href="/admin/gigs/create">
                <Plus className="h-4 w-4" />
                Create Gig
              </Link>
            </Button>
          </div>
        </div>

        {/* Gigs Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Gigs</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by title, location, category, or company..."
                    className="pl-9 w-full md:w-60 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter size={16} />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6 border-b border-gray-700">
              <TabsList className="h-12 bg-gray-700/50 border border-gray-600">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  All ({initialGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Active ({activeGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Draft ({draftGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200"
                >
                  Closed ({closedGigs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="p-0">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Gigs Found</h3>
                  <p className="text-gray-400 text-lg">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No gigs have been posted yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Title
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Career Builder
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Location
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Compensation
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredGigs.map((gig) => (
                        <tr key={gig.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{gig.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{gig.category}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white text-sm">{gig.client_profiles.company_name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="h-3 w-3" />
                              {gig.location}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-sm">{gig.compensation}</td>
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            {new Date(gig.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <GigStatusBadge status={gig.status} showIcon={true} />
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/gigs/${gig.id}`}
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Gig
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="p-0">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Active Gigs</h3>
                  <p className="text-gray-400 text-lg">There are currently no active gigs.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Title
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Career Builder
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Location
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Compensation
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredGigs.map((gig) => (
                        <tr key={gig.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{gig.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{gig.category}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white text-sm">{gig.client_profiles.company_name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="h-3 w-3" />
                              {gig.location}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-sm">{gig.compensation}</td>
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            {new Date(gig.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <GigStatusBadge status={gig.status} showIcon={true} />
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/gigs/${gig.id}`}
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Gig
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="draft" className="p-0">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Draft Gigs</h3>
                  <p className="text-gray-400 text-lg">There are currently no draft gigs.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Title
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Career Builder
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Location
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Compensation
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredGigs.map((gig) => (
                        <tr key={gig.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{gig.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{gig.category}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white text-sm">{gig.client_profiles.company_name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="h-3 w-3" />
                              {gig.location}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-sm">{gig.compensation}</td>
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            {new Date(gig.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <GigStatusBadge status={gig.status} showIcon={true} />
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/gigs/${gig.id}`}
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Gig
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="p-0">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Closed Gigs</h3>
                  <p className="text-gray-400 text-lg">There are currently no closed gigs.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Title
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Career Builder
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Location
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Compensation
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Date
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredGigs.map((gig) => (
                        <tr key={gig.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white text-sm">{gig.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{gig.category}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white text-sm">{gig.client_profiles.company_name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="h-3 w-3" />
                              {gig.location}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-sm">{gig.compensation}</td>
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            {new Date(gig.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <GigStatusBadge status={gig.status} showIcon={true} />
                          </td>
                          <td className="py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/gigs/${gig.id}`}
                                    className="text-gray-300 hover:bg-gray-700 flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Gig
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

