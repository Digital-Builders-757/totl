"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ManualVerificationButtonProps {
  userId: string;
  onVerified?: () => void;
}

export default function ManualVerificationButton({
  userId,
  onVerified,
}: ManualVerificationButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleVerification = async () => {
    setIsVerifying(true);

    try {
      // Update the profiles table to mark email as verified
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("id", userId);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      toast({
        title: "Email verified",
        description: "The user's email has been manually verified.",
      });

      onVerified?.();
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Button onClick={handleVerification} disabled={isVerifying}>
      {isVerifying ? "Verifying..." : "Manually Verify Email"}
    </Button>
  );
}
