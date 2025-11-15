"use client";

import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientBookings, cancelBooking, updateBookingStatus } from "@/lib/actions/booking-actions";
import type { Database } from "@/types/supabase";

// Force dynamic rendering
export const dynamic = "force-dynamic";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  gigs?: {
    id: string;
    title: string;
    category?: string;
    location: string;
    date: string;
  };
  profiles?: {
    display_name: string | null;
    avatar_path: string | null;
    role: string;
  };
};

export default function ClientBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);

    const result = await getClientBookings();
    if (result.error) {
      setError(result.error);
    } else if (result.bookings) {
      setBookings(result.bookings as Booking[]);
    }

    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    const result = await cancelBooking({ bookingId });
    if (result.error) {
      alert(result.error);
    } else {
      loadBookings();
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: Database["public"]["Enums"]["booking_status"]) => {
    const result = await updateBookingStatus({ bookingId, status });
    if (result.error) {
      alert(result.error);
    } else {
      loadBookings();
    }
  };

  // Removed getStatusColor and getStatusIcon - now using BookingStatusBadge component

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  });

  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={loadBookings}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="apple-glass border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Bookings</h1>
                <p className="text-gray-300">Manage your confirmed talent bookings</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/client/applications">View Applications</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/client/gigs">My Gigs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Total</p>
                  <p className="text-2xl font-bold text-white">{bookingStats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Pending</p>
                  <p className="text-2xl font-bold text-white">{bookingStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Confirmed</p>
                  <p className="text-2xl font-bold text-white">{bookingStats.confirmed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-white">{bookingStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Cancelled</p>
                  <p className="text-2xl font-bold text-white">{bookingStats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({bookingStats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({bookingStats.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({bookingStats.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({bookingStats.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({bookingStats.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
                  <p className="text-gray-300 mb-6">
                    {activeTab === "all"
                      ? "Accept applications to create bookings"
                      : `No ${activeTab} bookings at the moment`}
                  </p>
                  <Button asChild>
                    <Link href="/client/applications">View Applications</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="hover:shadow-md transition-shadow bg-gray-900 border-gray-700"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-white mb-2">
                            {booking.gigs?.title}
                          </CardTitle>
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
                                <DollarSign className="h-4 w-4" />
                                ${Number(booking.compensation).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <BookingStatusBadge status={booking.status} showIcon={true} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {booking.notes && (
                        <div className="mb-4 p-3 bg-gray-800 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-300">
                            <FileText className="h-4 w-4 inline mr-2" />
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/talent/${booking.talent_id}`}>View Talent Profile</Link>
                        </Button>

                        {booking.status === "confirmed" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(booking.id, "completed")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Mark Complete
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel Booking
                            </Button>
                          </>
                        )}

                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

