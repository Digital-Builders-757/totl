"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function VerificationPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"unknown" | "sent" | "error">("unknown");
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if we just created the account
    const justCreated = searchParams.get("new") === "true";
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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-center">Verify your email</CardTitle>
              <CardDescription className="text-center">
                We&apos;ve sent a verification email to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Please check your inbox and click the verification link to complete your
                registration.
              </p>

              {emailStatus === "sent" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {justSent
                      ? "Verification email has been resent successfully!"
                      : "Verification email has been sent!"}
                  </AlertDescription>
                </Alert>
              )}

              {emailStatus === "error" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    There was an issue sending the verification email. Please try again or contact
                    support.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Didn&apos;t receive the email?</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                  <li>• If you still don&apos;t see it, try clicking the resend button below</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={isSending || justSent}
                className="w-full"
                variant="outline"
              >
                {isSending ? "Sending..." : justSent ? "Email sent" : "Resend verification email"}
              </Button>
              <div className="text-center text-sm text-gray-500">
                Already verified?{" "}
                <Link href="/login" className="text-black font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
