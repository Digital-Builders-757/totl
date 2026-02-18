import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "./update-password-form";
import { UpdatePasswordClientGate } from "./update-password-client-gate";
import { Button } from "@/components/ui/button";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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
          <div className="min-h-screen bg-black pt-24 relative overflow-hidden grain-texture">
            <div className="container mx-auto px-4 py-12">
              <Link
                href="/login"
                className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>

              <div className="max-w-md mx-auto panel-frosted overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Image
                      src="/images/totl-logo-transparent.png"
                      alt="TOTL Agency"
                      width={120}
                      height={50}
                      className="mx-auto mb-6"
                    />
                    <h1 className="text-2xl font-bold mb-2 text-white">Invalid Reset Link</h1>
                    <p className="text-gray-300">
                      This password reset link has expired or is invalid. Please request a new one.
                    </p>
                  </div>
                  <div className="text-center">
                    <Button asChild variant="outline" className="w-full border-gray-700 text-white hover:bg-white/10">
                      <Link href="/login">Return to Login</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Token is valid - show password reset form
      return (
        <div className="min-h-screen bg-black pt-24 relative overflow-hidden grain-texture">
          <div className="container mx-auto px-4 py-12">
            <Link
              href="/login"
              className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>

            <div className="max-w-md mx-auto panel-frosted overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <Image
                    src="/images/totl-logo-transparent.png"
                    alt="TOTL Agency"
                    width={120}
                    height={50}
                    className="mx-auto mb-6"
                  />
                  <h1 className="text-2xl font-bold mb-2 text-white">Set New Password</h1>
                  <p className="text-gray-300">Create a new password for your account.</p>
                </div>

                <UpdatePasswordForm />
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Token verification error:", error);
      redirect("/login?error=invalid_token");
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
        redirect("/login?error=invalid_token");
      }

      // User is authenticated - show password reset form
      return (
        <div className="min-h-screen bg-black pt-24 relative overflow-hidden grain-texture">
          <div className="container mx-auto px-4 py-12">
            <Link
              href="/login"
              className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>

            <div className="max-w-md mx-auto panel-frosted overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <Image
                    src="/images/totl-logo-transparent.png"
                    alt="TOTL Agency"
                    width={120}
                    height={50}
                    className="mx-auto mb-6"
                  />
                  <h1 className="text-2xl font-bold mb-2 text-white">Update Password</h1>
                  <p className="text-gray-300">Create a new password for your account.</p>
                </div>

                <UpdatePasswordForm />
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Access token verification error:", error);
      redirect("/login?error=invalid_token");
    }
  }

  // No valid query token provided.
  // Supabase recovery links may use URL hash tokens, which server components cannot access.
  // Render a client gate to exchange/store session from the hash and only show an error if it fails.
  return (
    <div className="min-h-screen bg-black pt-24 relative overflow-hidden grain-texture">
      <div className="container mx-auto px-4 py-12">
        <Link
          href="/login"
          className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>

        <div className="max-w-md mx-auto panel-frosted overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <Image
                src="/images/totl-logo-transparent.png"
                alt="TOTL Agency"
                width={120}
                height={50}
                className="mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold mb-2 text-white">Update Password</h1>
              <p className="text-gray-300">We&apos;re preparing your reset link…</p>
            </div>

            <UpdatePasswordClientGate />
          </div>
        </div>
      </div>
    </div>
  );
}

