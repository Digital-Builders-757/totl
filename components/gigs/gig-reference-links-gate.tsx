import Link from "next/link";

import { GigReferenceLinksSection } from "@/components/gigs/gig-reference-links-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canViewFullGigMarketingCopy } from "@/lib/gig-access";
import { parseStoredReferenceLinksForDisplay } from "@/lib/gig-reference-links";
import type { Json } from "@/types/database";
import type { Database } from "@/types/supabase";

type ViewerProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "role" | "subscription_status"
> | null;

type GigReferenceLinksGateProps = {
  referenceLinks: Json | null | undefined;
  profile: ViewerProfile;
  gigId: string;
  /** When false, viewer is a guest — show sign-in CTA instead of talent subscribe UI */
  hasUser: boolean;
};

/**
 * Renders reference links only when the viewer may see full gig marketing copy;
 * otherwise shows a locked placeholder (only if the gig actually has links stored).
 */
export function GigReferenceLinksGate({
  referenceLinks,
  profile,
  gigId,
  hasUser,
}: GigReferenceLinksGateProps) {
  const hasLinks = parseStoredReferenceLinksForDisplay(referenceLinks).length > 0;
  if (!hasLinks) return null;

  const isAuthenticatedTalent = hasUser && profile?.role === "talent";
  if (isAuthenticatedTalent || canViewFullGigMarketingCopy(profile)) {
    return <GigReferenceLinksSection referenceLinks={referenceLinks} />;
  }

  const returnPath = `/gigs/${gigId}`;
  return (
    <Card data-testid="reference-links-locked">
      <CardHeader>
        <CardTitle>Reference & inspiration</CardTitle>
        <CardDescription>
          Links from the career builder (reels, campaigns, portfolios) are visible after signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUser ? (
          <div className="space-y-3 text-center py-2">
            <p className="text-sm text-[var(--oklch-text-muted)]">
              This account cannot access reference links yet. Sign in with your talent, career builder,
              or admin account.
            </p>
            <Button asChild className="w-full button-glow border-0">
              <Link href={`/login?returnUrl=${encodeURIComponent(returnPath)}`}>Sign in</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-center py-2">
            <p className="text-sm text-[var(--oklch-text-muted)]">
              Sign in to view reference links.
            </p>
            <Button asChild className="w-full button-glow border-0">
              <Link href={`/login?returnUrl=${encodeURIComponent(returnPath)}`}>Sign in</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
