"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword } from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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
}

export function AccountSettingsSection({ user }: AccountSettingsSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

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
      console.error("Password change error:", error);
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

    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    return {
      strength: Math.min(strength, 5),
      color: colors[strength - 1] || "bg-gray-200",
      text: texts[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
          <CardDescription className="text-gray-400">
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Email Address</Label>
              <Input
                value={user.email || ""}
                disabled
                className="bg-gray-700 border-gray-600 text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Account Created</Label>
              <Input
                value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                disabled
                className="bg-gray-700 border-gray-600 text-gray-400"
              />
            </div>
          </div>

          <Alert className="bg-gray-700 border-gray-600">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-gray-300">
              For security reasons, email changes require contacting support. Password changes are
              handled securely through Supabase authentication.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Change Password</CardTitle>
          <CardDescription className="text-gray-400">
            Update your account password securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className={errors.currentPassword ? "text-red-400" : "text-gray-300"}
              >
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  {...register("currentPassword")}
                  className={
                    errors.currentPassword
                      ? "border-red-500 bg-gray-700 text-white"
                      : "bg-gray-700 border-gray-600 text-white"
                  }
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
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
                className={errors.newPassword ? "text-red-400" : "text-gray-300"}
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  {...register("newPassword")}
                  className={
                    errors.newPassword
                      ? "border-red-500 bg-gray-700 text-white"
                      : "bg-gray-700 border-gray-600 text-white"
                  }
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
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
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-300">{passwordStrength.text}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li className={newPassword.length >= 8 ? "text-green-400" : "text-gray-500"}>
                        At least 8 characters
                      </li>
                      <li
                        className={/[A-Z]/.test(newPassword) ? "text-green-400" : "text-gray-500"}
                      >
                        One uppercase letter
                      </li>
                      <li
                        className={/[a-z]/.test(newPassword) ? "text-green-400" : "text-gray-500"}
                      >
                        One lowercase letter
                      </li>
                      <li
                        className={/[0-9]/.test(newPassword) ? "text-green-400" : "text-gray-500"}
                      >
                        One number
                      </li>
                      <li
                        className={
                          /[^A-Za-z0-9]/.test(newPassword) ? "text-green-400" : "text-gray-500"
                        }
                      >
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
                className={errors.confirmPassword ? "text-red-400" : "text-gray-300"}
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  {...register("confirmPassword")}
                  className={
                    errors.confirmPassword
                      ? "border-red-500 bg-gray-700 text-white"
                      : "bg-gray-700 border-gray-600 text-white"
                  }
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400"
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
                className="min-w-[100px] bg-white text-black hover:bg-gray-200"
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
