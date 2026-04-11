"use client";

import { CheckCircle, Clock, FileText, Filter, MapPin, Phone, Search, UserCheck } from "lucide-react";
import type { DashboardApplication } from "@/app/client/dashboard/types";
import { EmptyState } from "@/components/layout/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";

interface ApplicationsTabContentProps {
  applications: DashboardApplication[];
  onCreateGig: () => void;
}

export default function ApplicationsTabContent({
  applications,
  onCreateGig,
}: ApplicationsTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Applications</h2>
          <p className="text-[var(--oklch-text-secondary)]">Review and manage talent applications for your gigs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Applications will appear here once talent starts applying to your gigs. Make sure your gigs are active and visible to talent."
            className="totl-surface-card"
            action={{
              label: "Create a Gig",
              onClick: onCreateGig,
            }}
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card
                key={application.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={application.profiles?.avatar_url || "/images/totl-logo-transparent.png"}
                        alt={
                          application.talent_profiles?.first_name && application.talent_profiles?.last_name
                            ? `${application.talent_profiles.first_name} ${application.talent_profiles.last_name}`
                            : application.profiles?.display_name || "Talent"
                        }
                      />
                      <AvatarFallback className="text-lg">
                        {application.talent_profiles?.first_name && application.talent_profiles?.last_name
                          ? `${application.talent_profiles.first_name.charAt(0)}${application.talent_profiles.last_name.charAt(0)}`
                          : application.profiles?.display_name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {application.talent_profiles?.first_name && application.talent_profiles?.last_name
                              ? `${application.talent_profiles.first_name} ${application.talent_profiles.last_name}`
                              : application.profiles?.display_name || "Talent User"}
                          </h3>
                          <p className="text-[var(--oklch-text-secondary)]">{application.gigs?.title}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-sm text-[var(--oklch-text-tertiary)]">
                              <MapPin className="mr-1 inline h-4 w-4" />
                              {application.talent_profiles?.location || "Location not specified"}
                            </span>
                            <span className="text-sm text-[var(--oklch-text-tertiary)]">
                              <Clock className="mr-1 inline h-4 w-4" />
                              {application.talent_profiles?.experience || "Experience not specified"}
                            </span>
                            <span className="text-sm text-[var(--oklch-text-tertiary)]">
                              Applied {new Date(application.created_at).toLocaleDateString()}
                            </span>
                            {application.profiles?.email_verified && (
                              <span className="text-sm text-green-600">
                                <CheckCircle className="mr-1 inline h-4 w-4" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-white/15 text-[var(--oklch-text-primary)] hover:bg-white/10">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                      <Button variant="outline" size="sm" className="border-white/15 text-[var(--oklch-text-primary)] hover:bg-white/10">
                        <Phone className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
