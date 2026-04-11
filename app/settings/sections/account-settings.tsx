"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { Eye, EyeOff, AlertTriangle, LogOut } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword } from "../actions";
import { CareerBuilderSection } from "./career-builder-section";
import { SubscriptionSection } from "./subscription-section";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type MinimalProfile = Pick<Profile, "role" | "subscription_status" | "subscription_plan" | "subscription_current_period_end">;

const settingsGlassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none";
const fieldInput =
  "bg-white/5 border-white/10 text-white placeholder:text-[var(--oklch-text-tertiary)]";
const fieldInputError =
  "border-red-500/80 bg-white/5 text-white placeholder:text-[var(--oklch-text-tertiary)]";
const fieldDisabled =
  "border-white/10 bg-white/[0.04] text-[var(--oklch-text-tertiary)] opacity-90";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface AccountSettingsSectionProps {
  user: User;
  profile: MinimalProfile;
}

export function AccountSettingsSection({ user, profile }: AccountSettingsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth(); // Only get signOut, profile comes from props

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);

    try {
      const result = await changePassword(data.newPassword);

      if (result.error) {
        toast({
          title: "Password change failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
        reset(); // Reset form
      }
    } catch (error) {
      logger.error("Password change error", error);
      toast({
        title: "Password change failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const newPassword = watch("newPassword");

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, color: "bg-gray-200", text: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    return {
      strength: Math.min(strength, 5),
      color: colors[strength - 1] || "bg-white/25",
      text: texts[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      // AuthProvider's signOut() owns redirect - trust it
      await signOut();
    } catch (error) {
      logger.error("Sign out error", error);
      toast({
        title: "Sign out error",
        description: "There was an issue signing out. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card className={settingsGlassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-white">Account information</CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[var(--oklch-text-secondary)]">Email address</Label>
              <Input value={user.email || ""} disabled className={fieldDisabled} />
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--oklch-text-secondary)]">Account created</Label>
              <Input
                value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                disabled
                className={fieldDisabled}
              />
            </div>
          </div>

          <Alert className="border-amber-500/25 bg-amber-500/10 text-[var(--oklch-text-secondary)]">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription>
              Email changes require support. Password updates use secure authentication.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className={settingsGlassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-white">Change password</CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Update your password securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className={
                  errors.currentPassword ? "text-red-400" : "text-[var(--oklch-text-secondary)]"
                }
              >
                Current password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  {...register("currentPassword")}
                  className={errors.currentPassword ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-[var(--oklch-text-tertiary)] hover:bg-transparent hover:text-white"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-400">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className={errors.newPassword ? "text-red-400" : "text-[var(--oklch-text-secondary)]"}
              >
                New password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  {...register("newPassword")}
                  className={errors.newPassword ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-[var(--oklch-text-tertiary)] hover:bg-transparent hover:text-white"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-400">{errors.newPassword.message}</p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--oklch-text-secondary)]">
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[var(--oklch-text-tertiary)]">
                    <p className="text-[var(--oklch-text-secondary)]">Password must contain:</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li className={newPassword.length >= 8 ? "text-emerald-400" : ""}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(newPassword) ? "text-emerald-400" : ""}>
                        One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(newPassword) ? "text-emerald-400" : ""}>
                        One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(newPassword) ? "text-emerald-400" : ""}>
                        One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-400" : ""}>
                        One special character
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className={
                  errors.confirmPassword ? "text-red-400" : "text-[var(--oklch-text-secondary)]"
                }
              >
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? fieldInputError : fieldInput}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-[var(--oklch-text-tertiary)] hover:bg-transparent hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="min-w-[120px] border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <SubscriptionSection profile={profile} />

      {/* Career Builder Application Section */}
      <CareerBuilderSection userEmail={user.email} />

      {/* Sign Out */}
      <Card className={settingsGlassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-white">Sign out</CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            End your session on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-white md:w-auto"
          >
            {isSigningOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
