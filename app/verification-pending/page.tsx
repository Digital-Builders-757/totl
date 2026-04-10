"use client";

import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LongToken } from "@/components/ui/long-token";
import { useToast } from "@/components/ui/use-toast";
import { PATHS } from "@/lib/constants/routes";
import { logger } from "@/lib/utils/logger";

export default function VerificationPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? "";
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"unknown" | "sent" | "error">("unknown");
  const { toast } = useToast();

  useEffect(() => {
    // Check if we just created the account
    const justCreated = searchParams?.get("new") === "true";
    if (justCreated) {
      setEmailStatus("sent");
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email address is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Single owner: all resend traffic flows through the governed server route.
      // This route generates a Supabase-native verification link and sends via Resend (non-enumerating).
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Resend failed: HTTP ${response.status}`);
      }

      setJustSent(true);
      setEmailStatus("sent");
      toast({
        title: "Email sent",
        description: "Verification email has been sent to your inbox",
      });

      setTimeout(() => {
        setJustSent(false);
      }, 30000);
    } catch (error) {
      logger.error("Error sending verification email", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setEmailStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthEntryShell backHref={PATHS.HOME} backLabel="Back to Home" panelPaddingClassName="p-0">
      <CardHeader className="p-6 sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/30">
          <Mail className="h-8 w-8 text-amber-400" />
        </div>
        <CardTitle className="text-center text-xl font-bold text-white sm:text-2xl">Verify your email</CardTitle>
        <CardDescription className="mt-2 text-center text-gray-400">
          We&apos;ve sent a verification email to{" "}
          <LongToken as="strong" value={email} className="text-white" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
        <p className="text-center text-gray-300">
          Please check your inbox and click the verification link to complete your registration.
        </p>

        {emailStatus === "sent" && (
          <Alert className="border-green-700 bg-green-900/30">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              {justSent
                ? "Verification email has been resent successfully!"
                : "Verification email has been sent!"}
            </AlertDescription>
          </Alert>
        )}

        {emailStatus === "error" && (
          <Alert className="border-amber-700 bg-amber-900/30">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-300">
              There was an issue sending the verification email. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-border/40 bg-white/5 p-4">
          <h4 className="mb-2 font-medium text-white">Didn&apos;t receive the email?</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="mr-2 text-green-400">•</span>
              Check your spam or junk folder
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-400">•</span>
              Make sure you entered the correct email address
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-400">•</span>
              Wait a few minutes for the email to arrive
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-400">•</span>
              If you still don&apos;t see it, try clicking the resend button below
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 px-6 pb-8 sm:px-8">
        <Button
          onClick={handleResendEmail}
          disabled={isSending || justSent}
          className="w-full font-semibold button-glow"
        >
          {isSending ? "Sending..." : justSent ? "Email sent" : "Resend verification email"}
        </Button>
        <div className="text-center text-sm text-gray-400">
          Already verified?{" "}
          <Link
            href={PATHS.LOGIN}
            className="focus-hint font-semibold text-white transition-colors hover:text-gray-200 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </AuthEntryShell>
  );
}
