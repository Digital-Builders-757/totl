"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
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
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type Talent = Database["public"]["Tables"]["talent_profiles"]["Row"] & {
  bust?: string | null;
  hips?: string | null;
  waist?: string | null;
  suit?: string | null;
  resume_link?: string | null;
};

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
  bust: z.string().max(20, "Bust cannot exceed 20 characters").optional(),
  hips: z.string().max(20, "Hips cannot exceed 20 characters").optional(),
  waist: z.string().max(20, "Waist cannot exceed 20 characters").optional(),
  suit: z.string().max(20, "Suit size cannot exceed 20 characters").optional(),
  resume_link: z.string().url("Please enter a valid resume URL").optional().or(z.literal("")),
  languages: z.string().optional(),
});

type TalentFormData = z.infer<typeof talentSchema>;

const settingsGlassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none";
const fieldInput =
  "bg-white/5 border-white/10 text-white placeholder:text-[var(--oklch-text-tertiary)]";
const fieldInputError =
  "border-red-500/80 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]";

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
      bust: talent?.bust || "",
      hips: talent?.hips || "",
      waist: talent?.waist || "",
      suit: talent?.suit || "",
      resume_link: talent?.resume_link || "",
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
        bust: data.bust || undefined,
        hips: data.hips || undefined,
        waist: data.waist || undefined,
        suit: data.suit || undefined,
        resume_link: data.resume_link || undefined,
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
      logger.error("Talent profile update error", error);
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
      <Card className={settingsGlassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-[var(--oklch-accent)]" aria-hidden />
            Talent details
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Information clients see when you apply and get booked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="first_name"
                  className={
                    errors.first_name ? "text-red-400" : "text-[var(--oklch-text-secondary)]"
                  }
                >
                  First name *
                </Label>
                <Input
                  id="first_name"
                  placeholder="Enter your first name"
                  {...register("first_name")}
                  className={errors.first_name ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-400">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="last_name"
                  className={
                    errors.last_name ? "text-red-400" : "text-[var(--oklch-text-secondary)]"
                  }
                >
                  Last name *
                </Label>
                <Input
                  id="last_name"
                  placeholder="Enter your last name"
                  {...register("last_name")}
                  className={errors.last_name ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-400">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portfolio_url" className="text-[var(--oklch-text-secondary)]">
                  Portfolio URL
                </Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://portfolio.example.com"
                  {...register("portfolio_url")}
                  className={errors.portfolio_url ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.portfolio_url ? (
                  <p className="text-sm text-red-400">{errors.portfolio_url.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_link" className="text-[var(--oklch-text-secondary)]">
                  Resume Link
                </Label>
                <Input
                  id="resume_link"
                  type="url"
                  placeholder="https://drive.google.com/... or your website resume"
                  {...register("resume_link")}
                  className={errors.resume_link ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.resume_link ? (
                  <p className="text-sm text-red-400">{errors.resume_link.message}</p>
                ) : (
                  <p className="text-xs text-[var(--oklch-text-tertiary)]">
                    This supports your digital comp card for casting and client review.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--oklch-text-secondary)]">Comp Card Measurements</Label>
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-[var(--oklch-text-secondary)]">
                    Height
                  </Label>
                  <Input
                    id="height"
                    placeholder={`5'10"`}
                    {...register("height")}
                    className={errors.height ? fieldInputError : fieldInput}
                    disabled={isSubmitting}
                  />
                  {errors.height ? (
                    <p className="text-sm text-red-400">{errors.height.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shoe_size" className="text-[var(--oklch-text-secondary)]">
                    Shoe
                  </Label>
                  <Input
                    id="shoe_size"
                    placeholder="8 / 42"
                    {...register("shoe_size")}
                    className={errors.shoe_size ? fieldInputError : fieldInput}
                    disabled={isSubmitting}
                  />
                  {errors.shoe_size ? (
                    <p className="text-sm text-red-400">{errors.shoe_size.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suit" className="text-[var(--oklch-text-secondary)]">
                    Suit
                  </Label>
                  <Input
                    id="suit"
                    placeholder="38R"
                    {...register("suit")}
                    className={errors.suit ? fieldInputError : fieldInput}
                    disabled={isSubmitting}
                  />
                  {errors.suit ? (
                    <p className="text-sm text-red-400">{errors.suit.message}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bust" className="text-[var(--oklch-text-secondary)]">
                  Bust
                </Label>
                <Input
                  id="bust"
                  placeholder="34"
                  {...register("bust")}
                  className={errors.bust ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.bust ? <p className="text-sm text-red-400">{errors.bust.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waist" className="text-[var(--oklch-text-secondary)]">
                  Waist
                </Label>
                <Input
                  id="waist"
                  placeholder="26"
                  {...register("waist")}
                  className={errors.waist ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.waist ? <p className="text-sm text-red-400">{errors.waist.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hips" className="text-[var(--oklch-text-secondary)]">
                  Hips
                </Label>
                <Input
                  id="hips"
                  placeholder="36"
                  {...register("hips")}
                  className={errors.hips ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.hips ? <p className="text-sm text-red-400">{errors.hips.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurements" className="text-[var(--oklch-text-secondary)]">
                  Measurements
                </Label>
                <Input
                  id="measurements"
                  placeholder="34-26-36"
                  {...register("measurements")}
                  className={errors.measurements ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.measurements ? (
                  <p className="text-sm text-red-400">{errors.measurements.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hair_color" className="text-[var(--oklch-text-secondary)]">
                  Hair
                </Label>
                <Input
                  id="hair_color"
                  placeholder="Brown"
                  {...register("hair_color")}
                  className={errors.hair_color ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.hair_color ? (
                  <p className="text-sm text-red-400">{errors.hair_color.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eye_color" className="text-[var(--oklch-text-secondary)]">
                  Eyes
                </Label>
                <Input
                  id="eye_color"
                  placeholder="Hazel"
                  {...register("eye_color")}
                  className={errors.eye_color ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                {errors.eye_color ? (
                  <p className="text-sm text-red-400">{errors.eye_color.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-[var(--oklch-text-secondary)]">
                Experience
              </Label>
              <Textarea
                id="experience"
                placeholder="Describe your experience and background"
                {...register("experience")}
                disabled={isSubmitting}
                rows={4}
                className={`${fieldInput} min-h-[120px] resize-y`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languages" className="text-[var(--oklch-text-secondary)]">
                Languages
              </Label>
              <Input
                id="languages"
                placeholder="English, Spanish, French"
                {...register("languages")}
                className={fieldInput}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="min-w-[120px] border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
