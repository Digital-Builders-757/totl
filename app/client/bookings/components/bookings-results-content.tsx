"use client";

import { Calendar, DollarSign, FileText, MapPin, User } from "lucide-react";
import Link from "next/link";
import type { Booking } from "@/app/client/bookings/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import type { Database } from "@/types/supabase";

interface BookingsResultsContentProps {
  activeTab: string;
  filteredBookings: Booking[];
  onUpdateStatus: (bookingId: string, status: Database["public"]["Enums"]["booking_status"]) => void;
  onCancelBooking: (bookingId: string) => void;
}

export default function BookingsResultsContent({
  activeTab,
  filteredBookings,
  onUpdateStatus,
  onCancelBooking,
}: BookingsResultsContentProps) {
  if (filteredBookings.length === 0) {
    return (
      <Card className="border-gray-700 bg-gray-900">
        <CardContent className="p-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-white">No bookings found</h3>
          <p className="mb-6 text-gray-300">
            {activeTab === "all"
              ? "Accept applications to create bookings"
              : `No ${activeTab} bookings at the moment`}
          </p>
          <Button asChild>
            <Link href="/client/applications">View Applications</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredBookings.map((booking) => (
        <Card key={booking.id} className="border-gray-700 bg-gray-900 transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-2 text-xl text-white">{booking.gigs?.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {booking.profiles?.display_name || "Unknown Talent"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {booking.gigs?.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(booking.date).toLocaleDateString()}
                  </span>
                  {booking.compensation && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />$
                      {Number(booking.compensation).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <BookingStatusBadge status={booking.status} showIcon={true} />
            </div>
          </CardHeader>

          <CardContent>
            {booking.notes && (
              <div className="mb-4 rounded-md border border-gray-700 bg-gray-800 p-3">
                <p className="text-sm text-gray-300">
                  <FileText className="mr-2 inline h-4 w-4" />
                  {booking.notes}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/talent/${booking.talent_id}`}>
                  View Talent Profile
                </Link>
              </Button>

              {booking.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(booking.id, "completed")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Mark Complete
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onCancelBooking(booking.id)}>
                    Cancel Booking
                  </Button>
                </>
              )}

              {booking.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(booking.id, "confirmed")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirm
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onCancelBooking(booking.id)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
