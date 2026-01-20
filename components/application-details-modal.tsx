"use client";

import { Calendar, Clock, DollarSign, MapPin, MessageSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SafeImage } from "@/components/ui/safe-image";
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

interface ApplicationDetailsModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
}: ApplicationDetailsModalProps) {
  if (!application) return null;

  const getStatusColor = (status: Database["public"]["Enums"]["application_status"]) => {
    switch (status) {
      case "accepted":
        return "bg-green-900/30 text-green-400 border-green-700";
      case "rejected":
        return "bg-red-900/30 text-red-400 border-red-700";
      case "new":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "under_review":
        return "bg-blue-900/30 text-blue-400 border-blue-700";
      case "shortlisted":
        return "bg-purple-900/30 text-purple-400 border-purple-700";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-700";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "e-commerce": "bg-blue-900/30 text-blue-400 border-blue-700",
      commercial: "bg-green-900/30 text-green-400 border-green-700",
      editorial: "bg-purple-900/30 text-purple-400 border-purple-700",
      runway: "bg-pink-900/30 text-pink-400 border-pink-700",
      sportswear: "bg-orange-900/30 text-orange-400 border-orange-700",
      beauty: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-900/30 text-gray-400 border-gray-700"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            Application Details
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gig Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-start gap-4">
                {application.gigs?.image_url && (
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                    <SafeImage
                      src={application.gigs.image_url}
                      alt={application.gigs.title}
                      fill
                      className="object-cover"
                      placeholderQuery={application.gigs.category?.toLowerCase() || "general"}
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <CardTitle className="text-white text-xl">{application.gigs?.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {application.gigs?.client_profiles?.company_name || "Private Client"}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getCategoryColor(application.gigs?.category || "General")}>
                      {application.gigs?.category || "General"}
                    </Badge>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.gigs?.description && (
                <p className="text-gray-300">{application.gigs.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{application.gigs?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">${application.gigs?.compensation}</span>
                </div>
                {application.gigs?.date && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(application.gigs.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Your Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Application ID</span>
                  <span className="text-sm text-gray-400 font-mono">{application.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Status</span>
                  <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Applied Date</span>
                  <span className="text-sm text-gray-400">
                    {new Date(application.created_at).toLocaleString()}
                  </span>
                </div>
                {application.updated_at !== application.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Last Updated</span>
                    <span className="text-sm text-gray-400">
                      {new Date(application.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {application.message && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Cover Letter</span>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {application.message}
                    </p>
                  </div>
                </div>
              )}

              {!application.message && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No cover letter provided</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">What&apos;s Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(application.status === "new" || application.status === "under_review") && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">
                        {application.status === "new" ? "Submitted" : "Under Review"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        The client is reviewing your application. You&apos;ll be notified when they
                        make a decision.
                      </p>
                    </div>
                  </div>
                )}
                {application.status === "shortlisted" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Shortlisted!</p>
                      <p className="text-gray-400 text-sm">
                        Great news! You&apos;ve been shortlisted. The client will reach out soon with next steps.
                      </p>
                    </div>
                  </div>
                )}
                {application.status === "accepted" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Congratulations!</p>
                      <p className="text-gray-400 text-sm">
                        Your application has been accepted. The client will contact you with next
                        steps.
                      </p>
                    </div>
                  </div>
                )}
                {application.status === "rejected" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium">Application Not Selected</p>
                      <p className="text-gray-400 text-sm">
                        Unfortunately, this application wasn&apos;t selected. Keep applying to other
                        opportunities!
                      </p>
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
