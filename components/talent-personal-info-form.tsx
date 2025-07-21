"use client";

import { Info, Loader2 } from "lucide-react";
import type React from "react";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

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

interface PersonalInfoFormProps {
  initialData?: Partial<PersonalInfoFormData>;
  onSaved?: () => void;
}

export default function TalentPersonalInfoForm({
  initialData = {},
  onSaved,
}: PersonalInfoFormProps) {
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    phone: initialData.phone || "",
    age: initialData.age || "",
    location: initialData.location || "",
    height: initialData.height || "",
    measurements: initialData.measurements || "",
    hairColor: initialData.hairColor || "",
    eyeColor: initialData.eyeColor || "",
    shoeSize: initialData.shoeSize || "",
    languages: initialData.languages || ["English"],
    instagram: initialData.instagram || "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { supabase, user } = useAuth();

  // Available options for select fields
  const hairColorOptions = ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Other"];
  const eyeColorOptions = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Other"];
  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Mandarin",
    "Arabic",
    "Russian",
    "Portuguese",
    "Japanese",
    "Korean",
    "Italian",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSelectChange = (id: string, value: string) => {
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

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => {
      const currentLanguages = [...prev.languages];

      if (currentLanguages.includes(language)) {
        return { ...prev, languages: currentLanguages.filter((lang) => lang !== language) };
      } else {
        return { ...prev, languages: [...currentLanguages, language] };
      }
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate phone (required and format)
    if (!formData.phone) {
      errors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^\+?[0-9\s\-()]+$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Please enter a valid phone number";
      }
    }

    // Validate age
    if (!formData.age) {
      errors.age = "Age is required";
    } else {
      const ageNum = Number.parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
        errors.age = "Please enter a valid age between 16 and 100";
      }
    }

    // Validate location
    if (!formData.location.trim()) errors.location = "Location is required";

    // Validate height format if provided
    if (formData.height) {
      const heightRegex = /^(\d+'\d+"|\d+\.\d+|\d+)$/;
      if (!heightRegex.test(formData.height)) {
        errors.height = "Please enter a valid height (e.g., 5'10\" or 178)";
      }
    }

    // Validate Instagram handle format if provided
    if (formData.instagram) {
      if (formData.instagram.startsWith("@")) {
        formData.instagram = formData.instagram.substring(1);
      }

      const instagramRegex = /^[a-zA-Z0-9._]+$/;
      if (!instagramRegex.test(formData.instagram)) {
        errors.instagram = "Please enter a valid Instagram handle without the @ symbol";
      }
    }

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
          phone: formData.phone,
          age: Number.parseInt(formData.age) || null,
          location: formData.location,
          height: formData.height || null,
          measurements: formData.measurements || null,
          hair_color: formData.hairColor || null,
          eye_color: formData.eyeColor || null,
          shoe_size: formData.shoeSize || null,
          languages: formData.languages,
          instagram: formData.instagram || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your personal information has been saved successfully.",
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
        <Label htmlFor="phone" className={formErrors.phone ? "text-red-500" : ""}>
          Phone Number *
        </Label>
        <Input
          id="phone"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleChange}
          required
          className={formErrors.phone ? "border-red-500" : ""}
        />
        {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="age" className={formErrors.age ? "text-red-500" : ""}>
            Age *
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={handleChange}
            required
            className={formErrors.age ? "border-red-500" : ""}
          />
          {formErrors.age && <p className="text-sm text-red-500 mt-1">{formErrors.age}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className={formErrors.location ? "text-red-500" : ""}>
            Location *
          </Label>
          <Input
            id="location"
            placeholder="City, Country"
            value={formData.location}
            onChange={handleChange}
            required
            className={formErrors.location ? "border-red-500" : ""}
          />
          {formErrors.location && (
            <p className="text-sm text-red-500 mt-1">{formErrors.location}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="height">
            Height
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1 inline text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Enter your height in feet and inches (e.g., 5&apos;10&quot;) or centimeters (e.g., 178)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="height"
            placeholder="e.g., 5'10&quot; or 178"
            value={formData.height}
            onChange={handleChange}
            className={formErrors.height ? "border-red-500" : ""}
          />
          {formErrors.height && <p className="text-sm text-red-500 mt-1">{formErrors.height}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="measurements">
            Measurements
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1 inline text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Enter your measurements in the format: bust-waist-hips (e.g., 34-28-36)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="measurements"
            placeholder="e.g., 34-28-36"
            value={formData.measurements}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="hairColor">Hair Color</Label>
          <Select
            value={formData.hairColor}
            onValueChange={(value) => handleSelectChange("hairColor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select hair color" />
            </SelectTrigger>
            <SelectContent>
              {hairColorOptions.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eyeColor">Eye Color</Label>
          <Select
            value={formData.eyeColor}
            onValueChange={(value) => handleSelectChange("eyeColor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select eye color" />
            </SelectTrigger>
            <SelectContent>
              {eyeColorOptions.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shoeSize">Shoe Size</Label>
          <Input
            id="shoeSize"
            placeholder="e.g., 9 or 42"
            value={formData.shoeSize}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="languages">Languages</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {languageOptions.map((language) => (
            <div key={language} className="flex items-center space-x-2">
              <Checkbox
                id={`language-${language}`}
                checked={formData.languages.includes(language)}
                onCheckedChange={() => handleLanguageToggle(language)}
              />
              <label
                htmlFor={`language-${language}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram">
          Instagram Handle
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 ml-1 inline text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px] text-xs">
                  Enter your Instagram username without the @ symbol
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
          <Input
            id="instagram"
            placeholder="username"
            value={formData.instagram}
            onChange={handleChange}
            className={`pl-8 ${formErrors.instagram ? "border-red-500" : ""}`}
          />
        </div>
        {formErrors.instagram && (
          <p className="text-sm text-red-500 mt-1">{formErrors.instagram}</p>
        )}
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
            "Save Personal Information"
          )}
        </Button>
      </div>
    </form>
  );
}
