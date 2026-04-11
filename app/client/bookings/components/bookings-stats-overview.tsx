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
              <span className="text-xs text-[var(--oklch-text-tertiary)]">({stats.total} total)</span>
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
        <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="rounded-full bg-white/10 p-2">
                <Calendar className="h-4 w-4 text-[var(--oklch-text-tertiary)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <div className="rounded-full bg-yellow-500/20 p-2">
                <Clock className="h-4 w-4 text-yellow-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Confirmed</p>
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              </div>
              <div className="rounded-full bg-green-500/20 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="rounded-full bg-blue-500/20 p-2">
                <CheckCircle2 className="h-4 w-4 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--oklch-text-secondary)]">Cancelled</p>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <div className="rounded-full bg-red-500/20 p-2">
                <XCircle className="h-4 w-4 text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
