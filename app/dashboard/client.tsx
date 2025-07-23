"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
    } finally {
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
                Go to Client Dashboard
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
