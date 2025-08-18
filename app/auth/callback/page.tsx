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
import { createSupabaseServer } from "@/lib/supabase-server";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const params = await searchParams;
  const code = params.code;
  const error = params.error;
  const errorDescription = params.error_description;

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
              <a href="/login">Return to Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Handle email verification or OAuth callback
  if (code) {
    try {
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
                  <a href="/login">Return to Login</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      }

      // Success! Check if profile exists and update email verification status
      if (data.session?.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,email_verified")
          .eq("id", data.session.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist - this shouldn't happen with our trigger, but handle it
          console.error("Profile not found for user:", data.session.user.id);
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">Profile Not Found</CardTitle>
                  <CardDescription className="text-center">
                    Your account was created but profile setup failed
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-red-800 mb-2">Setup Error</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Please contact support to complete your account setup.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button asChild>
                    <a href="/login">Return to Login</a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          );
        }

        // Update email verification status if not already verified
        if (profile && !profile.email_verified) {
          await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", data.session.user.id);
        }

        // Redirect based on role
        if (profile?.role === "talent") {
          redirect("/talent/dashboard");
        } else if (profile?.role === "client") {
          redirect("/client/dashboard");
        } else if (profile?.role === "admin") {
          redirect("/admin/dashboard");
        } else {
          // No role assigned, go to role selection
          redirect("/choose-role");
        }
      }

      // Fallback redirect
      redirect("/dashboard");
    } catch (error) {
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
                <a href="/login">Return to Login</a>
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
