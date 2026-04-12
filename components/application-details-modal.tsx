"use client";

import { Calendar, Clock, DollarSign, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SafeImage } from "@/components/ui/safe-image";
import { PATHS } from "@/lib/constants/routes";
import { Database } from "@/types/supabase";

// Use generated database types
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
type ClientProfileRow = Database["public"]["Tables"]["client_profiles"]["Row"];

// Type for the application with joined gig and client data
// Matches ApplicationWithGigAndCompany structure from dashboard-actions.ts
interface Application extends ApplicationRow {
  gigs?: (Pick<
    GigRow,
    "id" | "title" | "description" | "category" | "location" | "compensation" | "image_url" | "date" | "client_id"
  > & {
    client_profiles?: Pick<ClientProfileRow, "company_name"> | null;
  }) | null;
}

/** Real booking data (when application is accepted) - overrides gig display for date/compensation */
interface BookingData {
  date: string;
  compensation: number | null;
  notes: string | null;
}

interface ApplicationDetailsModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  /** When provided (accepted application), shows real booking date/time, compensation, notes */
  booking?: BookingData | null;
}

const glassCardClass =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none";

export function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
  booking,
}: ApplicationDetailsModalProps) {
  if (!application) return null;

  const getStatusColor = (status: Database["public"]["Enums"]["application_status"]) => {
    switch (status) {
      case "accepted":
        return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";
      case "rejected":
        return "border-red-500/35 bg-red-500/15 text-red-300";
      case "new":
        return "border-amber-500/35 bg-amber-500/15 text-amber-200";
      case "under_review":
        return "border-sky-500/35 bg-sky-500/15 text-sky-200";
      case "shortlisted":
        return "border-violet-500/35 bg-violet-500/15 text-violet-200";
      default:
        return "border-white/15 bg-white/5 text-[var(--oklch-text-secondary)]";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "e-commerce": "border-sky-500/35 bg-sky-500/15 text-sky-200",
      commercial: "border-emerald-500/35 bg-emerald-500/15 text-emerald-200",
      editorial: "border-violet-500/35 bg-violet-500/15 text-violet-200",
      runway: "border-pink-500/35 bg-pink-500/15 text-pink-200",
      sportswear: "border-orange-500/35 bg-orange-500/15 text-orange-200",
      beauty: "border-amber-500/35 bg-amber-500/15 text-amber-200",
    };
    return (
      colors[category as keyof typeof colors] ||
      "border-white/15 bg-white/5 text-[var(--oklch-text-secondary)]"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="panel-frosted max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-white/10 bg-[var(--totl-surface-glass-strong)] p-4 text-white sm:w-full sm:p-6">
        <DialogHeader className="space-y-1 pr-8 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Application details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Gig Information */}
          <Card className={glassCardClass}>
            <CardHeader className="space-y-3">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                {application.gigs?.image_url && (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <SafeImage
                      src={application.gigs.image_url}
                      alt={application.gigs.title}
                      fill
                      className="object-cover"
                      placeholderQuery={application.gigs.category?.toLowerCase() || "general"}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <CardTitle className="text-lg font-semibold text-white sm:text-xl">
                    {application.gigs?.title}
                  </CardTitle>
                  <CardDescription className="text-[var(--oklch-text-secondary)]">
                    {application.gigs?.client_profiles?.company_name || "Private Client"}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className={getCategoryColor(application.gigs?.category || "General")}
                    >
                      {application.gigs?.category || "General"}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(application.status)}>
                      {application.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.gigs?.description && (
                <p className="text-sm leading-relaxed text-[var(--oklch-text-secondary)]">
                  {application.gigs.description}
                </p>
              )}

              <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div className="flex min-w-0 items-start gap-2 text-[var(--oklch-text-secondary)]">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--oklch-text-tertiary)]" />
                  <span className="text-sm leading-snug">{application.gigs?.location}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-secondary)]">
                  <DollarSign className="h-4 w-4 flex-shrink-0 text-[var(--oklch-text-tertiary)]" />
                  <span className="text-sm">
                    {booking?.compensation != null
                      ? `$${Number(booking.compensation).toLocaleString()}`
                      : application.gigs?.compensation
                        ? `$${application.gigs.compensation}`
                        : "TBD"}
                  </span>
                </div>
                {(booking?.date || application.gigs?.date) && (
                  <div className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-secondary)]">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-[var(--oklch-text-tertiary)]" />
                    <span className="text-sm">
                      {booking?.date
                        ? new Date(booking.date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: booking.date.includes("T") ? "short" : undefined,
                          })
                        : application.gigs?.date
                          ? new Date(application.gigs.date).toLocaleDateString()
                          : ""}
                    </span>
                  </div>
                )}
                <div className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-secondary)]">
                  <Clock className="h-4 w-4 flex-shrink-0 text-[var(--oklch-text-tertiary)]" />
                  <span className="text-sm">
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {booking?.notes && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="mb-2 text-sm font-medium text-white">Booking notes</p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--oklch-text-secondary)]">
                    {booking.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <MessageSquare className="h-5 w-5 text-[var(--oklch-accent)]" aria-hidden />
                Your application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">
                    Application ID
                  </span>
                  <span className="break-all text-right font-mono text-xs text-[var(--oklch-text-tertiary)] sm:max-w-[60%] sm:text-sm">
                    {application.id}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">Status</span>
                  <Badge variant="outline" className={getStatusColor(application.status)}>
                    {application.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">
                    Applied
                  </span>
                  <span className="text-sm text-[var(--oklch-text-tertiary)]">
                    {new Date(application.created_at).toLocaleString()}
                  </span>
                </div>
                {application.updated_at !== application.created_at && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">
                      Last updated
                    </span>
                    <span className="text-sm text-[var(--oklch-text-tertiary)]">
                      {new Date(application.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {application.message && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">
                    Cover letter
                  </span>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="whitespace-pre-wrap text-sm text-[var(--oklch-text-secondary)]">
                      {application.message}
                    </p>
                  </div>
                </div>
              )}

              {!application.message && (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center">
                  <MessageSquare
                    className="mx-auto mb-2 h-8 w-8 text-[var(--oklch-text-tertiary)]"
                    aria-hidden
                  />
                  <p className="text-sm text-[var(--oklch-text-secondary)]">
                    No cover letter on file for this application.
                  </p>
                  <p className="mt-2 text-xs text-[var(--oklch-text-tertiary)]">
                    Future applications can include a short note from the apply flow.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">What happens next</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(application.status === "new" || application.status === "under_review") && (
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium text-white">
                        {application.status === "new" ? "Submitted" : "Under review"}
                      </p>
                      <p className="text-sm text-[var(--oklch-text-secondary)]">
                        The client is reviewing your application. We&apos;ll notify you here when the
                        status changes—no need to follow up unless they reach out.
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="mt-1 border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
                      >
                        <Link href={PATHS.GIGS}>Browse open gigs</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {application.status === "shortlisted" && (
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-violet-400"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium text-white">Shortlisted</p>
                      <p className="text-sm text-[var(--oklch-text-secondary)]">
                        You&apos;re in the running. Watch your inbox and this dashboard—the client may
                        request more details or next steps soon.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Link href={PATHS.TALENT_DASHBOARD}>Back to dashboard</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {application.status === "accepted" && (
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium text-white">Accepted</p>
                      <p className="text-sm text-[var(--oklch-text-secondary)]">
                        Confirmed details and booking notes (if any) appear above. Check your
                        dashboard for scheduling and follow up with the client through the agreed
                        channel.
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
                      >
                        <Link href={PATHS.TALENT_DASHBOARD}>Open dashboard</Link>
                      </Button>
                    </div>
                  </div>
                )}
                {application.status === "rejected" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" aria-hidden />
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium text-white">Not selected</p>
                      <p className="text-sm text-[var(--oklch-text-secondary)]">
                        This role went another direction. Your profile stays visible for future
                        opportunities—keep momentum with roles that fit you.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Link href={PATHS.GIGS}>Find your next gig</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
