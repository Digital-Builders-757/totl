"use client";

import { Briefcase, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationStatus {
  status: string | null;
  applicationId?: string;
  adminNotes?: string | null;
}

interface CareerBuilderSectionProps {
  userEmail: string | undefined;
}

export function CareerBuilderSection({ userEmail }: CareerBuilderSectionProps) {
  const { user, profile } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userEmail || !user) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/client-applications/status?email=${encodeURIComponent(userEmail)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to check application status");
        }

        const payload = await response.json();
        setApplicationStatus(payload);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load application status", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    checkStatus();

    return () => controller.abort();
  }, [userEmail, user]);

  // Only show for talent users (not clients or admins)
  if (!user || !profile || profile.role === "client" || profile.role === "admin") {
    return null;
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-600 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-600 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string | null) => {
    switch (status) {
      case "approved":
        return "Your application has been approved! You now have access to the Career Builder dashboard.";
      case "pending":
        return "Your application is being reviewed by our team. You'll be notified when we have an update.";
      case "rejected":
        return "Your previous application was not approved. Please reach out to hello@thetotlagency.com to reapply.";
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Briefcase className="h-5 w-5" />
          Become a Career Builder
        </CardTitle>
        <CardDescription className="text-gray-400">
          Post gigs and hire talent through TOTL Agency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-400">Checking application status...</p>
          </div>
        ) : applicationStatus?.status ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">Application Status:</span>
              {getStatusBadge(applicationStatus.status)}
            </div>

            {getStatusMessage(applicationStatus.status) && (
              <Alert className="bg-gray-700 border-gray-600">
                <AlertDescription className="text-gray-300">
                  {getStatusMessage(applicationStatus.status)}
                </AlertDescription>
              </Alert>
            )}

            {applicationStatus.status === "approved" && (
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Link href="/client/dashboard">
                  Go to Career Builder Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}

            {applicationStatus.status === "rejected" && (
              <Button asChild variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                <Link href="/client/apply">
                  Reapply to be a Career Builder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                Career Builders can post gigs and hire talent through TOTL Agency. Apply now to join our exclusive network.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Post unlimited gigs</li>
                <li>Access our premium talent roster</li>
                <li>Manage applications and bookings</li>
                <li>Direct communication with talent</li>
              </ul>
            </div>

            <Button asChild className="w-full bg-white text-black hover:bg-gray-200">
              <Link href="/client/apply">
                Apply to be a Career Builder
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

