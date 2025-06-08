"use client"

import { User, Profile, TalentProfile } from "@/types/database"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Instagram, Globe } from "lucide-react"

interface TalentCardProps {
  user: User
  profile: Profile
  talentProfile: TalentProfile
  onViewProfile?: () => void
}

export function TalentCard({ user, profile, talentProfile, onViewProfile }: TalentCardProps) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://avatar.vercel.sh/${user.id}`} alt={user.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-xl">{user.full_name}</CardTitle>
          {profile.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {profile.location}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
        {talentProfile.specialties && talentProfile.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {talentProfile.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary">
                {specialty}
              </Badge>
            ))}
          </div>
        )}
        {talentProfile.experience_years && (
          <p className="text-sm">
            <span className="font-medium">Experience:</span> {talentProfile.experience_years} years
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {profile.instagram_handle && (
            <Button variant="ghost" size="icon" asChild>
              <a
                href={`https://instagram.com/${profile.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
          )}
          {profile.website && (
            <Button variant="ghost" size="icon" asChild>
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        {onViewProfile && (
          <Button onClick={onViewProfile} variant="default">
            View Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 