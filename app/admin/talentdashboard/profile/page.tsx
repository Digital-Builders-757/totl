"use client";

import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import TalentPersonalInfoForm from "@/components/talent-personal-info-form";
import TalentProfessionalInfoForm from "@/components/talent-professional-info-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TalentProfile } from "@/types/database";

// Type definitions for form data
interface PersonalInfoFormData {
  phone: string;
  age: string;
  location: string;
  height: string;
  measurements: string;
  hairColor: string;
  eyeColor: string;
  shoeSize: string;
  languages: string[];
  instagram: string;
}

interface ProfessionalInfoFormData {
  experience: string;
  portfolio: string;
  specialties: string;
  achievements: string;
  availability: string;
}

// Helper function to convert TalentProfile to PersonalInfoFormData
const mapTalentProfileToPersonalInfo = (profile: TalentProfile): Partial<PersonalInfoFormData> => ({
  phone: profile.phone || "",
  age: profile.age?.toString() || "",
  location: profile.location || "",
  height: profile.height || "",
  measurements: profile.measurements || "",
  hairColor: profile.hair_color || "",
  eyeColor: profile.eye_color || "",
  shoeSize: profile.shoe_size || "",
  languages: profile.languages || ["English"],
  instagram: "", // Not in TalentProfile, will be empty
});

// Helper function to convert TalentProfile to ProfessionalInfoFormData
const mapTalentProfileToProfessionalInfo = (profile: TalentProfile): Partial<ProfessionalInfoFormData> => ({
  experience: profile.experience || "",
  portfolio: profile.portfolio_url || "",
  specialties: "", // Not in TalentProfile, will be empty
  achievements: "", // Not in TalentProfile, will be empty
  availability: "", // Not in TalentProfile, will be empty
});

export default function TalentProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [profileData, setProfileData] = useState<TalentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase, user } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("talent_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setProfileData(data);
      } catch (err: unknown) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user, supabase]);

  const handleProfileUpdate = () => {
    // Refresh profile data after update
    if (user) {
      setIsLoading(true);
      supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing profile data:", error);
          } else {
            setProfileData(data);
          }
          setIsLoading(false);
        });
    }
  };

  const isProfileComplete = () => {
    if (!profileData) return false;

    const requiredPersonalFields: (keyof TalentProfile)[] = ["phone", "age", "location"];
    const requiredProfessionalFields: (keyof TalentProfile)[] = ["experience"];

    const hasRequiredPersonal = requiredPersonalFields.every((field) => !!profileData[field]);
    const hasRequiredProfessional = requiredProfessionalFields.every(
      (field) => !!profileData[field]
    );

    return hasRequiredPersonal && hasRequiredProfessional;
  };

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>

        {!isProfileComplete() && !isLoading && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your profile is incomplete. Please fill in all required fields to increase your
              chances of being discovered by clients.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Complete your profile to showcase your talents and increase your chances of being
              selected for gigs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="professional">Professional Information</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <TalentPersonalInfoForm
                    initialData={profileData ? mapTalentProfileToPersonalInfo(profileData) : undefined}
                    onSaved={handleProfileUpdate}
                  />
                )}
              </TabsContent>

              <TabsContent value="professional" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <TalentProfessionalInfoForm
                    initialData={profileData ? mapTalentProfileToProfessionalInfo(profileData) : undefined}
                    onSaved={handleProfileUpdate}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
