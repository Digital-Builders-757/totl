"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateBasicProfile } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const basicInfoSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

const settingsGlassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none";
const fieldInput =
  "bg-white/5 border-white/10 text-white placeholder:text-[var(--oklch-text-tertiary)]";
const fieldInputError =
  "border-red-500/80 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]";
const fieldDisabled =
  "border-white/10 bg-white/[0.04] text-[var(--oklch-text-tertiary)] opacity-90";

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
      logger.error("Profile update error", error);
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
    <Card className={settingsGlassCard}>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <UserIcon className="h-5 w-5 text-[var(--oklch-accent)]" aria-hidden />
          Basic information
        </CardTitle>
        <CardDescription className="text-[var(--oklch-text-secondary)]">
          Update how your name appears across TOTL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--oklch-text-secondary)]">
              Email
            </Label>
            <Input id="email" type="email" value={user.email || ""} disabled className={fieldDisabled} />
            <p className="text-sm text-[var(--oklch-text-tertiary)]">
              Email can&apos;t be changed here. Contact support if you need a new address on file.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="display_name"
              className={errors.display_name ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
            >
              Display name *
            </Label>
            <Input
              id="display_name"
              placeholder="Enter your display name"
              {...register("display_name")}
              className={errors.display_name ? fieldInputError : fieldInput}
              disabled={isSubmitting}
            />
            {errors.display_name && (
              <p className="text-sm text-red-400">{errors.display_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--oklch-text-secondary)]">
              {profile.email_verified ? (
                <span className="text-emerald-400">Email verified</span>
              ) : (
                <span className="text-amber-400">Email not verified — check your inbox</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="min-w-[120px] shrink-0 border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
