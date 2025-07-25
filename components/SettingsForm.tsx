"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Profile {
  id: string;
  role: string;
  display_name: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface TalentProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  location?: string;
  experience?: string;
  portfolio_url?: string;
  bio?: string;
  height?: string;
  weight?: string;
  measurements?: string;
  hair_color?: string;
  eye_color?: string;
  created_at: string;
  updated_at: string;
}

interface ClientProfile {
  user_id: string;
  company_name: string;
  industry?: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_size?: string;
  created_at: string;
  updated_at: string;
}

interface SettingsFormProps {
  user: User;
  profile: Profile | null;
  roleProfile: TalentProfile | ClientProfile | null;
  userRole?: string;
}

export function SettingsForm({ user, profile, roleProfile, userRole }: SettingsFormProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    ...(userRole === "talent" && {
      first_name: (roleProfile as TalentProfile)?.first_name || "",
      last_name: (roleProfile as TalentProfile)?.last_name || "",
      location: (roleProfile as TalentProfile)?.location || "",
      experience: (roleProfile as TalentProfile)?.experience || "",
      portfolio_url: (roleProfile as TalentProfile)?.portfolio_url || "",
      bio: (roleProfile as TalentProfile)?.bio || "",
      height: (roleProfile as TalentProfile)?.height || "",
      weight: (roleProfile as TalentProfile)?.weight || "",
      measurements: (roleProfile as TalentProfile)?.measurements || "",
      hair_color: (roleProfile as TalentProfile)?.hair_color || "",
      eye_color: (roleProfile as TalentProfile)?.eye_color || "",
    }),
    ...(userRole === "client" && {
      company_name: (roleProfile as ClientProfile)?.company_name || "",
      industry: (roleProfile as ClientProfile)?.industry || "",
      website: (roleProfile as ClientProfile)?.website || "",
      contact_name: (roleProfile as ClientProfile)?.contact_name || "",
      contact_email: (roleProfile as ClientProfile)?.contact_email || "",
      contact_phone: (roleProfile as ClientProfile)?.contact_phone || "",
      company_size: (roleProfile as ClientProfile)?.company_size || "",
    }),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role-specific profile
      if (userRole === "talent") {
        const { error: talentError } = await supabase
          .from("talent_profiles")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            location: formData.location,
            experience: formData.experience,
            portfolio_url: formData.portfolio_url,
            bio: formData.bio,
            height: formData.height,
            weight: formData.weight,
            measurements: formData.measurements,
            hair_color: formData.hair_color,
            eye_color: formData.eye_color,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (talentError) throw talentError;
      } else if (userRole === "client") {
        const { error: clientError } = await supabase
          .from("client_profiles")
          .update({
            company_name: formData.company_name,
            industry: formData.industry,
            website: formData.website,
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            company_size: formData.company_size,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (clientError) throw clientError;
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          className={
            message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={message.type === "success" ? "text-green-800" : "text-red-800"}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange("display_name", e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Role-Specific Information */}
        {userRole === "talent" && (
          <Card>
            <CardHeader>
              <CardTitle>Talent Profile</CardTitle>
              <CardDescription>Update your talent-specific information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) => handleInputChange("experience", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="portfolio_url">Portfolio URL</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                  placeholder="https://your-portfolio.com"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    placeholder="5'8&quot;"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    placeholder="140 lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="measurements">Measurements</Label>
                  <Input
                    id="measurements"
                    value={formData.measurements}
                    onChange={(e) => handleInputChange("measurements", e.target.value)}
                    placeholder="34-26-36"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hair_color">Hair Color</Label>
                  <Input
                    id="hair_color"
                    value={formData.hair_color}
                    onChange={(e) => handleInputChange("hair_color", e.target.value)}
                    placeholder="Brown"
                  />
                </div>
                <div>
                  <Label htmlFor="eye_color">Eye Color</Label>
                  <Input
                    id="eye_color"
                    value={formData.eye_color}
                    onChange={(e) => handleInputChange("eye_color", e.target.value)}
                    placeholder="Blue"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === "client" && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    placeholder="Fashion, Beauty, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={formData.company_size}
                    onValueChange={(value) => handleInputChange("company_size", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://your-company.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange("contact_name", e.target.value)}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
