"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PATHS } from "@/lib/constants/routes";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { Button } from "@/components/ui/button";

type GateState =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "failed"; reason: "missing_token" | "invalid_token" };

/**
 * Supabase recovery links often redirect back with tokens in the URL hash (fragment):
 *   /update-password#access_token=...&refresh_token=...&type=recovery
 * Server components can't read the hash, so we must hydrate and exchange/store the session client-side.
 */
export function UpdatePasswordClientGate() {
  const router = useRouter();
  const supabase = useSupabase();
  const [state, setState] = useState<GateState>({ kind: "checking" });

  const hasHashTokens = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hash || "";
    return h.includes("access_token=") || h.includes("token_hash=");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // If we don't have a client yet, wait for mount.
      if (!supabase) return;

      // Nothing to do if there's no hash to process.
      if (!hasHashTokens) {
        setState({ kind: "failed", reason: "missing_token" });
        return;
      }

      try {
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (!access_token || !refresh_token) {
          setState({ kind: "failed", reason: "missing_token" });
          return;
        }

        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (cancelled) return;

        if (error || !data?.session) {
          setState({ kind: "failed", reason: "invalid_token" });
          return;
        }

        // Clean up URL (remove hash tokens) to avoid reprocessing on refresh.
        try {
          window.history.replaceState({}, "", PATHS.UPDATE_PASSWORD);
        } catch {
          // ignore
        }

        setState({ kind: "ready" });
      } catch {
        if (!cancelled) {
          setState({ kind: "failed", reason: "invalid_token" });
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [supabase, hasHashTokens, router]);

  if (state.kind === "checking") {
    return (
      <p className="text-gray-600">Preparing your password reset…</p>
    );
  }

  if (state.kind === "failed") {
    const msg =
      state.reason === "missing_token"
        ? "This password reset link is missing required credentials. Please request a new reset email."
        : "This password reset link is invalid or expired. Please request a new reset email.";

    return (
      <div className="space-y-4">
        <p className="text-gray-600">{msg}</p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.push(PATHS.LOGIN)}
        >
          Return to Login
        </Button>
      </div>
    );
  }

  return null;
}
