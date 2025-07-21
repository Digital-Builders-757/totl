"use client";

import { MapPin, Instagram, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Profile, TalentProfile } from "@/types/database";

interface TalentCardProps {
  user: User;
  profile: Profile;
  talentProfile: TalentProfile;
  onViewProfile?: () => void;
}

export function TalentCard({ user, profile, talentProfile, onViewProfile }: TalentCardProps) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://avatar.vercel.sh/${user.id}`} alt={user.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-xl">{user.full_name}</CardTitle>
          {talentProfile.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {talentProfile.location}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {talentProfile.experience && (
          <p className="text-sm text-muted-foreground">{talentProfile.experience}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {onViewProfile && (
          <Button onClick={onViewProfile} variant="default">
            View Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
