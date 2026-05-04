"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PATHS } from "@/lib/constants/routes";
import { userSafeMessage } from "@/lib/errors/user-safe-message";
import { logger } from "@/lib/utils/logger";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast({
          title: "Error",
          description: userSafeMessage(
            error,
            "We couldn't send a reset link right now. Please try again."
          ),
          variant: "destructive",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Email sent",
          description: "Check your email for the password reset link",
        });
      }
    } catch (error) {
      logger.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthEntryShell backHref={PATHS.LOGIN} backLabel="Back to login">
      <div className="mb-8 text-center">
        <Image
          src="/images/totl-logo-transparent.png"
          alt="TOTL Agency"
          width={120}
          height={50}
          className="mx-auto mb-6"
        />
        <h1 className="mb-2 text-2xl font-bold text-white">Reset Password</h1>
        <p className="text-gray-300">
          {isSubmitted
            ? "Check your email for a link to reset your password."
            : "Enter your email address and we'll send you a link to reset your password."}
        </p>
      </div>

      {!isSubmitted ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full button-glow" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <p className="mb-6 text-gray-300">
            If an account exists with the email you entered, you will receive a password reset link
            shortly.
          </p>
          <Button asChild variant="outline" className="w-full border-border/50 text-white hover:bg-white/10">
            <Link href={PATHS.LOGIN}>Return to Login</Link>
          </Button>
        </div>
      )}
    </AuthEntryShell>
  );
}
