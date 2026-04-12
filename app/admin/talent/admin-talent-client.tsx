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
          <Link
            href={`/talent/${talent.user_id}`}
            className="flex items-center text-[var(--oklch-text-secondary)] hover:bg-white/10"
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <UserIcon className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No talent found</h3>
          <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">
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
              <tr className="bg-gradient-to-r from-card/45 to-card/28">
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Talent
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Location
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Experience
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Specialties
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Joined
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Status
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--oklch-text-secondary)] py-4 px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredTalent.map((talent) => (
                <tr key={talent.id} className="hover:bg-card/22 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 font-semibold text-white">
                        {talent.first_name.charAt(0)}
                        {talent.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">
                          {talent.first_name} {talent.last_name}
                        </div>
                        {talent.profiles?.display_name && (
                          <div className="text-xs text-[var(--oklch-text-secondary)]">
                            {talent.profiles.display_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {talent.location ? (
                      <div className="flex items-center gap-2 text-sm text-[var(--oklch-text-secondary)]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {talent.location}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--oklch-text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-[var(--oklch-text-secondary)]">
                    {talent.experience_years ? `${talent.experience_years} years` : "—"}
                  </td>
                  <td className="py-4 px-6">
                    {talent.specialties && talent.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {talent.specialties.slice(0, 2).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[var(--oklch-text-secondary)]"
                          >
                            {specialty}
                          </span>
                        ))}
                        {talent.specialties.length > 2 && (
                          <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[var(--oklch-text-tertiary)]">
                            +{talent.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--oklch-text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-[var(--oklch-text-secondary)]">
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
    <PageShell topPadding={false} fullBleed>
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
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm">
            <span className="text-[var(--oklch-text-tertiary)]">Total </span>
            {totalTalent}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm">
            <span className="text-[var(--oklch-text-tertiary)]">Verified </span>
            {verifiedTalent}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm">
            <span className="text-[var(--oklch-text-tertiary)]">Unverified </span>
            {unverifiedTalent}
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl panel-frosted card-backlit shadow-lg">
          <div className="border-b border-border/40 bg-gradient-to-r from-card/40 to-card/25 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Talent Profiles</h2>
              <div className="flex w-full min-w-0 flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end md:gap-3">
                <div className="relative min-w-0 w-full sm:max-w-[min(100%,20rem)]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--oklch-text-tertiary)]"
                    size={16}
                  />
                  <Input
                    placeholder="Search by name, location, or specialty..."
                    className="w-full pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2 md:hidden">
                  <FiltersSheet
                    open={isFiltersOpen}
                    onOpenChange={setIsFiltersOpen}
                    activeCount={activeFilterCount}
                    title="Talent Filters"
                    className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-[var(--oklch-text-tertiary)]">Verification</p>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant={verificationFilter === "all" ? "default" : "outline"}
                          className={
                            verificationFilter === "all"
                              ? ""
                              : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"
                          }
                          onClick={() => setVerificationFilter("all")}
                        >
                          All ({totalTalent})
                        </Button>
                        <Button
                          type="button"
                          variant={verificationFilter === "verified" ? "default" : "outline"}
                          className={
                            verificationFilter === "verified"
                              ? ""
                              : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"
                          }
                          onClick={() => setVerificationFilter("verified")}
                        >
                          Verified ({verifiedTalent})
                        </Button>
                        <Button
                          type="button"
                          variant={verificationFilter === "unverified" ? "default" : "outline"}
                          className={
                            verificationFilter === "unverified"
                              ? ""
                              : "border-white/10 bg-white/5 text-[var(--oklch-text-secondary)]"
                          }
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
                    className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
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

