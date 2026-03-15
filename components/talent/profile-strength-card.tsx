"use client";

import { Globe, Phone, Plus, Settings, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ProfileStrengthCardProps {
  /** Whether basic info (name, location) is incomplete */
  needsProfileCompletion: boolean;
  /** Completion percentage (e.g. 60 or 85) */
  completionPercent: number;
  /** Whether contact details (phone) are complete */
  contactComplete?: boolean;
  /** Whether portfolio has at least one item */
  portfolioComplete?: boolean;
}

/**
 * Presentational, read-only Profile Strength card.
 * Renders completion status and links to Complete Profile / Settings.
 * No DB calls; all data passed via props.
 */
export function ProfileStrengthCard({
  needsProfileCompletion,
  completionPercent,
  contactComplete = true,
  portfolioComplete = true,
}: ProfileStrengthCardProps) {
  const basicInfoComplete = !needsProfileCompletion;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="card-header-row">
          <CardTitle className="flex items-center gap-2 text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20">
              <User className="h-3.5 w-3.5 text-blue-400" />
            </span>
            Profile Strength
          </CardTitle>
          <Badge variant="outline" className="status-chip">
            {needsProfileCompletion ? "Needs work" : "Strong"}
          </Badge>
        </div>
        <CardDescription className="text-gray-300">
          Complete your profile to get more opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white">
            <span>Profile Completion</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-white">
              <User className="h-4 w-4" />
              Basic Information
            </span>
            <Badge
              variant="outline"
              className={
                basicInfoComplete
                  ? "bg-green-900/30 text-green-400 border-green-700"
                  : "bg-red-900/30 text-red-400 border-red-700"
              }
            >
              {basicInfoComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-white">
              <Phone className="h-4 w-4" />
              Contact Details
            </span>
            <Badge
              variant="outline"
              className={
                contactComplete
                  ? "bg-green-900/30 text-green-400 border-green-700"
                  : "bg-red-900/30 text-red-400 border-red-700"
              }
            >
              {contactComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-white">
              <Globe className="h-4 w-4" />
              Portfolio
            </span>
            <Badge
              variant="outline"
              className={
                portfolioComplete
                  ? "bg-green-900/30 text-green-400 border-green-700"
                  : "bg-red-900/30 text-red-400 border-red-700"
              }
            >
              {portfolioComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
            variant="outline"
            asChild
          >
            <Link href="/talent/profile" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Complete Profile
            </Link>
          </Button>
          <Button
            className="flex-1 bg-transparent border-gray-700 text-white hover:bg-gray-800"
            variant="outline"
            asChild
          >
            <Link href="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
