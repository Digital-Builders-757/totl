import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordClientGate } from "./update-password-client-gate";
import { UpdatePasswordForm } from "./update-password-form";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants/routes";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; access_token?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const params = await searchParams;
  const tokenHash = params.token_hash;
  const type = params.type;
  const accessToken = params.access_token;

  // Handle password reset token verification
  if (tokenHash && type === "recovery") {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error) {
        return (
          <AuthEntryShell backHref={PATHS.LOGIN} backLabel="Back to login">
            <div className="mb-8 text-center">
              <Image
                src="/images/totl-logo-transparent.png"
                alt="TOTL Agency"
                width={120}
                height={50}
                className="mx-auto mb-6"
              />
              <h1 className="mb-2 text-2xl font-bold text-white">Invalid Reset Link</h1>
              <p className="text-gray-300">
                This password reset link has expired or is invalid. Please request a new one.
              </p>
            </div>
            <div className="text-center">
              <Button asChild variant="outline" className="w-full border-border/50 text-white hover:bg-white/10">
                <Link href={PATHS.LOGIN}>Return to Login</Link>
              </Button>
            </div>
          </AuthEntryShell>
        );
      }

      // Token is valid - show password reset form
      return (
        <AuthEntryShell backHref={PATHS.LOGIN} backLabel="Back to login">
          <div className="mb-8 text-center">
            <Image
              src="/images/totl-logo-transparent.png"
              alt="TOTL Agency"
              width={120}
              height={50}
              className="mx-auto mb-6"
            />
            <h1 className="mb-2 text-2xl font-bold text-white">Set New Password</h1>
            <p className="text-gray-300">Create a new password for your account.</p>
          </div>

          <UpdatePasswordForm />
        </AuthEntryShell>
      );
    } catch (error) {
      logger.error("Token verification error:", error);
      redirect(`${PATHS.LOGIN}?error=invalid_token`);
    }
  }

  // Handle access token (for OAuth flows)
  if (accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        redirect(`${PATHS.LOGIN}?error=invalid_token`);
      }

      // User is authenticated - show password reset form
      return (
        <AuthEntryShell backHref={PATHS.LOGIN} backLabel="Back to login">
          <div className="mb-8 text-center">
            <Image
              src="/images/totl-logo-transparent.png"
              alt="TOTL Agency"
              width={120}
              height={50}
              className="mx-auto mb-6"
            />
            <h1 className="mb-2 text-2xl font-bold text-white">Update Password</h1>
            <p className="text-gray-300">Create a new password for your account.</p>
          </div>

          <UpdatePasswordForm />
        </AuthEntryShell>
      );
    } catch (error) {
      logger.error("Access token verification error:", error);
      redirect(`${PATHS.LOGIN}?error=invalid_token`);
    }
  }

  // No valid query token provided.
  // Supabase recovery links may use URL hash tokens, which server components cannot access.
  // Render a client gate to exchange/store session from the hash and only show an error if it fails.
  return (
    <AuthEntryShell backHref={PATHS.LOGIN} backLabel="Back to login">
      <div className="mb-8 text-center">
        <Image
          src="/images/totl-logo-transparent.png"
          alt="TOTL Agency"
          width={120}
          height={50}
          className="mx-auto mb-6"
        />
        <h1 className="mb-2 text-2xl font-bold text-white">Update Password</h1>
        <p className="text-gray-300">We&apos;re preparing your reset link…</p>
      </div>

      <UpdatePasswordClientGate />
    </AuthEntryShell>
  );
}
