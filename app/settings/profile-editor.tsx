"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { AvatarUpload } from "./avatar-upload";
import { AccountSettingsSection } from "./sections/account-settings";
import { BasicInfoSection } from "./sections/basic-info";
import { ClientDetailsSection } from "./sections/client-details";
import { PortfolioSection } from "./sections/portfolio-section";
import { TalentDetailsSection } from "./sections/talent-details";
import { MobileTabRail } from "@/components/layout/mobile-tab-rail";
import { ProfileStrengthCard } from "@/components/talent/profile-strength-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Talent = Database["public"]["Tables"]["talent_profiles"]["Row"];
type Client = Database["public"]["Tables"]["client_profiles"]["Row"];
type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"] & { imageUrl?: string };

// Type for the exact columns we select
type ProfileData = Pick<
  Profile,
  | "id"
  | "role"
  | "display_name"
  | "avatar_url"
  | "avatar_path"
  | "email_verified"
  | "subscription_status"
  | "subscription_plan"
  | "subscription_current_period_end"
  | "created_at"
  | "updated_at"
>;

interface ProfileEditorProps {
  user: User;
  profile: ProfileData;
  talent: Talent | null;
  client: Client | null;
  avatarSrc: string | null;
  portfolioItems?: PortfolioItem[];
}

export function ProfileEditor({ user, profile, talent, client, avatarSrc, portfolioItems = [] }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const isTalent = profile.role === "talent";

  const needsProfileCompletion =
    isTalent && (!talent?.first_name || !talent?.last_name || !talent?.location);
  const contactComplete = !isTalent || !!talent?.phone;
  const portfolioComplete = (portfolioItems?.length ?? 0) > 0;
  const completionPercent = needsProfileCompletion ? 60 : 85;

  const triggerClassName =
    "min-h-10 rounded-xl px-3 py-2 text-sm text-[var(--oklch-text-tertiary)] transition-all data-[state=active]:bg-white/10 data-[state=active]:text-[var(--oklch-text-primary)] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_12px_28px_rgba(10,10,18,0.2)] md:px-4 md:text-base";

  return (
    <div className="space-y-6">
      {isTalent && (
        <ProfileStrengthCard
          needsProfileCompletion={!!needsProfileCompletion}
          completionPercent={completionPercent}
          contactComplete={contactComplete}
          portfolioComplete={portfolioComplete}
        />
      )}

      <Card className="rounded-[1.75rem] border-white/10">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl font-bold text-[var(--oklch-text-primary)]">
                {profile.display_name || "Profile"}
              </CardTitle>
              <CardDescription className="mt-1 break-all text-sm text-[var(--oklch-text-tertiary)]">
                {user.email}
              </CardDescription>
            </div>
            <AvatarUpload
              currentAvatarUrl={avatarSrc}
              userEmail={user.email || ""}
              displayName={profile.display_name}
            />
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[1.75rem] border-white/10">
        <CardHeader>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Manage your profile information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <MobileTabRail className="pb-1" edgeColorClassName="from-[var(--oklch-bg)]">
              <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-2xl border border-white/8 panel-frosted p-1">
                <TabsTrigger value="basic" className={triggerClassName}>
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="details" className={triggerClassName}>
                  Details
                </TabsTrigger>
                {isTalent && (
                  <TabsTrigger value="portfolio" className={triggerClassName}>
                    Portfolio
                  </TabsTrigger>
                )}
                <TabsTrigger value="account" className={triggerClassName}>
                  Account
                </TabsTrigger>
              </TabsList>
            </MobileTabRail>

            <TabsList
              className={`hidden h-auto w-full rounded-2xl border border-white/8 panel-frosted p-1 md:grid ${
                isTalent ? "md:grid-cols-4" : "md:grid-cols-3"
              }`}
            >
              <TabsTrigger value="basic" className={triggerClassName}>
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="details" className={triggerClassName}>
                Details
              </TabsTrigger>
              {isTalent && (
                <TabsTrigger value="portfolio" className={triggerClassName}>
                  Portfolio
                </TabsTrigger>
              )}
              <TabsTrigger value="account" className={triggerClassName}>
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-5 space-y-4 md:mt-6">
              <BasicInfoSection user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="details" className="mt-5 space-y-4 md:mt-6">
              {profile.role === "talent" ? (
                <TalentDetailsSection talent={talent} />
              ) : profile.role === "client" ? (
                <ClientDetailsSection client={client} />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[var(--oklch-text-tertiary)]">No role-specific details available.</p>
                </div>
              )}
            </TabsContent>

            {isTalent && (
              <TabsContent value="portfolio" className="mt-5 space-y-4 md:mt-6">
                <PortfolioSection portfolioItems={portfolioItems} />
              </TabsContent>
            )}

            <TabsContent value="account" className="mt-5 space-y-4 md:mt-6">
              <AccountSettingsSection 
                user={user} 
                profile={{
                  role: profile.role,
                  subscription_status: (profile.subscription_status ?? "none") as Database["public"]["Enums"]["subscription_status"],
                  subscription_plan: profile.subscription_plan ?? null,
                  subscription_current_period_end: profile.subscription_current_period_end ?? null,
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
