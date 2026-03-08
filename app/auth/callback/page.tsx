import { XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBootState } from "@/lib/actions/boot-actions";
import { PATHS } from "@/lib/constants/routes";
import { syncEmailVerifiedForUser } from "@/lib/server/sync-email-verified";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
    returnUrl?: string;
  }>;
}) {
  const supabase = await createSupabaseServer();
  const params = await searchParams;
  const code = params.code;
  const tokenHash = params.token_hash;
  const otpType = params.type;
  const error = params.error;
  const errorDescription = params.error_description;
  const returnUrl = params.returnUrl;

  // Handle OAuth errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Error</CardTitle>
            <CardDescription className="text-center">
              There was an error during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-red-800 mb-2">Authentication Failed</h3>
              <p className="text-gray-600 text-center mb-4">
                {errorDescription || "An error occurred during the authentication process."}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <a href={PATHS.LOGIN}>Return to Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const redirectAfterAuth = async (user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>) => {
    // Keep profiles.email_verified in sync with Supabase auth.
    const syncResult = await syncEmailVerifiedForUser({
      supabase,
      user,
      currentEmailVerified: null,
    });
    if (!syncResult.success) {
      console.error("[auth/callback] email_verified sync failed:", syncResult.error);
    }

    // Single routing truth: compute BootState and redirect to server-computed nextPath.
    const boot = await getBootState({ postAuth: true, returnUrlRaw: returnUrl ?? null });
    const baseNext = boot?.nextPath ?? PATHS.TALENT_DASHBOARD;
    const nextWithVerified = baseNext.includes("?")
      ? `${baseNext}&verified=true`
      : `${baseNext}?verified=true`;

    redirect(nextWithVerified);
  };

  const isSupportedOtpType = (
    value: string | undefined
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

  // Handle email verification, invite, or OAuth callback
  if (code || (tokenHash && otpType && isSupportedOtpType(otpType))) {
    try {
      let callbackUser: NonNullable<
        Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]
      > | null = null;

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("Verification error:", exchangeError);
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">Verification Failed</CardTitle>
                  <CardDescription className="text-center">
                    We couldn&apos;t verify your email
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-red-800 mb-2">Verification Failed</h3>
                    <p className="text-gray-600 text-center mb-4">
                      {exchangeError.message ||
                        "The verification link may have expired or is invalid."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild>
                    <a href={PATHS.LOGIN}>Return to Login</a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          );
        }
        callbackUser = data.session?.user ?? null;
      } else if (tokenHash && otpType && isSupportedOtpType(otpType)) {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });
        if (otpError) {
          console.error("OTP verification error:", otpError);
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">Verification Failed</CardTitle>
                  <CardDescription className="text-center">
                    We couldn&apos;t verify your link
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-red-800 mb-2">Verification Failed</h3>
                    <p className="text-gray-600 text-center mb-4">
                      {otpError.message ||
                        "The verification link may have expired or is invalid."}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild>
                    <a href={PATHS.LOGIN}>Return to Login</a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          );
        }
        callbackUser = data.user ?? null;
      }

      // Success path for either callback style.
      if (callbackUser) {
        await redirectAfterAuth(callbackUser);
      }

      // Fallback redirect
      redirect("/dashboard");
    } catch (error) {
      // CRITICAL: Next.js redirect() throws a special error to interrupt execution
      // We must re-throw redirect errors so they work correctly
      // Check if this is a redirect error by checking for NEXT_REDIRECT digest
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        // Re-throw redirect errors so Next.js can handle them properly
        throw error;
      }
      
      // Only log and show error UI for actual errors, not redirects
      console.error("Unexpected error:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Unexpected Error</CardTitle>
              <CardDescription className="text-center">
                Something went wrong during verification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-medium text-red-800 mb-2">Unexpected Error</h3>
                <p className="text-gray-600 text-center mb-4">
                  An unexpected error occurred. Please try again.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <a href={PATHS.LOGIN}>Return to Login</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  // No code provided - redirect to home
  redirect("/");
}
