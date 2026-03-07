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
          <summary className="cursor-pointer list-none text-sm font-medium text-gray-300">
            <span className="inline-flex items-center gap-2">
              Show stats
              <span className="text-xs text-gray-500">({totalGigs} total)</span>
            </span>
          </summary>
          <div className="mt-2">
            <MobileSummaryRow
              items={[
                { label: "Total gigs", value: totalGigs, icon: Building },
                { label: "Active", value: activeCount, icon: CheckCircle },
                { label: "Applications", value: totalApplications, icon: Users },
                { label: "Completed", value: completedCount, icon: CheckCircle },
              ]}
            />
          </div>
        </details>
      </div>

      <div className="mb-8 hidden grid-cols-2 gap-4 md:grid md:grid-cols-4">
        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Gigs</p>
                <p className="text-2xl font-bold text-white">{totalGigs}</p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-2">
                <Building className="h-4 w-4 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Active</p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
              <div className="rounded-full bg-green-500/20 p-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Applications</p>
                <p className="text-2xl font-bold text-white">{totalApplications}</p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-2">
                <Users className="h-4 w-4 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-white">{completedCount}</p>
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
