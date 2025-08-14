import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Profile = {
  id: string;
  role: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export function ProfileData({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Profile data not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.email}`}
            />
            <AvatarFallback>
              {profile.display_name
                ? profile.display_name.substring(0, 2).toUpperCase()
                : profile.email.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{profile.display_name || "No display name"}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Role:</span>
            <span className="font-medium capitalize">{profile.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member since:</span>
            <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">User ID:</span>
            <span className="font-medium text-xs truncate max-w-[150px]" title={profile.id}>
              {profile.id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
