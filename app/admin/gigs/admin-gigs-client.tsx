"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  Briefcase,
  MapPin,
  Eye,
  Pencil,
  Plus,
  SlidersHorizontal,
  Calendar,
  Archive,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useTransition } from "react";

import { closeGigAsAdminAction, deleteGigAsAdminAction } from "@/app/admin/gigs/gig-lifecycle-actions";
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
  applications_count: number;
  client_profiles: {
    company_name: string;
  };
};

interface AdminGigsClientProps {
  gigs: Gig[];
  user: User;
}

export function AdminGigsClient({ gigs: initialGigs, user }: AdminGigsClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState("all");

  const confirmClose = (gig: Gig) => {
    if (
      !window.confirm(
        `Close “${gig.title}”? It will no longer appear as an active opportunity for talent.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await closeGigAsAdminAction(gig.id);
      if (result.ok) router.refresh();
      else window.alert(result.error);
    });
  };

  const confirmDelete = (gig: Gig) => {
    if (gig.applications_count > 0) {
      window.alert(
        "This listing has applications and cannot be permanently deleted. Close it instead."
      );
      return;
    }
    if (
      !window.confirm(
        `Permanently delete “${gig.title}”? This cannot be undone. There must be zero applications.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGigAsAdminAction(gig.id);
      if (result.ok) router.refresh();
      else window.alert(result.error);
    });
  };

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
          <h3 className="text-lg font-semibold text-white">No Opportunities Found</h3>
          <p className="mt-2 text-sm text-[var(--oklch-text-tertiary)]">
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
                { label: "Production", value: new Date(gig.date).toLocaleDateString() },
              ]}
              badge={<GigStatusBadge status={gig.status} showIcon />}
              footer={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Link href={`/admin/gigs/${gig.id}`}>View details</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-9 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Link href={`/admin/gigs/${gig.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              }
              trailing={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white"
                      aria-label="Opportunity actions"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/gigs/${gig.id}`} className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white">
                        <Eye className="mr-2 h-4 w-4" />
                        View Opportunity
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/admin/gigs/${gig.id}/edit`}
                        className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Opportunity
                      </Link>
                    </DropdownMenuItem>
                    {gig.status !== "closed" ? (
                      <DropdownMenuItem
                        disabled={pending}
                        className="flex items-center text-[var(--oklch-text-secondary)] focus:bg-white/10 focus:text-white"
                        onSelect={(e) => {
                          e.preventDefault();
                          confirmClose(gig);
                        }}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Close opportunity
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      disabled={pending || gig.applications_count > 0}
                      className="flex items-center text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
                      onSelect={(e) => {
                        e.preventDefault();
                        confirmDelete(gig);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete permanently
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
              <tr className="bg-gradient-to-r from-card/45 to-card/28">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Career Builder
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Compensation
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Production
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredGigs.map((gig) => (
                <tr key={gig.id} className="hover:bg-card/22 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <Link href={`/admin/gigs/${gig.id}`} className="block focus-hint">
                      <div className="font-medium text-white text-sm hover:underline">{gig.title}</div>
                      <div className="mt-1 text-xs text-[var(--oklch-text-tertiary)]">{gig.category}</div>
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-white text-sm">{gig.client_profiles.company_name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-tertiary)]">
                      <MapPin className="h-3 w-3" />
                      {gig.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">{gig.compensation}</td>
                  <td className="px-6 py-4 text-sm text-[var(--oklch-text-tertiary)]">
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
                          className="text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white"
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/gigs/${gig.id}`} className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white">
                            <Eye className="mr-2 h-4 w-4" />
                            View Opportunity
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/gigs/${gig.id}/edit`}
                            className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Opportunity
                          </Link>
                        </DropdownMenuItem>
                        {gig.status !== "closed" ? (
                          <DropdownMenuItem
                            disabled={pending}
                            className="flex items-center text-[var(--oklch-text-secondary)] focus:bg-white/10 focus:text-white"
                            onSelect={(e) => {
                              e.preventDefault();
                              confirmClose(gig);
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Close opportunity
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          disabled={pending || gig.applications_count > 0}
                          className="flex items-center text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
                          onSelect={(e) => {
                            e.preventDefault();
                            confirmDelete(gig);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete permanently
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

        <div className="mb-8 overflow-hidden rounded-2xl panel-frosted card-backlit shadow-lg">
          <div className="border-b border-border/40 bg-gradient-to-r from-card/40 to-card/25 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Opportunities</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                    size={16}
                  />
                  <Input
                    placeholder="Search by title, location, opportunity type, or company..."
                    className="w-full pl-9 md:w-72"
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
                    className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-[var(--oklch-text-tertiary)]">Location</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={locationFilter === "all" ? "default" : "outline"}
                          className={locationFilter === "all" ? "" : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"}
                          onClick={() => setLocationFilter("all")}
                        >
                          All ({initialGigs.length})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "remote" ? "default" : "outline"}
                          className={locationFilter === "remote" ? "" : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"}
                          onClick={() => setLocationFilter("remote")}
                        >
                          Remote ({remoteGigs})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "new york" ? "default" : "outline"}
                          className={locationFilter === "new york" ? "" : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"}
                          onClick={() => setLocationFilter("new york")}
                        >
                          New York ({nycGigs})
                        </Button>
                        <Button
                          type="button"
                          variant={locationFilter === "los angeles" ? "default" : "outline"}
                          className={locationFilter === "los angeles" ? "" : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"}
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
                    className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {activeFilterCount > 0 ? "Filters (1)" : "Filters"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full space-y-4" onValueChange={setActiveTab}>
            <div className="border-b border-white/10 px-4 sm:px-6">
              <MobileTabRail edgeColorClassName="from-[rgba(6,8,18,0.98)]">
                <TabsList className="panel-frosted inline-flex h-auto min-w-max gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
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
              <TabsList className="hidden h-12 panel-frosted md:grid md:grid-cols-4">
                <TabsTrigger
                  value="all"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  All ({initialGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  Active ({activeGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  Draft ({draftGigs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="text-[var(--oklch-text-secondary)] transition-all duration-200 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white"
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

