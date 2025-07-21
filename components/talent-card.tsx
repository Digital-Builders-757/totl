"use client";

import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, TalentProfile } from "@/types/database";

interface TalentCardProps {
  user: User;
  talentProfile: TalentProfile;
  onViewProfile?: () => void;
}

export function TalentCard({ user, talentProfile, onViewProfile }: TalentCardProps) {
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
          {talentProfile.experience_years && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {talentProfile.experience_years} years experience
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {talentProfile.specialties && talentProfile.specialties.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Specialties:</p>
            <div className="flex flex-wrap gap-1">
              {talentProfile.specialties.map((specialty, index) => (
                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
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
