"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UserRole = "talent" | "client" | "admin" | null;

export function DashboardClient({ userRole }: { userRole: UserRole }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    setError(null);

    try {
      // Call signOut from auth provider and wait for it to complete
      await signOut();
      
      // Force immediate hard refresh to ensure clean state
      // This ensures cookies are cleared and page refreshes
      window.location.href = '/login';
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    router.refresh();
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>Manage your account and refresh your data</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col space-y-2">
          <Button onClick={refreshData} variant="outline">
            Refresh Data
          </Button>
          {userRole === "talent" && (
            <Button onClick={() => router.push("/talent/dashboard")} variant="outline">
              Go to Talent Dashboard
            </Button>
          )}
          {userRole === "client" && (
            <>
              <Button onClick={() => router.push("/client/dashboard")} variant="outline">
                Go to Career Builder Dashboard
              </Button>
              <Button onClick={() => router.push("/post-gig")} variant="outline">
                Post New Gig
              </Button>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSignOut} variant="destructive" disabled={isLoading}>
          {isLoading ? "Signing Out..." : "Sign Out"}
        </Button>
      </CardFooter>
    </Card>
  );
}
