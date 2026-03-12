"use client";

import { Building, Edit, Eye, MapPin, MoreVertical, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { GigStatusBadge } from "@/components/ui/status-badge";
import type { ClientGig } from "@/lib/actions/client-gigs-actions";
import { getCategoryLabel } from "@/lib/constants/gig-categories";

interface GigsResultsContentProps {
  filteredGigs: ClientGig[];
  searchTerm: string;
  getCategoryColor: (category: string) => string;
}

export default function GigsResultsContent({
  filteredGigs,
  searchTerm,
  getCategoryColor,
}: GigsResultsContentProps) {
  if (filteredGigs.length === 0) {
    return (
      <Card className="border-gray-700 bg-gray-900">
        <CardContent className="p-12 text-center">
          <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-white">No opportunities found</h3>
          <p className="mb-6 text-gray-300">
            {searchTerm ? "Try adjusting your search or filters" : "Get started by posting your first opportunity"}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/post-gig">
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Opportunity
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredGigs.map((gig) => (
        <Card key={gig.id} className="border-gray-700 bg-gray-900 transition-shadow hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-2 text-lg">{gig.title}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {gig.location}
                </CardDescription>
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
              className="h-48 w-full rounded-lg object-cover"
              fallbackSrc="/images/totl-logo-transparent.png"
            />

            <p className="line-clamp-2 text-sm text-gray-300">{gig.description}</p>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className={getCategoryColor(gig.category || "")}>
                {getCategoryLabel(gig.category || "")}
              </Badge>
              <GigStatusBadge status={gig.status || "draft"} showIcon={true} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Pay Rate:</span>
                <span className="font-medium text-white">{gig.compensation}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Applications:</span>
                <span className="font-medium text-white">{gig.applications_count || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Posted:</span>
                <span className="font-medium text-white">{gig.created_at}</span>
              </div>
              {gig.application_deadline && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Deadline:</span>
                  <span className="font-medium text-white">{gig.application_deadline}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="apple-glass flex-1 border-white/30 text-white"
                asChild
              >
                <Link href={`/gigs/${gig.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="apple-glass flex-1 border-white/30 text-white"
                asChild
              >
                <Link href={`/client/applications?gig=${gig.id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Applications
                </Link>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="apple-glass flex-1 border-white/30 text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="apple-glass flex-1 border-white/30 text-white">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
