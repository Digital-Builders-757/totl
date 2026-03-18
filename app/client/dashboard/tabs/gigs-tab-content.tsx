"use client";

import { Eye, MoreVertical, Plus, Users } from "lucide-react";
import Link from "next/link";
import type { DashboardGig } from "@/app/client/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { GigStatusBadge } from "@/components/ui/status-badge";
import { getCategoryLabel } from "@/lib/constants/gig-categories";

interface GigsTabContentProps {
  gigs: DashboardGig[];
  getCategoryColor: (category: string | undefined) => string;
}

export default function GigsTabContent({ gigs, getCategoryColor }: GigsTabContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Opportunities</h2>
          <p className="text-gray-300">Manage your posted opportunities and track their performance</p>
        </div>
        <Button asChild className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:opacity-90">
          <Link href="/client/post-gig">
            <Plus className="mr-2 h-4 w-4" />
            Post New Opportunity
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gigs.map((gig) => (
          <Card
            key={gig.id}
            className="border border-gray-800 bg-gray-900/80 text-white transition-shadow hover:shadow-lg"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-white">{gig.title}</CardTitle>
                  <CardDescription className="mt-1 text-gray-400">{gig.location}</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SafeImage
                src={gig.image_url || "/images/totl-logo.png"}
                alt={gig.title}
                width={300}
                height={200}
                className="h-32 w-full rounded-lg object-cover md:h-48"
                fallbackSrc="/images/totl-logo-transparent.png"
              />

              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getCategoryColor(gig.category)}>
                  {getCategoryLabel(gig.category || "")}
                </Badge>
                <GigStatusBadge status={gig.status || "draft"} showIcon={true} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Compensation:</span>
                  <span className="font-medium">{gig.compensation}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Applications:</span>
                  <span className="font-medium">{gig.applications_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Posted:</span>
                  <span className="font-medium">{gig.created_at}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-gray-700 text-white hover:bg-white/5">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-gray-700 text-white hover:bg-white/5">
                  <Users className="mr-2 h-4 w-4" />
                  Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
