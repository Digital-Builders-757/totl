"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";

export function SignOutButton() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      logger.error("Sign out error", error);
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isSigningOut}
      variant="outline"
      size="sm"
      className="panel-frosted min-w-[9rem] justify-center border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
