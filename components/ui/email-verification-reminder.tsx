"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function EmailVerificationReminder() {
  const { user, isEmailVerified, sendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const { toast } = useToast();

  if (!user || isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);

    try {
      const { error } = await sendVerificationEmail();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setJustSent(true);
        toast({
          title: "Email sent",
          description: "Verification email has been sent to your inbox",
        });

        // Reset the "just sent" state after 30 seconds
        setTimeout(() => {
          setJustSent(false);
        }, 30000);
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert
      className={
        justSent ? "bg-green-50 border-green-200 mb-6" : "bg-amber-50 border-amber-200 mb-6"
      }
    >
      {justSent ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Email sent!</AlertTitle>
          <AlertDescription className="text-green-700">
            We&apos;ve sent a verification email to {user.email}. Please check your inbox and click
            the verification link.
          </AlertDescription>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Please verify your email</AlertTitle>
          <AlertDescription className="text-amber-700 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>You need to verify your email address before you can apply for gigs.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isSending}
              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900 w-fit"
            >
              {isSending ? "Sending..." : "Resend verification email"}
            </Button>
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
