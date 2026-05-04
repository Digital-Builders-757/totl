"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronDown, ChevronUp, Save, User, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { upsertTalentProfileAction } from "@/lib/actions/profile-actions";
import { PATHS } from "@/lib/constants/routes";
import { userSafeMessage } from "@/lib/errors/user-safe-message";
import { logger } from "@/lib/utils/logger";
import { isModelingTalent } from "@/lib/utils/talent-type";
import type { Database } from "@/types/supabase";

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"];
type TalentProfileFormData = Pick<
  TalentProfile,
  | "first_name"
  | "last_name"
  | "phone"
  | "location"
  | "age"
  | "experience"
  | "portfolio_url"
  | "height"
  | "measurements"
  | "hair_color"
  | "eye_color"
  | "shoe_size"
  | "languages"
  | "specialties"
> & {
  bust?: string | null;
  hips?: string | null;
  waist?: string | null;
  suit?: string | null;
  resume_link?: string | null;
};

// Define the form schema
const profileSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name cannot exceed 50 characters" }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name cannot exceed 50 characters" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[1-9][\d]{0,15}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  location: z.string().max(100, { message: "Location cannot exceed 100 characters" }).optional(),
  age: z
    .string()
    .optional()
    .refine((val) => !val || (parseInt(val) >= 18 && parseInt(val) <= 100), {
      message: "Age must be between 18 and 100",
    }),
  experience: z
    .string()
    .max(500, { message: "Experience cannot exceed 500 characters" })
    .optional(),
  portfolio_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  height: z.string().max(20, { message: "Height cannot exceed 20 characters" }).optional(),
  measurements: z
    .string()
    .max(100, { message: "Measurements cannot exceed 100 characters" })
    .optional(),
  hair_color: z.string().max(30, { message: "Hair color cannot exceed 30 characters" }).optional(),
  eye_color: z.string().max(30, { message: "Eye color cannot exceed 30 characters" }).optional(),
  shoe_size: z.string().max(10, { message: "Shoe size cannot exceed 10 characters" }).optional(),
  bust: z.string().max(20, { message: "Bust cannot exceed 20 characters" }).optional(),
  hips: z.string().max(20, { message: "Hips cannot exceed 20 characters" }).optional(),
  waist: z.string().max(20, { message: "Waist cannot exceed 20 characters" }).optional(),
  suit: z.string().max(20, { message: "Suit size cannot exceed 20 characters" }).optional(),
  resume_link: z
    .string()
    .url({ message: "Please enter a valid resume URL" })
    .optional()
    .or(z.literal("")),
  languages: z.string().max(200, { message: "Languages cannot exceed 200 characters" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface TalentProfileFormProps {
  initialData?: TalentProfileFormData | null;
}

export default function TalentProfileForm({ initialData }: TalentProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const hasAdvancedValues = Boolean(
    initialData?.age ||
      initialData?.experience ||
      initialData?.languages?.length ||
      initialData?.height ||
      initialData?.measurements ||
      initialData?.hair_color ||
      initialData?.eye_color ||
      initialData?.shoe_size ||
      initialData?.bust ||
      initialData?.hips ||
      initialData?.waist ||
      initialData?.suit ||
      initialData?.resume_link
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  // Determine if this is modeling talent based on specialties from initialData
  // Note: Specialties are managed in a separate form (talent-professional-info-form),
  // so visibility is based on current specialties, not dynamically changing here
  const showModelingFields = isModelingTalent(initialData?.specialties);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    unregister,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      phone: initialData?.phone || "",
      location: initialData?.location || "",
      age: initialData?.age?.toString() || "",
      experience: initialData?.experience || "",
      portfolio_url: initialData?.portfolio_url || "",
      height: initialData?.height || "",
      measurements: initialData?.measurements || "",
      hair_color: initialData?.hair_color || "",
      eye_color: initialData?.eye_color || "",
      shoe_size: initialData?.shoe_size || "",
      bust: initialData?.bust || "",
      hips: initialData?.hips || "",
      waist: initialData?.waist || "",
      suit: initialData?.suit || "",
      resume_link: initialData?.resume_link || "",
      languages: initialData?.languages?.join(", ") || "",
    },
    shouldUnregister: true, // Unregister hidden fields so they don't submit
  });

  // Unregister modeling fields if they're hidden
  React.useEffect(() => {
    if (!showModelingFields) {
      // Fields are hidden - unregister them so they don't submit
      unregister("height");
      unregister("measurements");
      unregister("hair_color");
      unregister("eye_color");
      unregister("shoe_size");
      unregister("bust");
      unregister("hips");
      unregister("waist");
      unregister("suit");
      unregister("resume_link");
    }
  }, [showModelingFields, unregister]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const languages = data.languages
        ? data.languages
            .split(",")
            .map((lang) => lang.trim())
            .filter(Boolean)
        : null;

        // Only include modeling fields if they're visible (present in form data)
        // Hidden fields will be undefined and won't be included in the payload
        const result = await upsertTalentProfileAction({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          location: data.location || null,
          age: data.age ? parseInt(data.age, 10) : null,
          experience: data.experience || null,
          portfolio_url: data.portfolio_url || null,
          // Only include modeling fields if they exist in the form data (visible fields)
          // If fields are hidden, they'll be undefined and won't be included
          ...(showModelingFields && data.height !== undefined && { height: data.height || null }),
          ...(showModelingFields && data.measurements !== undefined && { measurements: data.measurements || null }),
          ...(showModelingFields && data.hair_color !== undefined && { hair_color: data.hair_color || null }),
          ...(showModelingFields && data.eye_color !== undefined && { eye_color: data.eye_color || null }),
          ...(showModelingFields && data.shoe_size !== undefined && { shoe_size: data.shoe_size || null }),
          ...(showModelingFields && data.bust !== undefined && { bust: data.bust || null }),
          ...(showModelingFields && data.hips !== undefined && { hips: data.hips || null }),
          ...(showModelingFields && data.waist !== undefined && { waist: data.waist || null }),
          ...(showModelingFields && data.suit !== undefined && { suit: data.suit || null }),
          ...(showModelingFields &&
            data.resume_link !== undefined && { resume_link: data.resume_link || null }),
          languages,
        });

      if (!result.ok) {
        throw new Error(result.error);
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });

      // Reset form dirty state
      reset(data);

      // Redirect to dashboard
      router.push(PATHS.TALENT_DASHBOARD);
    } catch (error) {
      logger.error("Error updating profile", error instanceof Error ? error : new Error(String(error)));

      const errorMessage = userSafeMessage(
        error,
        "We couldn't update your profile right now. Please try again."
      );

      setServerError(errorMessage);

      toast({
        title: "Error updating profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-20 sm:pb-0">
      {serverError && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-tertiary)]">
            Your name and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="first_name"
                className={errors.first_name ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                First Name *
              </Label>
              <Input
                id="first_name"
                placeholder="Enter your first name"
                {...register("first_name")}
                className={
                  errors.first_name
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.first_name && (
                <p className="text-sm text-red-400">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="last_name"
                className={errors.last_name ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                Last Name *
              </Label>
              <Input
                id="last_name"
                placeholder="Enter your last name"
                {...register("last_name")}
                className={
                  errors.last_name
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.last_name && (
                <p className="text-sm text-red-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className={errors.phone ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                {...register("phone")}
                className={
                  errors.phone
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-sm text-red-400">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="location"
                className={errors.location ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                Location
              </Label>
              <Input
                id="location"
                placeholder="City, State"
                {...register("location")}
                className={
                  errors.location
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.location && <p className="text-sm text-red-400">{errors.location.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="portfolio_url"
              className={errors.portfolio_url ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
            >
              Portfolio URL
            </Label>
            <Input
              id="portfolio_url"
              type="url"
              placeholder="https://your-portfolio.com"
              {...register("portfolio_url")}
              className={
                errors.portfolio_url
                  ? "border-red-500/80"
                  : ""
              }
              disabled={isSubmitting}
            />
            {errors.portfolio_url && (
              <p className="text-sm text-red-400">{errors.portfolio_url.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="panel-frosted rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-2 py-2 text-left text-white hover:bg-white/10"
          onClick={() => setShowAdvanced((current) => !current)}
        >
          <span>
            {showAdvanced ? "Hide additional profile details" : "Add additional profile details"}
          </span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <p className="px-2 pt-1 text-xs text-[var(--oklch-text-tertiary)]">
          Keep this compact on mobile and expand only when you are ready.
        </p>
      </div>

      {/* Physical Characteristics */}
      {showAdvanced ? (
        <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5" />
            Physical Characteristics
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-tertiary)]">
            Your physical measurements and characteristics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className={errors.age ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                {...register("age")}
                className={
                  errors.age
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.age && <p className="text-sm text-red-400">{errors.age.message}</p>}
            </div>
            {/* Modeling-only fields - conditionally rendered */}
            {showModelingFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="height" className={errors.height ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                    Height
                  </Label>
                  <Input
                    id="height"
                    placeholder="5'8&quot;"
                    {...register("height")}
                    className={
                      errors.height
                        ? "border-red-500/80"
                        : ""
                    }
                    disabled={isSubmitting}
                  />
                  {errors.height && <p className="text-sm text-red-400">{errors.height.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="shoe_size"
                    className={errors.shoe_size ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
                  >
                    Shoe Size
                  </Label>
                  <Input
                    id="shoe_size"
                    placeholder="8"
                    {...register("shoe_size")}
                    className={
                      errors.shoe_size
                        ? "border-red-500/80"
                        : ""
                    }
                    disabled={isSubmitting}
                  />
                  {errors.shoe_size && (
                    <p className="text-sm text-red-400">{errors.shoe_size.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Modeling-only fields - conditionally rendered */}
          {showModelingFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="hair_color"
                  className={errors.hair_color ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
                >
                  Hair Color
                </Label>
                <Input
                  id="hair_color"
                  placeholder="Brown"
                  {...register("hair_color")}
                  className={
                    errors.hair_color
                      ? "border-red-500/80"
                      : ""
                  }
                  disabled={isSubmitting}
                />
                {errors.hair_color && (
                  <p className="text-sm text-red-400">{errors.hair_color.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="eye_color"
                  className={errors.eye_color ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
                >
                  Eye Color
                </Label>
                <Input
                  id="eye_color"
                  placeholder="Blue"
                  {...register("eye_color")}
                  className={
                    errors.eye_color
                      ? "border-red-500/80"
                      : ""
                  }
                  disabled={isSubmitting}
                />
                {errors.eye_color && (
                  <p className="text-sm text-red-400">{errors.eye_color.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Modeling-only field - conditionally rendered */}
          {showModelingFields && (
            <div className="space-y-2">
              <Label
                htmlFor="measurements"
                className={errors.measurements ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                Measurements
              </Label>
              <Input
                id="measurements"
                placeholder="34-26-36"
                {...register("measurements")}
                className={
                  errors.measurements
                    ? "border-red-500/80"
                    : ""
                }
                disabled={isSubmitting}
              />
              {errors.measurements && (
                <p className="text-sm text-red-400">{errors.measurements.message}</p>
              )}
            </div>
          )}

          {showModelingFields && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bust" className={errors.bust ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                  Bust
                </Label>
                <Input
                  id="bust"
                  placeholder="34"
                  {...register("bust")}
                  className={errors.bust ? "border-red-500/80" : ""}
                  disabled={isSubmitting}
                />
                {errors.bust ? <p className="text-sm text-red-400">{errors.bust.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist" className={errors.waist ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                  Waist
                </Label>
                <Input
                  id="waist"
                  placeholder="26"
                  {...register("waist")}
                  className={errors.waist ? "border-red-500/80" : ""}
                  disabled={isSubmitting}
                />
                {errors.waist ? <p className="text-sm text-red-400">{errors.waist.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips" className={errors.hips ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                  Hips
                </Label>
                <Input
                  id="hips"
                  placeholder="36"
                  {...register("hips")}
                  className={errors.hips ? "border-red-500/80" : ""}
                  disabled={isSubmitting}
                />
                {errors.hips ? <p className="text-sm text-red-400">{errors.hips.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="suit" className={errors.suit ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}>
                  Suit
                </Label>
                <Input
                  id="suit"
                  placeholder="38R"
                  {...register("suit")}
                  className={errors.suit ? "border-red-500/80" : ""}
                  disabled={isSubmitting}
                />
                {errors.suit ? <p className="text-sm text-red-400">{errors.suit.message}</p> : null}
              </div>
            </div>
          )}

          {showModelingFields && (
            <div className="space-y-2">
              <Label
                htmlFor="resume_link"
                className={errors.resume_link ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                Resume Link
              </Label>
              <Input
                id="resume_link"
                type="url"
                placeholder="https://..."
                {...register("resume_link")}
                className={errors.resume_link ? "border-red-500/80" : ""}
                disabled={isSubmitting}
              />
              {errors.resume_link ? (
                <p className="text-sm text-red-400">{errors.resume_link.message}</p>
              ) : (
                <p className="text-xs text-[var(--oklch-text-tertiary)]">
                  Add a shareable resume URL for casting submissions.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      ) : null}

      {/* Additional Information */}
      {showAdvanced ? (
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            Additional Information
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-tertiary)]">Your experience and languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="experience"
              className={errors.experience ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
            >
              Experience
            </Label>
            <Textarea
              id="experience"
              placeholder="Describe your professional experience..."
              {...register("experience")}
              className={
                errors.experience
                  ? "border-red-500/80"
                  : ""
              }
              disabled={isSubmitting}
              rows={4}
            />
            {errors.experience && (
              <p className="text-sm text-red-400">{errors.experience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="languages"
              className={errors.languages ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
            >
              Languages (comma-separated)
            </Label>
            <Input
              id="languages"
              placeholder="English, Spanish, French"
              {...register("languages")}
              className={
                errors.languages
                  ? "border-red-500/80"
                  : ""
              }
              disabled={isSubmitting}
            />
            {errors.languages && <p className="text-sm text-red-400">{errors.languages.message}</p>}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {/* Submit Button */}
      <div className="panel-frosted sticky bottom-3 z-10 -mx-1 rounded-2xl border border-white/10 bg-[rgba(10,10,18,0.82)] p-3 backdrop-blur supports-[backdrop-filter]:bg-[rgba(10,10,18,0.72)]">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(PATHS.TALENT_DASHBOARD)}
          disabled={isSubmitting}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="button-glow"
        >
          {isSubmitting ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
        </div>
      </div>
    </form>
  );
}
