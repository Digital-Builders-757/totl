"use client";

import { format } from "date-fns";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Gig } from "@/types/database";

interface GigListProps {
  gigs: Gig[];
  onGigClick?: (gig: Gig) => void;
  showApplyButton?: boolean;
}

export function GigList({ gigs, onGigClick, showApplyButton = true }: GigListProps) {
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  const handleGigClick = (gig: Gig) => {
    setSelectedGig(gig);
    onGigClick?.(gig);
  };

  const getStatusColor = (status: Gig["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {gigs.map((gig) => (
        <Card
          key={gig.id}
          className={`cursor-pointer transition-shadow hover:shadow-lg ${
            selectedGig?.id === gig.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleGigClick(gig)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
              <Badge className={getStatusColor(gig.status)}>{gig.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="line-clamp-3 text-sm text-muted-foreground">{gig.description}</p>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                {gig.location}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {format(new Date(gig.start_date), "MMM d, yyyy")}
              </div>
              {(gig.compensation_min || gig.compensation_max) && (
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  {gig.compensation_min && gig.compensation_max
                    ? `$${gig.compensation_min} - $${gig.compensation_max}`
                    : gig.compensation_min
                      ? `$${gig.compensation_min}+`
                      : `Up to $${gig.compensation_max}`}
                </div>
              )}
            </div>
          </CardContent>
          {showApplyButton && (
            <CardFooter>
              <Button className="w-full" variant="default">
                View Details
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
