"use client";

import { Briefcase, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";
import { logger } from "@/lib/utils/logger";

interface ApplicationStatus {
  status: string | null;
  applicationId?: string;
  adminNotes?: string | null;
}

interface CareerBuilderSectionProps {
  userEmail: string | undefined;
}

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none";

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
        logger.error("Failed to load application status", error);
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
          <Badge
            variant="outline"
            className="border-emerald-500/35 bg-emerald-500/15 font-medium text-emerald-200"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/35 bg-amber-500/15 font-medium text-amber-200"
          >
            <Clock className="mr-1 h-3 w-3" />
            Under review
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-red-500/35 bg-red-500/15 font-medium text-red-200"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Not approved
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = (status: string | null) => {
    switch (status) {
      case "approved":
        return "Your application has been approved. Open the Career Builder dashboard to post work and hire talent.";
      case "pending":
        return "Our team is reviewing your application. We’ll notify you when there’s an update.";
      case "rejected":
        return "This application wasn’t approved. Reach out to hello@thetotlagency.com if you’d like to discuss next steps.";
      default:
        return null;
    }
  };

  return (
    <Card className={glassCard}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <Briefcase className="h-5 w-5 text-[var(--oklch-accent)]" aria-hidden />
          Become a Career Builder
        </CardTitle>
        <CardDescription className="text-[var(--oklch-text-secondary)]">
          Post opportunities and hire talent through TOTL Agency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[var(--oklch-text-secondary)]">Checking application status…</p>
          </div>
        ) : applicationStatus?.status ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">Status</span>
              {getStatusBadge(applicationStatus.status)}
            </div>

            {getStatusMessage(applicationStatus.status) && (
              <Alert className="border-white/10 bg-white/[0.04] text-[var(--oklch-text-secondary)]">
                <AlertDescription>{getStatusMessage(applicationStatus.status)}</AlertDescription>
              </Alert>
            )}

            {applicationStatus.status === "approved" && (
              <Button
                asChild
                className="w-full border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500"
              >
                <Link href={PATHS.CLIENT_DASHBOARD}>
                  Open Career Builder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {applicationStatus.status === "pending" && (
              <Button
                asChild
                variant="outline"
                className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={PATHS.TALENT_DASHBOARD}>Back to talent dashboard</Link>
              </Button>
            )}

            {applicationStatus.status === "rejected" && (
              <Button
                asChild
                variant="outline"
                className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={PATHS.CLIENT_APPLY}>
                  Reapply
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm text-[var(--oklch-text-secondary)]">
              <p>
                Career Builders post opportunities and book talent on TOTL. Apply once to unlock the
                client workspace.
              </p>
              <ul className="ml-1 list-inside list-disc space-y-1 marker:text-[var(--oklch-text-tertiary)]">
                <li>Post unlimited opportunities</li>
                <li>Access our talent roster</li>
                <li>Manage applications and bookings</li>
                <li>Message talent directly</li>
              </ul>
            </div>

            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
            >
              <Link href={PATHS.CLIENT_APPLY}>
                Apply to be a Career Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
