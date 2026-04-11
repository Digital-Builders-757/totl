"use client";

import {
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { Booking } from "@/app/client/bookings/types";
import { ClientTerminalHeader } from "@/components/client/client-terminal-header";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TotlAtmosphereShell } from "@/components/ui/totl-atmosphere-shell";
import { cancelBooking, getClientBookings, updateBookingStatus } from "@/lib/actions/booking-actions";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

const BookingsStatsOverview = dynamic(() => import("./components/bookings-stats-overview"), {
  ssr: false,
});
const BookingsResultsContent = dynamic(() => import("./components/bookings-results-content"), {
  ssr: false,
});

interface ClientBookingsClientProps {
  userId: string;
  initialBookings: Booking[];
}

export default function ClientBookingsClient({ userId, initialBookings }: ClientBookingsClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: bookings = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Booking[]>(
    ["client-bookings", userId],
    async () => {
      const result = await getClientBookings();
      if (result.error) {
        throw new Error(result.error);
      }
      return (result.bookings as Booking[]) ?? [];
    },
    {
      fallbackData: initialBookings,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
    }
  );

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    const previous = bookings;
    mutate(
      bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
      ),
      { revalidate: false }
    );

    const result = await cancelBooking({ bookingId });
    if (result.error) {
      mutate(previous, { revalidate: false });
      alert(result.error);
      logger.warn("[client/bookings] cancelBooking failed, rolled back optimistic state", {
        bookingId,
        error: result.error,
      });
      return;
    }

    mutate();
  };

  const handleUpdateStatus = async (bookingId: string, status: Database["public"]["Enums"]["booking_status"]) => {
    const previous = bookings;
    mutate(
      bookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)),
      { revalidate: false }
    );

    const result = await updateBookingStatus({ bookingId, status });
    if (result.error) {
      mutate(previous, { revalidate: false });
      alert(result.error);
      logger.warn("[client/bookings] updateBookingStatus failed, rolled back optimistic state", {
        bookingId,
        status,
        error: result.error,
      });
      return;
    }

    mutate();
  };

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (activeTab === "all") return true;
        return booking.status === activeTab;
      }),
    [bookings, activeTab]
  );

  const bookingStats = useMemo(() => {
    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const booking of bookings) {
      if (booking.status === "pending") stats.pending += 1;
      else if (booking.status === "confirmed") stats.confirmed += 1;
      else if (booking.status === "completed") stats.completed += 1;
      else if (booking.status === "cancelled") stats.cancelled += 1;
    }

    return stats;
  }, [bookings]);

  if (isLoading) {
    return (
      <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
        <div className="px-4 py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-9 w-56 rounded-lg bg-muted/40" />
              <Skeleton className="h-4 w-72 max-w-full rounded-lg bg-muted/35" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
              <Skeleton className="h-24 w-full rounded-xl bg-muted/35" />
            </div>
            <Skeleton className="h-[420px] w-full rounded-xl bg-muted/35" />
          </div>
        </div>
      </TotlAtmosphereShell>
    );
  }

  if (error) {
    return (
      <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
        <div className="flex min-h-[100dvh] items-center justify-center px-4">
          <div className="panel-frosted card-backlit max-w-md rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold">Error</h2>
            <p className="mb-4 text-[var(--oklch-text-muted)]">
              {error instanceof Error ? error.message : "Failed to load bookings"}
            </p>
            <Button onClick={() => mutate()}>Try Again</Button>
          </div>
        </div>
      </TotlAtmosphereShell>
    );
  }

  return (
    <TotlAtmosphereShell ambientTone="lifted" className="text-[var(--oklch-text-primary)]">
      <ClientTerminalHeader
        title="Bookings"
        subtitle="Manage your confirmed talent bookings"
        desktopPrimaryAction={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/client/applications">View Applications</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/client/gigs">My Opportunities</Link>
            </Button>
          </div>
        }
        mobileSecondaryAction={
          <SecondaryActionLink href="/client/applications">View applications →</SecondaryActionLink>
        }
      />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <BookingsStatsOverview stats={bookingStats} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <MobileTabRail>
            <TabsList className="tabs-list-surface inline-flex h-auto min-w-max gap-1 rounded-xl p-1">
              <TabsTrigger value="all" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                All ({bookingStats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Pending ({bookingStats.pending})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Confirmed ({bookingStats.confirmed})
              </TabsTrigger>
              <TabsTrigger value="completed" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Completed ({bookingStats.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="min-h-10 whitespace-nowrap px-3 py-2 text-xs">
                Cancelled ({bookingStats.cancelled})
              </TabsTrigger>
            </TabsList>
          </MobileTabRail>
          <TabsList className="tabs-list-surface hidden w-full grid-cols-5 md:grid">
            <TabsTrigger value="all">All ({bookingStats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({bookingStats.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({bookingStats.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({bookingStats.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({bookingStats.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <BookingsResultsContent
              activeTab={activeTab}
              filteredBookings={filteredBookings}
              onUpdateStatus={handleUpdateStatus}
              onCancelBooking={handleCancelBooking}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TotlAtmosphereShell>
  );
}
