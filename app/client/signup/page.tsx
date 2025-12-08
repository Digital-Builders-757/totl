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
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to application page after brief delay to show message
    const timer = setTimeout(() => {
      const applicationUrl = returnUrl
        ? `/client/apply?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/client/apply";
      router.push(applicationUrl);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, returnUrl]);

  const handleGoToApplication = () => {
    const applicationUrl = returnUrl
      ? `/client/apply?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/client/apply";
    router.push(applicationUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 flex items-center justify-center">
      <div className="container mx-auto px-4 py-4 sm:py-12">
        <Link
          href={returnUrl ? `/choose-role?returnUrl=${returnUrl}` : "/"}
          className="inline-flex items-center text-gray-600 hover:text-black mb-4 sm:mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Info className="h-8 w-8 text-amber-600" />
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

              <div className="space-y-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-800">Here&apos;s how it works:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Create a Talent account (if you haven&apos;t already)</li>
                  <li>Apply to become a Career Builder</li>
                  <li>Our team reviews your application</li>
                  <li>Once approved, you&apos;ll gain access to Career Builder features</li>
                </ol>
              </div>

              {user ? (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    You&apos;re already logged in! You can apply to become a Career Builder now.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Don&apos;t have an account yet? Create a Talent account first, then apply to become a Career Builder.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-center text-gray-500 text-sm">
                Redirecting you to the Career Builder application page...
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={handleGoToApplication} className="w-full">
                Go to Application Page Now
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
