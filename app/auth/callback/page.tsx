"use client";

import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBootStateRedirect } from "@/lib/actions/boot-actions";
import { PATHS } from "@/lib/constants/routes";
import { useSupabase } from "@/lib/hooks/use-supabase";
import { logger } from "@/lib/utils/logger";
import { safeReturnUrl } from "@/lib/utils/return-url";

type GateState =
  | { kind: "checking"; message: string }
  | { kind: "failed"; message: string };

async function waitForServerSessionReady(maxAttempts = 6): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch("/api/auth/session-ready", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }
    } catch {
      // Ignore probe failures and retry with backoff.
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  return false;
}

const isSupportedOtpType = (
  value: string | null | undefined
): value is "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" => {
  return (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  );
};

function AuthCallbackGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [state, setState] = useState<GateState>({
    kind: "checking",
    message: "Signing you in...",
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!supabase) return;

      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (error) {
        setState({
          kind: "failed",
          message: errorDescription || "An error occurred during the authentication process.",
        });
        return;
      }

      const returnUrlRaw = searchParams.get("returnUrl");
      const safeReturn = safeReturnUrl(returnUrlRaw) ?? PATHS.TALENT_DASHBOARD;

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const otpType = searchParams.get("type");

        let didEstablishSession = false;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError || !data?.session) {
            throw new Error(exchangeError?.message || "Could not exchange auth code.");
          }
          didEstablishSession = true;
        } else if (tokenHash && isSupportedOtpType(otpType)) {
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (otpError || !data?.session) {
            throw new Error(otpError?.message || "Could not verify auth token.");
          }
          didEstablishSession = true;
        } else {
          const hashParams = new URLSearchParams(
            window.location.hash.startsWith("#")
              ? window.location.hash.slice(1)
              : window.location.hash
          );
          const hashAccessToken = hashParams.get("access_token");
          const hashRefreshToken = hashParams.get("refresh_token");
          const hashTokenHash = hashParams.get("token_hash");
          const hashType = hashParams.get("type");

          if (hashAccessToken && hashRefreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });
            if (setSessionError || !data?.session) {
              throw new Error(setSessionError?.message || "Could not establish session from invite link.");
            }
            didEstablishSession = true;
          } else if (hashTokenHash && isSupportedOtpType(hashType)) {
            const { data, error: hashOtpError } = await supabase.auth.verifyOtp({
              token_hash: hashTokenHash,
              type: hashType,
            });
            if (hashOtpError || !data?.session) {
              throw new Error(hashOtpError?.message || "Could not verify invite token from link.");
            }
            didEstablishSession = true;
          }
        }

        if (!didEstablishSession) {
          throw new Error("The invite link did not include a valid authentication token.");
        }

        // Remove invite tokens from the URL so refreshes do not re-run token exchange.
        window.history.replaceState({}, "", `${PATHS.AUTH_CALLBACK}?returnUrl=${encodeURIComponent(safeReturn)}`);

        // Ensure server-side auth sees the cookie-backed session before leaving callback.
        const serverSessionReady = await waitForServerSessionReady();
        if (!serverSessionReady) {
          logger.warn("[auth/callback] server session not ready after callback exchange", {
            hasCode: Boolean(code),
            hasTokenHash: Boolean(tokenHash),
            hasOtpType: Boolean(otpType),
          });
        }

        // Cookie sync to server can be briefly delayed after setSession/verifyOtp.
        let resolvedTarget: string | null = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const result = await getBootStateRedirect({ postAuth: true, returnUrlRaw });
          if (result.redirectTo) {
            resolvedTarget = result.redirectTo;
            break;
          }
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
          }
        }

        if (cancelled) return;
        if (!resolvedTarget && !serverSessionReady) {
          throw new Error(
            "We couldn't finalize your sign-in session yet. Please reopen the invite link and try again."
          );
        }
        const target = resolvedTarget ?? safeReturn;
        router.replace(target);
      } catch (callbackError) {
        logger.error("[auth/callback] Failed to establish session from callback", callbackError);
        if (!cancelled) {
          setState({
            kind: "failed",
            message:
              callbackError instanceof Error
                ? callbackError.message
                : "The verification link may have expired or is invalid.",
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  if (state.kind === "checking") {
    return <p className="text-gray-600 text-center mb-4">{state.message}</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-xl font-medium text-red-800 mb-2">Authentication Failed</h3>
      <p className="text-gray-600 text-center mb-4">{state.message}</p>
      <Button asChild>
        <a href={PATHS.LOGIN}>Return to Login</a>
      </Button>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Finalizing Sign In</CardTitle>
          <CardDescription className="text-center">
            We&apos;re verifying your invite and preparing your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AuthCallbackGate />
        </CardContent>
        <CardFooter className="flex justify-center" />
      </Card>
    </div>
  );
}
