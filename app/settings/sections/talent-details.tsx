"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { upsertTalentProfile } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/supabase";

type Talent = Database["public"]["Tables"]["talent_profiles"]["Row"];

// Define a simple schema that matches what we can actually use
const talentSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters"),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters"),
  phone: z.string().optional(),
  age: z.string().optional(),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
  experience: z.string().max(500, "Experience cannot exceed 500 characters").optional(),
  portfolio_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  height: z.string().max(20, "Height cannot exceed 20 characters").optional(),
  measurements: z.string().max(100, "Measurements cannot exceed 100 characters").optional(),
  hair_color: z.string().max(30, "Hair color cannot exceed 30 characters").optional(),
  eye_color: z.string().max(30, "Eye color cannot exceed 30 characters").optional(),
  shoe_size: z.string().max(10, "Shoe size cannot exceed 10 characters").optional(),
  languages: z.string().optional(),
});

type TalentFormData = z.infer<typeof talentSchema>;

interface TalentDetailsSectionProps {
  talent: Talent | null;
}

export function TalentDetailsSection({ talent }: TalentDetailsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<TalentFormData>({
    resolver: zodResolver(talentSchema),
    defaultValues: {
      first_name: talent?.first_name || "",
      last_name: talent?.last_name || "",
      phone: talent?.phone || "",
      age: talent?.age?.toString() || "",
      location: talent?.location || "",
      experience: talent?.experience || "",
      portfolio_url: talent?.portfolio_url || "",
      height: talent?.height || "",
      measurements: talent?.measurements || "",
      hair_color: talent?.hair_color || "",
      eye_color: talent?.eye_color || "",
      shoe_size: talent?.shoe_size || "",
      languages: talent?.languages?.join(", ") || "",
    },
  });

  const onSubmit = async (data: TalentFormData) => {
    setIsSubmitting(true);

    try {
      const result = await upsertTalentProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
        age: data.age ? parseInt(data.age) : undefined,
        location: data.location || undefined,
        experience: data.experience || undefined,
        portfolio_url: data.portfolio_url || undefined,
        height: data.height || undefined,
        measurements: data.measurements || undefined,
        hair_color: data.hair_color || undefined,
        eye_color: data.eye_color || undefined,
        shoe_size: data.shoe_size || undefined,
        languages: data.languages
          ? data.languages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      });

      if (result.error) {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your talent details have been updated successfully.",
        });
        reset(data);
      }
    } catch (error) {
      console.error("Talent profile update error:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Talent Details</CardTitle>
          <CardDescription>Update your talent-specific information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className={errors.first_name ? "text-red-500" : ""}>
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  placeholder="Enter your first name"
                  {...register("first_name")}
                  className={errors.first_name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className={errors.last_name ? "text-red-500" : ""}>
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  placeholder="Enter your last name"
                  {...register("last_name")}
                  className={errors.last_name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your experience and background"
                {...register("experience")}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || !isDirty} className="min-w-[100px]">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
