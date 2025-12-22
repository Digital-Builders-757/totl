"use client";

import { Flag, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { FlagProfileDialog } from "@/components/moderation/flag-profile-dialog";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";

type TalentProfileRow = Database["public"]["Tables"]["talent_profiles"]["Row"];

// PR3: Only accept what server actually sends (public fields + optional phone)
// This prevents accidental leakage if server ever includes sensitive fields
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
> & { phone?: string | null };

interface TalentProfileClientProps {
  talent: TalentPublicClientModel;
}

export function TalentProfileClient({ talent }: TalentProfileClientProps) {
  const { user: authUser, profile: authProfile } = useAuth();

  const user =
    authUser && authProfile
      ? ({
          id: authUser.id,
          role: authProfile.role,
        } as Database["public"]["Tables"]["profiles"]["Row"])
      : null;

  const canReportProfile = !!user && user.id !== talent.user_id;

  // PR3: Do NOT infer access client-side (Option B requirement)
  // Server already determined relationship and included/excluded phone accordingly
  // If phone exists, viewer is authorized (self/admin/relationship client)
  // If phone is null/undefined, show locked state
  const hasPhone = !!talent.phone;

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-300">
        <h3 className="text-lg font-semibold text-black mb-4">Contact Information</h3>

        {hasPhone ? (
          <div className="space-y-3">
            <div className="flex items-center text-black">
              <Phone className="mr-3 h-4 w-4 text-black" />
              {talent.phone}
            </div>
            <div className="flex items-center text-black">
              <Mail className="mr-3 h-4 w-4 text-black" />
              Contact through TOTL
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Contact details unlock after you&apos;ve applied to or booked talent through TOTL.
            </p>
            <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
              <Link href="/client/apply">Apply as Career Builder</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Physical Attributes */}
      <div className="bg-white rounded-lg p-6 border border-gray-300">
        <h3 className="text-lg font-semibold text-black mb-4">Physical Attributes</h3>
        <div className="space-y-3 text-sm">
          {talent.height && (
            <div className="flex justify-between">
              <span className="text-gray-600">Height</span>
              <span className="text-black font-medium">{talent.height}</span>
            </div>
          )}
          {talent.weight && (
            <div className="flex justify-between">
              <span className="text-gray-600">Weight</span>
              <span className="text-black font-medium">{talent.weight} lbs</span>
            </div>
          )}
          {talent.hair_color && (
            <div className="flex justify-between">
              <span className="text-gray-600">Hair Color</span>
              <span className="text-black font-medium">{talent.hair_color}</span>
            </div>
          )}
          {talent.eye_color && (
            <div className="flex justify-between">
              <span className="text-gray-600">Eye Color</span>
              <span className="text-black font-medium">{talent.eye_color}</span>
            </div>
          )}
          {talent.shoe_size && (
            <div className="flex justify-between">
              <span className="text-gray-600">Shoe Size</span>
              <span className="text-black font-medium">{talent.shoe_size}</span>
            </div>
          )}
          {talent.measurements && (
            <div className="flex justify-between">
              <span className="text-gray-600">Measurements</span>
              <span className="text-black font-medium">{talent.measurements}</span>
            </div>
          )}
        </div>
      </div>

      {/* Experience */}
      {talent.experience_years && (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-2">Experience</h3>
          <p className="text-black">{talent.experience_years} years</p>
        </div>
      )}

      {/* Portfolio Link */}
      {talent.portfolio_url && (
        <div className="bg-white rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-black mb-4">Portfolio</h3>
          <a
            href={talent.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Portfolio
          </a>
        </div>
      )}

      {/* Moderation */}
      <div className="bg-white rounded-lg p-6 border border-gray-300 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Flag className="h-4 w-4" />
          Safety & Moderation
        </div>
        <p className="text-sm text-gray-600">
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

