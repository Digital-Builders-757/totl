"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resetSupabaseBrowserClient } from "@/lib/supabase/supabase-browser";

/**
 * Recovery UI shown when auth bootstrap exceeds timeout threshold
 * 
 * Provides "Clear Session" button that:
 * 1. Attempts signOut (best effort)
 * 2. Wipes Supabase storage keys
 * 3. Hard reloads to login
 */
export function AuthTimeoutRecovery() {

  const handleClearSession = async () => {
    try {
      // Step 1: Reset browser client singleton
      resetSupabaseBrowserClient();

      // Step 2: Attempt signOut (best effort - may fail if client stuck)
      try {
        const { createSupabaseBrowser } = await import("@/lib/supabase/supabase-browser");
        const supabase = createSupabaseBrowser();
        if (supabase) {
          await supabase.auth.signOut({ scope: "global" });
        }
      } catch (err) {
        // SignOut may fail if client is stuck - that's okay, we'll wipe storage
        console.warn("[AuthTimeoutRecovery] SignOut failed (expected if stuck):", err);
      }

      // Step 3: Wipe Supabase storage keys from localStorage
      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        
        // Find all Supabase-related keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("sb-") || key.includes("supabase"))) {
            keysToRemove.push(key);
          }
        }

        // Remove all Supabase keys
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (err) {
            console.warn(`[AuthTimeoutRecovery] Failed to remove ${key}:`, err);
          }
        });

        // Also clear sessionStorage (Supabase may use it)
        try {
          sessionStorage.clear();
        } catch (err) {
          console.warn("[AuthTimeoutRecovery] Failed to clear sessionStorage:", err);
        }

        console.log(`[AuthTimeoutRecovery] Cleared ${keysToRemove.length} storage keys`);
      }

      // Step 4: Hard reload to login (ensures clean state)
      if (typeof window !== "undefined") {
        window.location.replace("/login?cleared=1");
      }
    } catch (err) {
      console.error("[AuthTimeoutRecovery] Error clearing session:", err);
      // Fallback: just reload
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  return (
    <Alert variant="destructive" className="m-4 border-yellow-500 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Session Failed to Load</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Your session is taking longer than expected to load. This usually happens when
          there are stale authentication tokens in your browser.
        </p>
        <p className="text-sm text-gray-400">
          <strong>Incognito mode works?</strong> This confirms it&apos;s a browser storage issue.
        </p>
        <Button
          onClick={handleClearSession}
          variant="outline"
          className="w-full sm:w-auto border-yellow-500 text-yellow-300 hover:bg-yellow-500/20"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Session & Reload
        </Button>
      </AlertDescription>
    </Alert>
  );
}
