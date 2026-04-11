"use client";

import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { Card, CardContent } from "@/components/ui/card";

interface BookingsStatsOverviewProps {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export default function BookingsStatsOverview({ stats }: BookingsStatsOverviewProps) {
  return (
    <>
      <div className="mb-4 md:hidden">
        <details>
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--oklch-text-secondary)]">
            <span className="inline-flex items-center gap-2">
              Show stats
              <span className="text-xs text-[var(--oklch-text-muted)]">({stats.total} total)</span>
            </span>
          </summary>
          <div className="mt-2">
            <MobileSummaryRow
              items={[
                { label: "Total", value: stats.total, icon: Calendar },
                { label: "Pending", value: stats.pending, icon: Clock },
                { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2 },
                { label: "Completed", value: stats.completed, icon: CheckCircle2 },
                { label: "Cancelled", value: stats.cancelled, icon: XCircle },
              ]}
            />
          </div>
        </details>
      </div>

      <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-[var(--oklch-text-muted)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
