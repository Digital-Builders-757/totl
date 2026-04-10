"use client";

import { CheckCircle2, Clock, DollarSign, MapPin, MoreVertical, XCircle } from "lucide-react";
import Link from "next/link";
import type { Application } from "@/app/client/applications/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaThumb } from "@/components/ui/media-thumb";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { publicBucketUrl } from "@/lib/utils/storage-urls";

interface DesktopApplicationsListProps {
  applications: Application[];
  getTalentName: (application: Application) => string;
  getTalentProfileHref: (application: Application) => string;
  getInitials: (name: string) => string;
  onAccept: (application: Application) => void;
  onReject: (application: Application) => void;
}

export default function DesktopApplicationsList({
  applications,
  getTalentName,
  getTalentProfileHref,
  getInitials,
  onAccept,
  onReject,
}: DesktopApplicationsListProps) {
  return (
    <div className="hidden space-y-4 md:block">
      {applications.map((application) => {
        const talentName = getTalentName(application);
        const talentInitials = getInitials(talentName);
        const profileHref = getTalentProfileHref(application);
        const appliedDate = new Date(application.created_at).toLocaleDateString();
        const showDecisionMenu =
          application.status === "new" || application.status === "under_review";

        const avatarSrc =
          application.profiles?.avatar_url ||
          publicBucketUrl("avatars", application.profiles?.avatar_path);

        return (
          <Card
            key={application.id}
            className="panel-frosted border-white/10 bg-[var(--totl-surface-glass-strong)] transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <MediaThumb
                  src={avatarSrc}
                  alt={`${talentName} profile`}
                  variant="talent"
                  fallbackText={talentInitials}
                  className="w-16 md:w-20"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">{talentName}</h3>
                      <p className="text-sm text-[var(--oklch-text-secondary)]">
                        {application.gigs?.title || "Gig"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--oklch-text-tertiary)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {application.gigs?.location || "Location TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {application.gigs?.compensation || "Comp TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Applied {appliedDate}
                        </span>
                      </div>
                    </div>
                    <ApplicationStatusBadge status={application.status} showIcon={true} />
                  </div>
                  <div className="flex items-center justify-between border-t border-border/35 pt-3 text-sm">
                    <span className="text-xs text-[var(--oklch-text-tertiary)]">Next action</span>
                    <div className="flex items-center gap-2">
                      <Link href={profileHref} className="text-[var(--oklch-text-primary)] hover:underline">
                        Review profile
                      </Link>
                      {showDecisionMenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More actions"
                              className="h-11 w-11 text-[var(--oklch-text-tertiary)] hover:bg-white/10 hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                            <DropdownMenuItem
                              data-test="accept-application"
                              onClick={() => onAccept(application)}
                              className="text-[var(--oklch-text-secondary)] focus:text-white"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                              Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onReject(application)}
                              className="text-[var(--oklch-text-secondary)] focus:text-white"
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-400" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-[var(--oklch-text-tertiary)]">
                          {application.status === "accepted" ? "Accepted" : "Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
