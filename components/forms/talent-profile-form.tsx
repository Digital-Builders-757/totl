﻿"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Save, User, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

// Define the talent profile interface based on database schema
interface TalentProfile {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  age?: number | null;
  location?: string | null;
  experience?: string | null;
  portfolio_url?: string | null;
  height?: string | null;
  measurements?: string | null;
  hair_color?: string | null;
  eye_color?: string | null;
  shoe_size?: string | null;
  languages?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

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
  languages: z.string().max(200, { message: "Languages cannot exceed 200 characters" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface TalentProfileFormProps {
  initialData?: TalentProfile | null;
}

export default function TalentProfileForm({ initialData }: TalentProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createSupabaseBrowser();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
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
      languages: initialData?.languages?.join(", ") || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (!supabase) {
        toast({
          title: "Error",
          description: "Database connection not available",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication error");
      }

      // Prepare data for update
      const updateData = {
        ...data,
        languages: data.languages ? data.languages.split(",").map((lang) => lang.trim()).filter(Boolean) : [],
        age: data.age ? parseInt(data.age) : null,
      };

      // Clean the data - remove empty strings and convert to null for optional fields
      const cleanedData: Record<string, string | number | string[] | null> = { ...updateData };
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') {
          cleanedData[key] = null;
        }
      });

      // Update talent profile using upsert with the user_id as the conflict target
      const { error: updateError } = await supabase
        .from("talent_profiles")
        .upsert(
          {
            user_id: user.id,
            ...cleanedData,
          },
          {
            onConflict: 'user_id', // Specify the unique constraint column
            ignoreDuplicates: false, // Update on conflict
          }
        )
        .select()
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows

      if (updateError) {
        console.error("Supabase update error details:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        throw new Error(updateError.message || updateError.details || updateError.hint || "Failed to update profile");
      }

      // Update display name in profiles table
      const displayName = `${data.first_name} ${data.last_name}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating display name:", profileError);
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });

      // Reset form dirty state
      reset(data);

      // Redirect to dashboard
      router.push("/talent/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Extract error message from various error types
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle Supabase error objects
        const supabaseError = error as { message?: string; details?: string; hint?: string };
        errorMessage = supabaseError.message || supabaseError.details || supabaseError.hint || errorMessage;
      }
      
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your name and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="first_name"
                className={errors.first_name ? "text-red-400" : "text-gray-300"}
              >
                First Name *
              </Label>
              <Input
                id="first_name"
                placeholder="Enter your first name"
                {...register("first_name")}
                className={
                  errors.first_name
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
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
                className={errors.last_name ? "text-red-400" : "text-gray-300"}
              >
                Last Name *
              </Label>
              <Input
                id="last_name"
                placeholder="Enter your last name"
                {...register("last_name")}
                className={
                  errors.last_name
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
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
              <Label htmlFor="phone" className={errors.phone ? "text-red-400" : "text-gray-300"}>
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                {...register("phone")}
                className={
                  errors.phone
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-sm text-red-400">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="location"
                className={errors.location ? "text-red-400" : "text-gray-300"}
              >
                Location
              </Label>
              <Input
                id="location"
                placeholder="City, State"
                {...register("location")}
                className={
                  errors.location
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.location && <p className="text-sm text-red-400">{errors.location.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="portfolio_url"
              className={errors.portfolio_url ? "text-red-400" : "text-gray-300"}
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
                  ? "border-red-500 bg-gray-800 text-white"
                  : "bg-gray-800 border-gray-600 text-white"
              }
              disabled={isSubmitting}
            />
            {errors.portfolio_url && (
              <p className="text-sm text-red-400">{errors.portfolio_url.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Physical Characteristics */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5" />
            Physical Characteristics
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your physical measurements and characteristics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className={errors.age ? "text-red-400" : "text-gray-300"}>
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                {...register("age")}
                className={
                  errors.age
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.age && <p className="text-sm text-red-400">{errors.age.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className={errors.height ? "text-red-400" : "text-gray-300"}>
                Height
              </Label>
              <Input
                id="height"
                placeholder="5'8&quot;"
                {...register("height")}
                className={
                  errors.height
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.height && <p className="text-sm text-red-400">{errors.height.message}</p>}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="shoe_size"
                className={errors.shoe_size ? "text-red-400" : "text-gray-300"}
              >
                Shoe Size
              </Label>
              <Input
                id="shoe_size"
                placeholder="8"
                {...register("shoe_size")}
                className={
                  errors.shoe_size
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.shoe_size && (
                <p className="text-sm text-red-400">{errors.shoe_size.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="hair_color"
                className={errors.hair_color ? "text-red-400" : "text-gray-300"}
              >
                Hair Color
              </Label>
              <Input
                id="hair_color"
                placeholder="Brown"
                {...register("hair_color")}
                className={
                  errors.hair_color
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
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
                className={errors.eye_color ? "text-red-400" : "text-gray-300"}
              >
                Eye Color
              </Label>
              <Input
                id="eye_color"
                placeholder="Blue"
                {...register("eye_color")}
                className={
                  errors.eye_color
                    ? "border-red-500 bg-gray-800 text-white"
                    : "bg-gray-800 border-gray-600 text-white"
                }
                disabled={isSubmitting}
              />
              {errors.eye_color && (
                <p className="text-sm text-red-400">{errors.eye_color.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="measurements"
              className={errors.measurements ? "text-red-400" : "text-gray-300"}
            >
              Measurements
            </Label>
            <Input
              id="measurements"
              placeholder="34-26-36"
              {...register("measurements")}
              className={
                errors.measurements
                  ? "border-red-500 bg-gray-800 text-white"
                  : "bg-gray-800 border-gray-600 text-white"
              }
              disabled={isSubmitting}
            />
            {errors.measurements && (
              <p className="text-sm text-red-400">{errors.measurements.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Information
          </CardTitle>
          <CardDescription>Your experience and languages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="experience"
              className={errors.experience ? "text-red-400" : "text-gray-300"}
            >
              Experience
            </Label>
            <Textarea
              id="experience"
              placeholder="Describe your modeling/acting experience..."
              {...register("experience")}
              className={
                errors.experience
                  ? "border-red-500 bg-gray-800 text-white"
                  : "bg-gray-800 border-gray-600 text-white"
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
              className={errors.languages ? "text-red-400" : "text-gray-300"}
            >
              Languages (comma-separated)
            </Label>
            <Input
              id="languages"
              placeholder="English, Spanish, French"
              {...register("languages")}
              className={
                errors.languages
                  ? "border-red-500 bg-gray-800 text-white"
                  : "bg-gray-800 border-gray-600 text-white"
              }
              disabled={isSubmitting}
            />
            {errors.languages && <p className="text-sm text-red-400">{errors.languages.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/talent/dashboard")}
          disabled={isSubmitting}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-white text-black hover:bg-gray-200"
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
    </form>
  );
}
