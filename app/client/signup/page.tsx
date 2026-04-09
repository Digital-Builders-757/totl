"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      router.replace("/client/dashboard");
    }
  }, [authLoading, user, userRole, profile?.role, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user && (userRole === "client" || profile?.role === "client")) return;

    // Redirect to application page after brief delay to show message
    const timer = setTimeout(() => {
      const applicationUrl = returnUrl
        ? `/client/apply?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/client/apply";
      router.push(applicationUrl);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, returnUrl, authLoading, user, userRole, profile?.role]);

  const handleGoToApplication = () => {
    if (user && (userRole === "client" || profile?.role === "client")) {
      router.push("/client/dashboard");
      return;
    }
    const applicationUrl = returnUrl
      ? `/client/apply?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/client/apply";
    router.push(applicationUrl);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--oklch-bg)] pt-20 text-foreground sm:pt-24">
      <div className="container mx-auto px-4 py-4 sm:py-12">
        <Link
          href={returnUrl ? `/choose-role?returnUrl=${returnUrl}` : "/"}
          className="mb-4 inline-flex items-center text-muted-foreground hover:text-foreground sm:mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15">
                <Info className="h-8 w-8 text-amber-400" />
              </div>
              <CardTitle className="text-center">Career Builder Signup Requires Approval</CardTitle>
              <CardDescription className="text-center">
                To become a Career Builder, you must apply through our approval process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Career Builder access requires approval.</strong> You must first create a Talent account, then apply to become a Career Builder.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Here&apos;s how it works:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
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

              <p className="text-center text-sm text-muted-foreground">
                {user && (userRole === "client" || profile?.role === "client")
                  ? "Redirecting you to your Career Builder dashboard..."
                  : "Redirecting you to the Career Builder application page..."}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={handleGoToApplication} className="w-full">
                {user && (userRole === "client" || profile?.role === "client")
                  ? "Go to dashboard now"
                  : "Go to Application Page Now"}
              </Button>
              {!user && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/choose-role">Create Talent Account First</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
