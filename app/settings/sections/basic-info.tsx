"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateBasicProfile } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const basicInfoSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoSectionProps {
  user: User;
  profile: Pick<
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
}

export function BasicInfoSection({ user, profile }: BasicInfoSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      display_name: profile.display_name || "",
    },
  });

  const onSubmit = async (data: BasicInfoFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("display_name", data.display_name);

      const result = await updateBasicProfile(formData);

      if (result.error) {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your basic information has been updated successfully.",
        });
        reset(data); // Reset form with new values
      }
    } catch (error) {
      console.error("Profile update error:", error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-5 w-5">👤</div>
          Basic Information
        </CardTitle>
        <CardDescription>Update your basic profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500">
              Email cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className={errors.display_name ? "text-red-500" : ""}>
              Display Name *
            </Label>
            <Input
              id="display_name"
              placeholder="Enter your display name"
              {...register("display_name")}
              className={errors.display_name ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.display_name && (
              <p className="text-sm text-red-500">{errors.display_name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              {profile.email_verified ? (
                <span className="text-green-600">✅ Email verified</span>
              ) : (
                <span className="text-yellow-600">⚠️ Email not verified</span>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting || !isDirty} className="min-w-[100px]">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
