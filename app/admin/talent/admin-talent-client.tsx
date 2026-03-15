"use client";

import type { User } from "@supabase/supabase-js";
import {
  Search,
  MoreVertical,
  User as UserIcon,
  MapPin,
  Eye,
  SlidersHorizontal,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { FiltersSheet } from "@/components/dashboard/filters-sheet";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { DataTableShell } from "@/components/layout/data-table-shell";
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

type TalentProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  experience: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_path: string | null;
    email_verified: boolean;
    created_at: string;
  };
};

interface AdminTalentClientProps {
  talent: TalentProfile[];
  user: User;
}

export function AdminTalentClient({ talent: initialTalent, user }: AdminTalentClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");

  // Filter talent based on search query
  const filteredTalent = useMemo(() => {
    let filtered = initialTalent;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.first_name.toLowerCase().includes(query) ||
          t.last_name.toLowerCase().includes(query) ||
          (t.profiles?.display_name && t.profiles.display_name.toLowerCase().includes(query)) ||
          (t.location && t.location.toLowerCase().includes(query)) ||
          (t.experience && t.experience.toLowerCase().includes(query)) ||
          (t.specialties && t.specialties.some((s) => s.toLowerCase().includes(query)))
      );
    }

    if (verificationFilter === "verified") {
      filtered = filtered.filter((t) => t.profiles?.email_verified);
    } else if (verificationFilter === "unverified") {
      filtered = filtered.filter((t) => !t.profiles?.email_verified);
    }

    return filtered;
  }, [initialTalent, searchQuery, verificationFilter]);

  const totalTalent = initialTalent.length;
  const verifiedTalent = initialTalent.filter((t) => t.profiles?.email_verified).length;
  const unverifiedTalent = totalTalent - verifiedTalent;
  const activeFilterCount = verificationFilter === "all" ? 0 : 1;

  const renderTalentActions = (talent: TalentProfile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
        <DropdownMenuItem asChild>
          <Link
            href={`/talent/${talent.user_id}`}
            className="text-gray-300 hover:bg-gray-700 flex items-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTalentContent = () => {
    if (filteredTalent.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
            <UserIcon className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Talent Found</h3>
          <p className="mt-2 text-sm text-gray-400">
            {searchQuery || verificationFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No talent profiles have been created yet."}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3 md:hidden">
          {filteredTalent.map((talent) => (
            <MobileListRowCard
              key={`mobile-${talent.id}`}
              title={`${talent.first_name} ${talent.last_name}`}
              subtitle={talent.profiles?.display_name || "No display name"}
              meta={[
                { label: "Location", value: talent.location || "N/A" },
                { label: "Experience", value: talent.experience_years ? `${talent.experience_years} years` : "N/A" },
                { label: "Joined", value: new Date(talent.created_at).toLocaleDateString() },
              ]}
              badge={
                talent.profiles?.email_verified ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50">
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/50">
                    Unverified
                  </span>
                )
              }
              trailing={renderTalentActions(talent)}
            />
          ))}
        </div>
        <DataTableShell className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-700">
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Talent
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Location
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Experience
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Specialties
                </th>
                <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-4 px-6">
                  Joined
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
              {filteredTalent.map((talent) => (
                <tr key={talent.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {talent.first_name.charAt(0)}
                        {talent.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">
                          {talent.first_name} {talent.last_name}
                        </div>
                        {talent.profiles?.display_name && (
                          <div className="text-gray-400 text-xs">{talent.profiles.display_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {talent.location ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin className="h-3 w-3" />
                        {talent.location}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {talent.experience_years ? `${talent.experience_years} years` : "—"}
                  </td>
                  <td className="py-4 px-6">
                    {talent.specialties && talent.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {talent.specialties.slice(0, 2).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                        {talent.specialties.length > 2 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                            +{talent.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-400 text-sm">
                    {new Date(talent.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    {talent.profiles?.email_verified ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/50">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">{renderTalentActions(talent)}</td>
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
          title="All Talent"
          subtitle="View and manage all talent profiles on the platform."
        />

        <div className="md:hidden">
          <MobileSummaryRow
            items={[
              { label: "Total", value: totalTalent, icon: UserIcon },
              { label: "Verified", value: verifiedTalent, icon: CheckCircle },
              { label: "Unverified", value: unverifiedTalent, icon: SlidersHorizontal },
            ]}
          />
        </div>
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-medium text-white">
            {totalTalent} Total
          </div>
          <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-medium text-white">
            {verifiedTalent} Verified
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Talent Profiles</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="Search by name, location, or specialty..."
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
                    title="Talent Filters"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Verification</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant={verificationFilter === "all" ? "default" : "outline"}
                          className={verificationFilter === "all" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setVerificationFilter("all")}
                        >
                          All ({totalTalent})
                        </Button>
                        <Button
                          type="button"
                          variant={verificationFilter === "verified" ? "default" : "outline"}
                          className={verificationFilter === "verified" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setVerificationFilter("verified")}
                        >
                          Verified ({verifiedTalent})
                        </Button>
                        <Button
                          type="button"
                          variant={verificationFilter === "unverified" ? "default" : "outline"}
                          className={verificationFilter === "unverified" ? "" : "border-gray-600 text-gray-300"}
                          onClick={() => setVerificationFilter("unverified")}
                        >
                          Unverified ({unverifiedTalent})
                        </Button>
                      </div>
                    </div>
                  </FiltersSheet>
                </div>
                <div className="hidden md:block">
                  <Button
                    variant="outline"
                    onClick={() => setVerificationFilter("all")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {activeFilterCount > 0 ? "Filters (1)" : "Filters"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {renderTalentContent()}
        </div>
      </div>
    </PageShell>
  );
}

