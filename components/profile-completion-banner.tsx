"use client";

import { AlertCircle, X, User, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProfileCompletionBannerProps {
  userRole: "talent" | "client";
  missingFields: string[];
  profileUrl: string;
}

export function ProfileCompletionBanner({
  userRole,
  missingFields,
  profileUrl,
}: ProfileCompletionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || missingFields.length === 0) {
    return null;
  }

  const RoleIcon = userRole === "talent" ? User : Building2;
  const roleName = userRole === "talent" ? "Talent" : "Client";
  const missingFieldsText = missingFields.join(", ");

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RoleIcon className="h-4 w-4 text-amber-600" />
          <div>
            <span className="font-medium text-amber-800">Complete your {roleName} profile</span>
            <p className="text-sm text-amber-700">Missing: {missingFieldsText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={profileUrl}>Complete Profile</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
