import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";

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
      <Card className="grain-texture">
        <CardHeader>
          <CardTitle className="font-display text-xl text-[var(--oklch-text-primary)] sm:text-2xl">
            Account
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--oklch-text-secondary)]">
            Profile data isn&apos;t available yet. Try refreshing, or open Settings if this persists.
          </p>
          <Button variant="outline" className="rounded-full border-border/50 font-semibold" asChild>
            <Link href={PATHS.TALENT_PROFILE}>Go to profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="grain-texture">
      <CardHeader>
        <CardTitle className="font-display text-xl text-[var(--oklch-text-primary)] sm:text-2xl">
          Account
        </CardTitle>
        <CardDescription className="text-[var(--oklch-text-secondary)]">
          Your profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-[var(--oklch-border-alpha)]">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.display_name || profile.email}`}
            />
            <AvatarFallback className="bg-[var(--oklch-panel-alpha)] text-[var(--oklch-text-primary)]">
              {profile.display_name
                ? profile.display_name.substring(0, 2).toUpperCase()
                : profile.email.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-medium text-[var(--oklch-text-primary)]">
              {profile.display_name || "No display name"}
            </h3>
            <p className="truncate text-sm text-[var(--oklch-text-muted)]">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[var(--oklch-text-muted)]">Role</span>
            <span className="font-medium capitalize text-[var(--oklch-text-primary)]">{profile.role}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[var(--oklch-text-muted)]">Member since</span>
            <span className="font-medium text-[var(--oklch-text-primary)]">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[var(--oklch-text-muted)]">User ID</span>
            <span
              className="max-w-[150px] truncate font-mono text-xs text-[var(--oklch-text-secondary)]"
              title={profile.id}
            >
              {profile.id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
