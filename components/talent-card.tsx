"use client";

import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/types/supabase";

type User = Database["public"]["Tables"]["profiles"]["Row"];
type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];

interface TalentCardProps {
  user: User;
  talentProfile: TalentProfile;
  onViewProfile?: () => void;
}

export function TalentCard({ user, talentProfile, onViewProfile }: TalentCardProps) {
  const displayName = user.display_name || `${talentProfile.first_name} ${talentProfile.last_name}`;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://avatar.vercel.sh/${user.id}`} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-xl">{displayName}</CardTitle>
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
              {talentProfile.specialties.map((specialty: string, index: number) => (
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
