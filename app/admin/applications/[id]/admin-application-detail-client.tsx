"use client";

import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  User as UserIcon,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { adminSetApplicationStatusAction } from "@/lib/actions/admin-application-actions";
import { userSafeMessageFromActionError } from "@/lib/errors/user-safe-message";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type ApplicationWithDetails = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    location: string;
    compensation: string | null;
    duration: string | null;
    date: string;
    application_deadline: string | null;
    status: string;
    image_url: string | null;
    created_at: string;
    client_profiles: {
      company_name: string | null;
      contact_name: string | null;
      contact_email: string | null;
    } | null;
  } | null;
  talent_profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    talent_profiles: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      age: number | null;
      location: string | null;
      experience: string | null;
      experience_years: number | null;
      specialties: string[] | null;
      portfolio_url: string | null;
      height: string | null;
      measurements: string | null;
      hair_color: string | null;
      eye_color: string | null;
    } | null;
  } | null;
};

interface AdminApplicationDetailClientProps {
  application: ApplicationWithDetails;
  user: User;
}

export function AdminApplicationDetailClient({
  application,
  user,
}: AdminApplicationDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const talent = application.talent_profiles; // This has display_name and avatar_url from profiles table
  const gig = application.gigs;
  const talentProfile = talent?.talent_profiles; // This has talent_profiles data

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const result = await adminSetApplicationStatusAction({
        applicationId: application.id,
        status: "accepted",
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: userSafeMessageFromActionError(
            result.error,
            "We couldn’t approve this application. Please try again."
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Application Approved",
          description: "The talent application has been approved successfully.",
        });
        router.push("/admin/applications");
        router.refresh();
      }
    } catch (error) {
      logger.error("Error approving application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await adminSetApplicationStatusAction({
        applicationId: application.id,
        status: "rejected",
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: userSafeMessageFromActionError(
            result.error,
            "We couldn’t reject this application. Please try again."
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Application Rejected",
          description: "The talent application has been rejected.",
        });
        router.push("/admin/applications");
        router.refresh();
      }
    } catch (error) {
      logger.error("Error rejecting application", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowRejectDialog(false);
    }
  };

  const talentProfileHref = application.talent_id ? `/talent/${application.talent_id}` : null;

  return (
    <PageShell topPadding={false} fullBleed ambientTone="lifted">
      <AdminHeader user={user} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <PageHeader
          title="Application details"
          subtitle={`Application ID: ${application.id.slice(0, 8)}...`}
          breadcrumbs={
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-2 text-[var(--oklch-text-secondary)] transition-colors hover:text-[var(--oklch-text-primary)]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back to applications
            </Link>
          }
          actions={
            application.status === "new" || application.status === "under_review" ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-green-700 text-green-400 hover:bg-green-900/20 hover:text-green-300"
                  onClick={() => setShowApproveDialog(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : undefined
          }
          className="mb-6 sm:mb-8"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Info */}
            <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  Application Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[var(--oklch-text-secondary)]">Status</Label>
                  <ApplicationStatusBadge status={application.status} showIcon={true} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[var(--oklch-text-secondary)]">Applied Date</Label>
                  <span className="text-white">
                    {new Date(application.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[var(--oklch-text-secondary)]">Last Updated</Label>
                  <span className="text-white">
                    {new Date(application.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {application.message && (
                  <div className="pt-4 border-t border-white/10">
                    <Label className="text-[var(--oklch-text-secondary)] mb-2 block">Application Message</Label>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <p className="text-white whitespace-pre-wrap">{application.message}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gig Information */}
            {gig && (
              <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-400" />
                    Gig Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{gig.title}</h3>
                    <p className="text-[var(--oklch-text-secondary)] mb-4">{gig.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[var(--oklch-text-secondary)]">Category</Label>
                      <p className="text-white capitalize">{gig.category}</p>
                    </div>
                    <div>
                      <Label className="text-[var(--oklch-text-secondary)]">Location</Label>
                      <p className="text-white flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {gig.location}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[var(--oklch-text-secondary)]">Compensation</Label>
                      <p className="text-white flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {gig.compensation || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[var(--oklch-text-secondary)]">Gig Date</Label>
                      <p className="text-white flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(gig.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {gig.client_profiles && (
                    <div className="pt-4 border-t border-white/10">
                      <Label className="text-[var(--oklch-text-secondary)] mb-2 block">Client</Label>
                      <p className="text-white">{gig.client_profiles.company_name || "N/A"}</p>
                      {gig.client_profiles.contact_name && (
                        <p className="text-[var(--oklch-text-secondary)] text-sm">{gig.client_profiles.contact_name}</p>
                      )}
                    </div>
                  )}
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10" asChild>
                    <Link href={`/admin/gigs/${gig.id}`}>
                      View Opportunity Details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

                {/* Talent Profile */}
                {talent && talentProfile && (
                  <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-green-400" />
                        Talent Profile: {talent?.display_name || (talentProfile ? `${talentProfile.first_name} ${talentProfile.last_name}` : "Unknown")}
                      </CardTitle>
                      <CardDescription className="text-[var(--oklch-text-secondary)]">
                        Details about the talent who submitted this application.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={talent?.avatar_url || "/images/totl-logo-transparent.png"} alt={talent?.display_name || "Talent"} />
                          <AvatarFallback>
                            {talent?.display_name?.charAt(0) || talentProfile?.first_name?.charAt(0) || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xl font-semibold text-white">
                            {talentProfile?.first_name || ""} {talentProfile?.last_name || ""}
                          </p>
                          {talent?.display_name && (
                            <p className="text-[var(--oklch-text-secondary)]">{talent.display_name}</p>
                          )}
                        </div>
                      </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {talentProfile.location && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Location</Label>
                        <p className="text-white flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {talentProfile.location}
                        </p>
                      </div>
                    )}
                    {talentProfile.age && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Age</Label>
                        <p className="text-white">{talentProfile.age}</p>
                      </div>
                    )}
                    {talentProfile.experience_years && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Experience</Label>
                        <p className="text-white">{talentProfile.experience_years} years</p>
                      </div>
                    )}
                    {talentProfile.height && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Height</Label>
                        <p className="text-white">{talentProfile.height}</p>
                      </div>
                    )}
                    {talentProfile.hair_color && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Hair Color</Label>
                        <p className="text-white">{talentProfile.hair_color}</p>
                      </div>
                    )}
                    {talentProfile.eye_color && (
                      <div>
                        <Label className="text-[var(--oklch-text-secondary)]">Eye Color</Label>
                        <p className="text-white">{talentProfile.eye_color}</p>
                      </div>
                    )}
                  </div>
                  {talentProfile.experience && (
                    <div className="pt-4 border-t border-white/10">
                      <Label className="text-[var(--oklch-text-secondary)] mb-2 block">Experience</Label>
                      <p className="text-white">{talentProfile.experience}</p>
                    </div>
                  )}
                  {talentProfile.specialties && talentProfile.specialties.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <Label className="text-[var(--oklch-text-secondary)] mb-2 block">Specialties</Label>
                      <div className="flex flex-wrap gap-2">
                        {talentProfile.specialties.map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm border border-purple-700"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10" asChild>
                    <Link href={talentProfileHref ?? `/talent/${talent?.id}`}>
                      View Full Talent Profile
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/admin/applications">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Applications
                  </Link>
                </Button>
                {gig && (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href={`/admin/gigs/${gig.id}`}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Opportunity
                    </Link>
                  </Button>
                )}
                {talentProfileHref && (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href={talentProfileHref}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      View Talent Profile
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Application Metadata */}
            <Card className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)]">
              <CardHeader>
                <CardTitle className="text-white">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-[var(--oklch-text-secondary)]">Application ID</Label>
                  <p className="text-white font-mono text-xs break-all">{application.id}</p>
                </div>
                <div>
                  <Label className="text-[var(--oklch-text-secondary)]">Gig ID</Label>
                  <p className="text-white font-mono text-xs break-all">{application.gig_id}</p>
                </div>
                <div>
                  <Label className="text-[var(--oklch-text-secondary)]">Talent ID</Label>
                  <p className="text-white font-mono text-xs break-all">{application.talent_id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Approve Talent Application</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              Are you sure you want to approve this talent application? This will notify the talent
              and client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes" className="text-[var(--oklch-text-secondary)]">
                Admin Notes (Optional)
              </Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes about this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-white/10 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? "Processing..." : "Approve Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Talent Application</DialogTitle>
            <DialogDescription className="text-[var(--oklch-text-secondary)]">
              Are you sure you want to reject this talent application? This will notify the talent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason" className="text-[var(--oklch-text-secondary)]">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this application"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                required
                className="border-white/10 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
              className="border-white/10 bg-white/5 text-[var(--oklch-text-secondary)] hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? "Processing..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

