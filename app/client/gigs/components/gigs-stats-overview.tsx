"use client";

import { Building, CheckCircle, Users } from "lucide-react";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { Card, CardContent } from "@/components/ui/card";

interface GigsStatsOverviewProps {
  totalGigs: number;
  activeCount: number;
  completedCount: number;
  totalApplications: number;
}

export default function GigsStatsOverview({
  totalGigs,
  activeCount,
  completedCount,
  totalApplications,
}: GigsStatsOverviewProps) {
  return (
    <>
      <div className="mb-4 md:hidden">
        <details>
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--oklch-text-secondary)]">
            <span className="inline-flex items-center gap-2">
              Show stats
              <span className="text-xs text-[var(--oklch-text-muted)]">({totalGigs} total)</span>
            </span>
          </summary>
          <div className="mt-2">
            <MobileSummaryRow
              items={[
                { label: "Total opportunities", value: totalGigs, icon: Building },
                { label: "Active", value: activeCount, icon: CheckCircle },
                { label: "Applications", value: totalApplications, icon: Users },
                { label: "Completed", value: completedCount, icon: CheckCircle },
              ]}
            />
          </div>
        </details>
      </div>

      <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Total Opportunities</p>
                <p className="text-2xl font-bold">{totalGigs}</p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-2">
                <Building className="h-4 w-4 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <div className="rounded-full bg-green-500/20 p-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Total Applications</p>
                <p className="text-2xl font-bold">{totalApplications}</p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-2">
                <Users className="h-4 w-4 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <div className="rounded-full bg-emerald-500/20 p-2">
                <CheckCircle className="h-4 w-4 text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
