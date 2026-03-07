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
          <summary className="cursor-pointer list-none text-sm font-medium text-gray-300">
            <span className="inline-flex items-center gap-2">
              Show stats
              <span className="text-xs text-gray-500">({stats.total} total)</span>
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

      <div className="mb-8 hidden grid-cols-2 gap-4 md:grid md:grid-cols-5">
        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Confirmed</p>
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-700 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Cancelled</p>
                <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
