"use client";

import { Loader2 } from "lucide-react";
import type React from "react";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ProfessionalInfoFormData {
  experience: string;
  portfolio: string;
  specialties: string;
  achievements: string;
  availability: string;
}

interface ProfessionalInfoFormProps {
  initialData?: Partial<ProfessionalInfoFormData>;
  onSaved?: () => void;
}

export default function TalentProfessionalInfoForm({
  initialData = {},
  onSaved,
}: ProfessionalInfoFormProps) {
  const [formData, setFormData] = useState<ProfessionalInfoFormData>({
    experience: initialData.experience || "",
    portfolio: initialData.portfolio || "",
    specialties: initialData.specialties || "",
    achievements: initialData.achievements || "",
    availability: initialData.availability || "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { supabase, user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear error when field is edited
    if (formErrors[id]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate experience
    if (!formData.experience.trim()) errors.experience = "Experience information is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({
          experience: formData.experience,
          portfolio_url: formData.portfolio || null,
          specialties: formData.specialties
            ? formData.specialties.split(",").map((s) => s.trim())
            : null,
          achievements: formData.achievements || null,
          availability: formData.availability || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your professional information has been saved successfully.",
      });

      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="experience" className={formErrors.experience ? "text-red-500" : ""}>
          Modeling Experience *
        </Label>
        <Textarea
          id="experience"
          placeholder="Tell us about your modeling experience, previous work, and any specialties"
          rows={6}
          value={formData.experience}
          onChange={handleChange}
          required
          className={formErrors.experience ? "border-red-500" : ""}
        />
        {formErrors.experience && (
          <p className="text-sm text-red-500 mt-1">{formErrors.experience}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolio">Portfolio Link</Label>
        <Input
          id="portfolio"
          placeholder="Link to your portfolio or social media"
          value={formData.portfolio}
          onChange={handleChange}
        />
        <p className="text-xs text-gray-500 mt-1">
          Share a link to your existing portfolio, website, or social media profiles
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialties">Specialties</Label>
        <Textarea
          id="specialties"
          placeholder="List your modeling specialties (e.g., runway, editorial, commercial)"
          rows={3}
          value={formData.specialties}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="achievements">Notable Achievements</Label>
        <Textarea
          id="achievements"
          placeholder="Share your notable achievements, awards, or recognitions"
          rows={3}
          value={formData.achievements}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          placeholder="e.g., Weekdays, Full-time, Evenings only"
          value={formData.availability}
          onChange={handleChange}
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          className="bg-black text-white hover:bg-black/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Professional Information"
          )}
        </Button>
      </div>
    </form>
  );
}
