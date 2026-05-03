"use client";

import { Flag, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { FlagProfileDialog } from "@/components/moderation/flag-profile-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { sendCollaborationRequestAction } from "@/lib/actions/collaboration-actions";
import type { Database } from "@/types/supabase";

type TalentProfileRow = Database["public"]["Tables"]["talent_profiles"]["Row"];

// PR3: Only accept what server actually sends (public fields + phone)
// This prevents accidental leakage if server ever includes sensitive fields
// phone is always present (either string or null) - never optional
type TalentPublicClientModel = Pick<
  TalentProfileRow,
  | "user_id"
  | "height"
  | "weight"
  | "hair_color"
  | "eye_color"
  | "shoe_size"
  | "measurements"
  | "experience_years"
  | "portfolio_url"
> & { phone: string | null };

interface TalentProfileClientProps {
  talent: TalentPublicClientModel;
}

export function TalentProfileClient({ talent }: TalentProfileClientProps) {
  const { user: authUser, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const [isSendingCollab, setIsSendingCollab] = useState(false);
  const [collabRequested, setCollabRequested] = useState(false);

  const user =
    authUser && authProfile
      ? ({
          id: authUser.id,
          role: authProfile.role,
        } as Database["public"]["Tables"]["profiles"]["Row"])
      : null;

  const canReportProfile = !!user && user.id !== talent.user_id;
  const canSendCollab = !!user && user.id !== talent.user_id;

  // PR3: Do NOT infer access client-side (Option B requirement)
  // Server already determined relationship and included/excluded phone accordingly
  // If phone exists (non-empty string), viewer is authorized (self/admin/relationship client)
  // If phone is null or empty string, show locked state
  const hasPhone = typeof talent.phone === "string" && talent.phone.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="rounded-xl border border-border/50 bg-card/35 p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Contact Information</h3>

        {hasPhone ? (
          <div className="space-y-3">
            <div className="flex items-center text-foreground">
              <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
              {talent.phone}
            </div>
            <div className="flex items-center text-foreground">
              <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
              Contact through TOTL
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              Contact details unlock after you&apos;ve applied to or booked talent through TOTL.
            </p>
            {!user ? (
              <Button asChild className="w-full">
                <Link href="/login">Sign in to unlock</Link>
              </Button>
            ) : user.role === "talent" ? (
              <p className="text-sm text-muted-foreground">
                Clients unlock contact details after applying or booking talent.
              </p>
            ) : user.role === "client" ? (
              <Button asChild className="w-full">
                <Link href="/client/dashboard">Career Builder dashboard</Link>
              </Button>
            ) : user.role === "admin" ? (
              <p className="text-sm text-muted-foreground">
                Use the admin console to manage talent relationships and contact access.
              </p>
            ) : (
              <Button asChild className="w-full">
                <Link href="/client/apply">Apply as Career Builder</Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Physical Attributes */}
      <div className="rounded-xl border border-border/50 bg-card/35 p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Physical Attributes</h3>
        <div className="space-y-3 text-sm">
          {talent.height && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height</span>
              <span className="font-medium text-foreground">{talent.height}</span>
            </div>
          )}
          {talent.weight && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium text-foreground">{talent.weight} lbs</span>
            </div>
          )}
          {talent.hair_color && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hair Color</span>
              <span className="font-medium text-foreground">{talent.hair_color}</span>
            </div>
          )}
          {talent.eye_color && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eye Color</span>
              <span className="font-medium text-foreground">{talent.eye_color}</span>
            </div>
          )}
          {talent.shoe_size && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shoe Size</span>
              <span className="font-medium text-foreground">{talent.shoe_size}</span>
            </div>
          )}
          {talent.measurements && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Measurements</span>
              <span className="font-medium text-foreground">{talent.measurements}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collaboration */}
      <div className="space-y-3 rounded-xl border border-border/50 bg-card/35 p-6">
        <h3 className="text-lg font-semibold text-foreground">Collaboration</h3>
        <p className="text-sm text-muted-foreground">
          Want to work together on a future project? Send a one-click collaboration request and keep the conversation on-platform.
        </p>
        {!user ? (
          <Button asChild className="w-full">
            <Link href="/login">Sign in to request collaboration</Link>
          </Button>
        ) : canSendCollab ? (
          <Button
            className="w-full"
            variant={collabRequested ? "outline" : "default"}
            disabled={isSendingCollab || collabRequested}
            onClick={async () => {
              setIsSendingCollab(true);
              const result = await sendCollaborationRequestAction(talent.user_id);
              if (!result.ok) {
                toast({
                  title: "Could not send request",
                  description: result.error,
                  variant: "destructive",
                });
                setIsSendingCollab(false);
                return;
              }

              setCollabRequested(true);
              toast({
                title: result.alreadyRequested
                  ? "Request already sent"
                  : "Collaboration request sent",
                description: result.alreadyRequested
                  ? "This member already has your collaboration request."
                  : "They’ll receive an in-app notification.",
              });
              setIsSendingCollab(false);
            }}
          >
            {isSendingCollab ? "Sending..." : collabRequested ? "Request Sent" : "Request Collaboration"}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full justify-center">
            You cannot send a request to your own profile
          </Button>
        )}
      </div>

      {/* Experience */}
      {talent.experience_years && (
        <div className="rounded-xl border border-border/50 bg-card/35 p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Experience</h3>
          <p className="text-foreground">{talent.experience_years} years</p>
        </div>
      )}

      {/* Portfolio Link */}
      {talent.portfolio_url && (
        <div className="rounded-xl border border-border/50 bg-card/35 p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Portfolio</h3>
          <a
            href={talent.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View Portfolio
          </a>
        </div>
      )}

      {/* Moderation */}
      <div className="space-y-3 rounded-xl border border-border/50 bg-card/35 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Flag className="h-4 w-4" />
          Safety & Moderation
        </div>
        <p className="text-sm text-muted-foreground">
          See something off about this profile? Let the TOTL moderation team know so we can keep the
          marketplace safe.
        </p>
        {canReportProfile ? (
          <FlagProfileDialog profileId={talent.user_id} profileType="talent_profile" />
        ) : (
          <Button variant="outline" disabled className="w-full justify-center">
            {user ? "You cannot report your own profile" : "Sign in to report this profile"}
          </Button>
        )}
      </div>
    </div>
  );
}

