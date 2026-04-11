"use client";

import { Calendar, CheckCircle, ChevronRight, Briefcase, Users, FileText, Clock as ClockIcon } from "lucide-react";
import Link from "next/link";
import type { DashboardApplication, DashboardGig } from "@/app/client/dashboard/types";
import { MobileSummaryRow } from "@/components/dashboard/mobile-summary-row";
import { SecondaryActionLink } from "@/components/dashboard/secondary-action-link";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionBanner } from "@/components/ui/profile-completion-banner";
import { SafeImage } from "@/components/ui/safe-image";
import { ApplicationStatusBadge, GigStatusBadge } from "@/components/ui/status-badge";
import { getCategoryLabel } from "@/lib/constants/gig-categories";

interface OverviewTabContentProps {
  missingFields: string[];
  dashboardStats: {
    activeGigs: number;
    totalApplications: number;
    newApplications: number;
    closedGigs: number;
  };
  gigs: DashboardGig[];
  applications: DashboardApplication[];
  upcomingDeadlines: DashboardGig[];
  getCategoryColor: (category: string | undefined) => string;
}

export default function OverviewTabContent({
  missingFields,
  dashboardStats,
  gigs,
  applications,
  upcomingDeadlines,
  getCategoryColor,
}: OverviewTabContentProps) {
  return (
    <div className="space-y-6">
      <ProfileCompletionBanner
        userRole="client"
        missingFields={missingFields}
        profileUrl="/client/profile"
      />
      <div className="space-y-2 md:hidden">
        <MobileSummaryRow
          items={[
            { label: "Active gigs", value: dashboardStats.activeGigs, icon: Briefcase },
            { label: "Applications", value: dashboardStats.totalApplications, icon: Users },
            { label: "New", value: dashboardStats.newApplications, icon: ClockIcon },
            { label: "Closed", value: dashboardStats.closedGigs, icon: CheckCircle },
          ]}
        />
        <div className="px-1">
          <SecondaryActionLink href="/client/post-gig">Post an opportunity</SecondaryActionLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="totl-border-violet totl-hover-glow">
          <Card className="totl-border-violet-inner">
            <CardHeader>
              <div className="card-header-row">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Briefcase className="h-5 w-5 text-white" />
                  Recent Gigs
                </CardTitle>
                <GigStatusBadge
                  status="active"
                  className="status-chip shrink-0 whitespace-nowrap border-[var(--totl-violet-border)]"
                />
              </div>
              <CardDescription className="text-[var(--oklch-text-tertiary)]">
                Your latest gig postings and their status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gigs.length > 0 ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {gigs.slice(0, 3).map((gig) => (
                      <div key={`${gig.id}-mobile`} className="panel-frosted rounded-xl p-3">
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={gig.image_url || "/images/totl-logo.png"}
                            alt={gig.title}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                            fallbackSrc="/images/totl-logo-transparent.png"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-sm font-semibold text-white">{gig.title}</p>
                            <div className="flex items-center gap-2 text-xs text-[var(--oklch-text-tertiary)]">
                              <GigStatusBadge status={gig.status ?? "draft"} />
                              <span>{gig.location}</span>
                            </div>
                            <p className="text-xs text-[var(--oklch-text-tertiary)]">
                              {gig.applications_count || 0} applications
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-[var(--oklch-text-tertiary)] hover:bg-card/30">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="card-footer-row">
                          <span>Next action</span>
                          <Link href="/client/gigs" className="text-[var(--oklch-text-primary)] hover:underline">
                            Review gig
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden space-y-4 md:block">
                    {gigs.slice(0, 3).map((gig) => (
                      <div key={gig.id} className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/15 p-3">
                        <SafeImage
                          src={gig.image_url || "/images/totl-logo.png"}
                          alt={gig.title}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                          fallbackSrc="/images/totl-logo-transparent.png"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-medium text-white">{gig.title}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className={getCategoryColor(gig.category)}>
                              {getCategoryLabel(gig.category ?? "")}
                            </Badge>
                            <GigStatusBadge status={gig.status ?? "draft"} />
                          </div>
                          <p className="mt-1 text-sm text-[var(--oklch-text-tertiary)]">
                            {gig.applications_count || 0} applications - {gig.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{gig.compensation}</p>
                          <p className="text-sm text-[var(--oklch-text-tertiary)]">{gig.created_at}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No gigs posted yet"
                  description="Start by creating your first gig to attract talent"
                  className="totl-surface-card"
                  action={{
                    label: "Post Your First Gig",
                    href: "/client/post-gig",
                  }}
                />
              )}

              {gigs.length > 0 ? (
                <Button
                  variant="outline"
                  className="w-full border-border/50 bg-card/30 text-white backdrop-blur-sm"
                  asChild
                >
                  <Link href="/client/gigs">View All Gigs</Link>
                </Button>
              ) : (
                <div className="px-1">
                  <SecondaryActionLink href="/client/gigs">Open gigs workspace -&gt;</SecondaryActionLink>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="totl-border-violet totl-hover-glow">
          <Card className="totl-border-violet-inner">
            <CardHeader>
              <div className="card-header-row">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-white" />
                  Recent Applications
                </CardTitle>
                <Badge
                  variant="outline"
                  className="status-chip shrink-0 whitespace-nowrap border-[var(--totl-violet-border)]"
                >
                  New
                </Badge>
              </div>
              <CardDescription className="text-[var(--oklch-text-tertiary)]">
                Latest talent applications to review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[var(--oklch-text-tertiary)]">
                Clients only see talent who applied to their gigs—no public directory is exposed.
              </p>
              {applications.length > 0 ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {applications.slice(0, 3).map((application) => (
                      <div
                        key={`${application.id}-mobile`}
                        className="panel-frosted rounded-xl p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-white">
                              {application.talent_profiles?.first_name} {application.talent_profiles?.last_name}
                            </p>
                            <p className="truncate text-xs text-[var(--oklch-text-tertiary)]">{application.gigs?.title}</p>
                            <div className="flex items-center gap-2 text-xs text-[var(--oklch-text-tertiary)]">
                              <ApplicationStatusBadge status={application.status} showIcon={false} />
                              <span>{application.talent_profiles?.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer-row">
                          <span>Next action</span>
                          <Link href="/client/applications" className="text-[var(--oklch-text-primary)] hover:underline">
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden space-y-4 md:block">
                    {applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="flex items-center gap-4 rounded-lg border border-border/40 p-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-white">
                            {application.talent_profiles?.first_name} {application.talent_profiles?.last_name}
                          </h4>
                          <p className="truncate text-sm text-[var(--oklch-text-tertiary)]">{application.gigs?.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <ApplicationStatusBadge status={application.status} showIcon={true} />
                            <span className="text-sm text-[var(--oklch-text-tertiary)]">
                              {application.talent_profiles?.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[var(--oklch-text-tertiary)]">
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-[var(--oklch-text-tertiary)]">{application.talent_profiles?.experience}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No applications yet"
                  description="Applications will appear here once talent starts applying to your gigs"
                  className="totl-surface-card"
                />
              )}
              <Button variant="outline" className="w-full border border-border/50 bg-card/20 text-foreground hover:bg-card/30" asChild>
                <Link href="/client/applications">View All Applications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="totl-border-violet totl-hover-glow">
        <Card className="totl-border-violet-inner">
          <CardHeader>
            <div className="card-header-row">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <Badge
                variant="outline"
                className="status-chip shrink-0 whitespace-nowrap border-[var(--totl-violet-border)]"
              >
                Next 30d
              </Badge>
            </div>
            <CardDescription>Gigs with approaching application deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-card/20 p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--oklch-text-primary)]">{deadline.title}</h4>
                        <p className="text-sm text-[var(--oklch-text-muted)]">
                          {deadline.applications_count || 0} applications received
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[var(--oklch-text-primary)]">
                          Due {deadline.application_deadline}
                        </p>
                        <GigStatusBadge status={deadline.status ?? "draft"} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming deadlines"
                  description="Deadlines will appear here for gigs with application deadlines"
                  className="totl-surface-card"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
