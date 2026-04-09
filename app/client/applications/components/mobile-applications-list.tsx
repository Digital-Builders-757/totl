"use client";

import { CheckCircle2, MoreVertical, XCircle } from "lucide-react";
import Link from "next/link";
import type { Application } from "@/app/client/applications/types";
import { MobileListRowCard } from "@/components/dashboard/mobile-list-row-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";

interface MobileApplicationsListProps {
  applications: Application[];
  getTalentName: (application: Application) => string;
  getTalentProfileHref: (application: Application) => string;
  onAccept: (application: Application) => void;
  onReject: (application: Application) => void;
}

export default function MobileApplicationsList({
  applications,
  getTalentName,
  getTalentProfileHref,
  onAccept,
  onReject,
}: MobileApplicationsListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {applications.map((application) => {
        const talentName = getTalentName(application);
        const profileHref = getTalentProfileHref(application);
        const appliedDate = new Date(application.created_at).toLocaleDateString();
        const showDecisionMenu =
          application.status === "new" || application.status === "under_review";

        return (
          <MobileListRowCard
            key={`${application.id}-mobile`}
            title={talentName}
            subtitle={application.gigs?.title || "Gig"}
            badge={<ApplicationStatusBadge status={application.status} showIcon={false} />}
            meta={[
              {
                label: "Location",
                value: application.gigs?.location || "Location TBD",
              },
              {
                label: "Comp",
                value: application.gigs?.compensation || "Comp TBD",
              },
              {
                label: "Applied",
                value: appliedDate,
              },
            ]}
            trailing={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="More actions"
                    className="h-11 w-11 text-gray-400 hover:bg-gray-700"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="panel-frosted border-border/50">
                  <DropdownMenuItem asChild className="text-gray-200 focus:text-white">
                    <Link href={profileHref}>Review profile</Link>
                  </DropdownMenuItem>
                  {showDecisionMenu ? (
                    <>
                      <DropdownMenuItem
                        data-test="accept-application"
                        onClick={() => onAccept(application)}
                        className="text-gray-200 focus:text-white"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                        Accept
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onReject(application)}
                        className="text-gray-200 focus:text-white"
                      >
                        <XCircle className="mr-2 h-4 w-4 text-red-400" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            }
            footer={
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Next action</span>
                <Link href={profileHref} className="text-[var(--oklch-text-primary)] hover:underline">
                  Review profile
                </Link>
              </div>
            }
          />
        );
      })}
    </div>
  );
}
