"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";

/**
 * Career Builder signup requires approval through the application process.
 * This page redirects users to the application page instead of allowing direct signup.
 */
export default function ClientSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? null;
  const { user, profile, userRole, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    if (userRole === "client" || profile?.role === "client") {
      router.replace(PATHS.CLIENT_DASHBOARD);
    }
  }, [authLoading, user, userRole, profile?.role, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user && (userRole === "client" || profile?.role === "client")) return;

    // Redirect to application page after brief delay to show message
    const timer = setTimeout(() => {
      const applicationUrl = returnUrl
        ? `${PATHS.CLIENT_APPLY}?returnUrl=${encodeURIComponent(returnUrl)}`
        : PATHS.CLIENT_APPLY;
      router.push(applicationUrl);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, returnUrl, authLoading, user, userRole, profile?.role]);

  const handleGoToApplication = () => {
    if (user && (userRole === "client" || profile?.role === "client")) {
      router.push(PATHS.CLIENT_DASHBOARD);
      return;
    }
    const applicationUrl = returnUrl
      ? `${PATHS.CLIENT_APPLY}?returnUrl=${encodeURIComponent(returnUrl)}`
      : PATHS.CLIENT_APPLY;
    router.push(applicationUrl);
  };

  const backHref =
    returnUrl != null && returnUrl !== ""
      ? `${PATHS.CHOOSE_ROLE}?returnUrl=${encodeURIComponent(returnUrl)}`
      : PATHS.HOME;

  return (
    <AuthEntryShell backHref={backHref} backLabel="Back">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15">
          <Info className="h-8 w-8 text-amber-400" />
        </div>
        <CardTitle className="text-center text-white">Career Builder Signup Requires Approval</CardTitle>
        <CardDescription className="text-center text-[var(--oklch-text-secondary)]">
          To become a Career Builder, you must apply through our approval process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Career Builder access requires approval.</strong> You must first create a Talent
            account, then apply to become a Career Builder.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 text-sm text-[var(--oklch-text-secondary)]">
          <p className="font-semibold text-white">Here&apos;s how it works:</p>
          <ol className="ml-2 list-inside list-decimal space-y-2">
            <li>Create a Talent account (if you haven&apos;t already)</li>
            <li>Apply to become a Career Builder</li>
            <li>Our team reviews your application</li>
            <li>Once approved, you&apos;ll gain access to Career Builder features</li>
          </ol>
        </div>
        {user && (userRole === "client" || profile?.role === "client") ? (
          <Alert className="border-emerald-500/40 bg-emerald-500/10">
            <AlertDescription className="text-emerald-100">
              You already have Career Builder access. We&apos;re taking you to your dashboard.
            </AlertDescription>
          </Alert>
        ) : user ? (
          <Alert className="border-emerald-500/40 bg-emerald-500/10">
            <AlertDescription className="text-emerald-100">
              You&apos;re already logged in! You can apply to become a Career Builder now.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-sky-500/40 bg-sky-500/10">
            <AlertDescription className="text-sky-100">
              Don&apos;t have an account yet? Create a Talent account first, then apply to become a Career Builder.
            </AlertDescription>
          </Alert>
        )}

        <p className="text-center text-sm text-[var(--oklch-text-tertiary)]">
          {user && (userRole === "client" || profile?.role === "client")
            ? "Redirecting you to your Career Builder dashboard..."
            : "Redirecting you to the Career Builder application page..."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={handleGoToApplication} className="w-full button-glow">
          {user && (userRole === "client" || profile?.role === "client")
            ? "Go to dashboard now"
            : "Go to Application Page Now"}
        </Button>
        {!user && (
          <Button variant="outline" asChild className="w-full border-border/50 text-white hover:bg-white/10">
            <Link href={PATHS.CHOOSE_ROLE}>Create Talent Account First</Link>
          </Button>
        )}
      </CardFooter>
    </AuthEntryShell>
  );
}
