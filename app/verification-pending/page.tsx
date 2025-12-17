"use client";

import { ArrowLeft, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

export default function VerificationPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? "";
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"unknown" | "sent" | "error">("unknown");
  const { toast } = useToast();
  const supabase = createSupabaseBrowser();

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
      if (!supabase) {
        toast({
          title: "Error",
          description: "Database connection not available",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Error resending verification email:", error);
        throw new Error(error.message);
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
      console.error("Error sending verification email:", error);
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
    <div className="min-h-screen bg-black pt-4 sm:pt-12 md:pt-16 lg:pt-20 xl:pt-24 relative overflow-hidden">
      {/* Subtle gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4 sm:mb-6 md:mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-white/5 overflow-hidden backdrop-blur-sm">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-gray-600 via-white to-gray-600" />
          
          <CardHeader className="p-4 sm:p-6 md:p-8">
            <div className="w-16 h-16 bg-amber-900/30 border border-amber-700/50 rounded-full mx-auto flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-center text-white text-xl sm:text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription className="text-center text-gray-400 mt-2">
              We&apos;ve sent a verification email to <strong className="text-white">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 md:p-8 pt-0">
            <p className="text-center text-gray-300">
              Please check your inbox and click the verification link to complete your
              registration.
            </p>

            {emailStatus === "sent" && (
              <Alert className="bg-green-900/30 border-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  {justSent
                    ? "Verification email has been resent successfully!"
                    : "Verification email has been sent!"}
                </AlertDescription>
              </Alert>
            )}

            {emailStatus === "error" && (
              <Alert className="bg-amber-900/30 border-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300">
                  There was an issue sending the verification email. Please try again or contact
                  support.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-white">Didn&apos;t receive the email?</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Check your spam or junk folder
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Make sure you entered the correct email address
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Wait a few minutes for the email to arrive
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  If you still don&apos;t see it, try clicking the resend button below
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-4 sm:p-6 md:p-8 pt-0">
            <Button
              onClick={handleResendEmail}
              disabled={isSending || justSent}
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
            >
              {isSending ? "Sending..." : justSent ? "Email sent" : "Resend verification email"}
            </Button>
            <div className="text-center text-sm text-gray-400">
              Already verified?{" "}
              <Link
                href={PATHS.LOGIN}
                className="text-white font-semibold hover:text-gray-200 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </div>
      </div>
    </div>
  );
}
