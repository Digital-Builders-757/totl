"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { AvatarUpload } from "./avatar-upload";
import { AccountSettingsSection } from "./sections/account-settings";
import { BasicInfoSection } from "./sections/basic-info";
import { ClientDetailsSection } from "./sections/client-details";
import { TalentDetailsSection } from "./sections/talent-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Talent = Database["public"]["Tables"]["talent_profiles"]["Row"];
type Client = Database["public"]["Tables"]["client_profiles"]["Row"];

// Type for the exact columns we select
type ProfileData = Pick<
  Profile,
  | "id"
  | "role"
  | "display_name"
  | "avatar_url"
  | "avatar_path"
  | "email_verified"
  | "created_at"
  | "updated_at"
>;

interface ProfileEditorProps {
  user: User;
  profile: ProfileData;
  talent: Talent | null;
  client: Client | null;
  avatarSrc: string | null;
}

export function ProfileEditor({ user, profile, talent, client, avatarSrc }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AvatarUpload
              currentAvatarUrl={avatarSrc}
              userEmail={user.email || ""}
              displayName={profile.display_name}
            />
            <div>
              <h2 className="text-2xl font-bold">{profile.display_name || "Profile"}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabbed Interface */}
      <Card>
        <CardHeader>
          <CardDescription>Manage your profile information and account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <BasicInfoSection user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-6">
              {profile.role === "talent" ? (
                <TalentDetailsSection talent={talent} />
              ) : profile.role === "client" ? (
                <ClientDetailsSection client={client} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No role-specific details available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="account" className="space-y-4 mt-6">
              <AccountSettingsSection user={user} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
