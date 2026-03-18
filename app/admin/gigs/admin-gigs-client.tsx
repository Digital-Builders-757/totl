"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  Briefcase,
  MapPin,
  Eye,
  Plus,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { DataTableShell } from "@/components/layout/data-table-shell";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("all");

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

    if (locationFilter !== "all") {
      filtered = filtered.filter((gig) => gig.location.toLowerCase().includes(locationFilter));
    }

    return filtered;
  }, [initialGigs, searchQuery, activeTab, locationFilter]);

  // Group by status for stats
  const activeGigs = initialGigs.filter((gig) => gig.status === "active");
  const draftGigs = initialGigs.filter((gig) => gig.status === "draft");
  const closedGigs = initialGigs.filter((gig) => gig.status === "closed");
  const remoteGigs = initialGigs.filter((gig) => gig.location.toLowerCase().includes("remote")).length;
  const nycGigs = initialGigs.filter((gig) => gig.location.toLowerCase().includes("new york")).length;
  const laGigs = initialGigs.filter((gig) => gig.location.toLowerCase().includes("los angeles")).length;
  const activeFilterCount = locationFilter === "all" ? 0 : 1;

  const renderGigsContent = () => {
    if (filteredGigs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <Briefcase className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Gigs Found</h3>
          <p className="mt-2 text-sm text-gray-400">
            {searchQuery || locationFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No opportunities have been posted yet."}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3 md:hidden">
          {filteredGigs.map((gig) => (
            <MobileListRowCard
              key={`mobile-${gig.id}`}
              title={gig.title}
              subtitle={gig.client_profiles.company_name}
              meta={[
                { label: "Location", value: gig.location },
                { label: "Comp", value: gig.compensation },
                { label: "Date", value: new Date(gig.date).toLocaleDateString() },
              ]}
              badge={<GigStatusBadge status={gig.status} showIcon />}
              footer={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 border-gray-700 bg-transparent text-white hover:bg-gray-700"
                  >
                    <Link href={`/admin/gigs/${gig.id}`}>View details</Link>
                  </Button>
                </div>
              }
              trailing={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white hover:bg-gray-700"
                      aria-label="Opportunity actions"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/gigs/${gig.id}`} className="text-gray-300 hover:bg-gray-700 flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        View Opportunity
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>
        <DataTableShell className="hidden md:block">
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
                    <Link href={`/admin/gigs/${gig.id}`} className="block focus-hint">
                      <div className="font-medium text-white text-sm hover:underline">{gig.title}</div>
                      <div className="text-gray-400 text-xs mt-1">{gig.category}</div>
                    </Link>
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
                    <GigStatusBadge status={gig.status} showIcon />
                  </td>
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/gigs/${gig.id}`} className="text-gray-300 hover:bg-gray-700 flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            View Opportunity
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </>
    );
  };

  return (
    <PageShell
      topPadding={false}
      fullBleed
      className="bg-gradient-to-br from-gray-900 via-black to-gray-800"
    >
      <AdminHeader user={user} />

      <div className="container mx-auto space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        <PageHeader
          title="All Opportunities"
          subtitle="View and manage all opportunities posted by Career Builders."
          actions={
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Link href="/admin/gigs/create">
                <Plus className="h-4 w-4" />
                Create Opportunity
              </Link>
            </Button>
          }
        />

        <div className="md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Active", value: activeGigs.length, icon: Briefcase },
              { label: "Draft", value: draftGigs.length, icon: SlidersHorizontal },
              { label: "Closed", value: closedGigs.length, icon: Calendar },
            ]}
          />
        </div>
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-medium text-white">
            {activeGigs.length} Active
          </div>
          <div className="rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-2 text-sm font-medium text-white">
            {draftGigs.length} Draft
          </div>
          <div className="rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 px-3 py-2 text-sm font-medium text-white">
            {closedGigs.length} Closed
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Opportunities</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by title, location, opportunity type, or company..."
                    className="pl-9 w-full md:w-60 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:hidden">
                  <FiltersSheet
                    open={isFiltersOpen}
                    onOpenChange={setIsFiltersOpen}
                    activeCount={activeFilterCount}
                    title="Opportunity Filters"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Location</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={locationFilter === "all" ? "default" : "outline"}
                          className={locationFilter === "all" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setLocationFilter("all")}
                        >
                          All ({initialGigs.length})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "remote" ? "default" : "outline"}
                          className={locationFilter === "remote" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setLocationFilter("remote")}
                        >
                          Remote ({remoteGigs})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "new york" ? "default" : "outline"}
                          className={locationFilter === "new york" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setLocationFilter("new york")}
                        >
                          New York ({nycGigs})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "los angeles" ? "default" : "outline"}
                          className={locationFilter === "los angeles" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setLocationFilter("los angeles")}
                        >
                          Los Angeles ({laGigs})
                        </Button>
                      </div>
                    </div>
                  </FiltersSheet>
                </div>
                <div className="hidden md:block">
                  <Button
                    variant="outline"
                    onClick={() => setLocationFilter("all")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {activeFilterCount > 0 ? "Filters (1)" : "Filters"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full space-y-4" onValueChange={setActiveTab}>
            <div className="border-b border-gray-700 px-4 sm:px-6">
              <MobileTabRail edgeColorClassName="from-gray-900">
                <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-xl border border-gray-700 bg-gray-900 p-1">
                  <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    All ({initialGigs.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Active ({activeGigs.length})
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Draft ({draftGigs.length})
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                    Closed ({closedGigs.length})
                  </TabsTrigger>
                </TabsList>
              </MobileTabRail>
              <TabsList className="hidden h-12 border border-gray-600 bg-gray-700/50 md:grid md:grid-cols-4">
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
              {renderGigsContent()}
            </TabsContent>

            <TabsContent value="active" className="p-0">
              {renderGigsContent()}
            </TabsContent>

            <TabsContent value="draft" className="p-0">
              {renderGigsContent()}
            </TabsContent>

            <TabsContent value="closed" className="p-0">
              {renderGigsContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
}

