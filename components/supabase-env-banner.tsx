"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Banner component that shows when Supabase env vars are missing in development
 * 
 * Makes dev fallback behavior explicit and loud (not silent)
 */
export function SupabaseEnvBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only check in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasUrl || !hasAnonKey) {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <Alert variant="destructive" className="m-4 border-yellow-500 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Supabase Not Configured (Development)</AlertTitle>
      <AlertDescription>
        Missing Supabase environment variables in `.env.local`:
        <ul className="mt-2 list-disc list-inside space-y-1">
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <li>
              <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
            </li>
          )}
          {!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
            <li>
              <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
            </li>
          )}
        </ul>
        <p className="mt-2 text-sm">
          Some features may not work. Add these to your `.env.local` file to enable full functionality.
        </p>
      </AlertDescription>
    </Alert>
  );
}
