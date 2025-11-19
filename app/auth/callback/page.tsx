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
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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
        const user = data.session.user;
        
        // Check if profile exists - use maybeSingle() to prevent 406 errors
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,email_verified,display_name")
          .eq("id", user.id)
          .maybeSingle();

        // If profile doesn't exist, create it with name from user metadata
        // With maybeSingle(), no rows returns null data (not an error), so check !profile
        const isNotFoundError = profileError && typeof profileError === 'object' && 'code' in profileError && (profileError as { code: string }).code === "PGRST116";
        if (!profile || isNotFoundError) {
          // Extract name from user metadata
          const firstName = (user.user_metadata?.first_name as string) || "";
          const lastName = (user.user_metadata?.last_name as string) || "";
          const role = (user.user_metadata?.role as string) || "talent";

          // Create display name
          let displayName = "";
          if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
          } else if (firstName) {
            displayName = firstName;
          } else if (lastName) {
            displayName = lastName;
          } else {
            displayName = user.email?.split("@")[0] || "User";
          }

          // Create profile
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            role: role as "talent" | "client" | "admin",
            display_name: displayName,
            email_verified: user.email_confirmed_at !== null,
          });

          if (insertError) {
            console.error("Error creating profile:", insertError);
            return (
              <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-center">Profile Setup Error</CardTitle>
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

          // Create role-specific profile if talent
          if (role === "talent") {
            const { error: talentError } = await supabase.from("talent_profiles").insert({
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
            });

            if (talentError) {
              console.error("Error creating talent profile:", talentError);
              // Don't fail - profile was created
            }
          }

          // Re-fetch profile after creation - use maybeSingle() to prevent 406 errors
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          // Redirect based on role
          if (newProfile?.role === "talent") {
            redirect("/talent/dashboard");
          } else if (newProfile?.role === "client") {
            redirect("/client/dashboard");
          } else if (newProfile?.role === "admin") {
            redirect("/admin/dashboard");
          } else {
            redirect("/choose-role");
          }
        }

        // If profile exists but display_name is missing/empty, update it
        if (profile && (!profile.display_name || profile.display_name.trim() === "")) {
          const firstName = (user.user_metadata?.first_name as string) || "";
          const lastName = (user.user_metadata?.last_name as string) || "";

          let displayName = "";
          if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
          } else if (firstName) {
            displayName = firstName;
          } else if (lastName) {
            displayName = lastName;
          } else {
            displayName = user.email?.split("@")[0] || "User";
          }

          await supabase
            .from("profiles")
            .update({ display_name: displayName })
            .eq("id", user.id);
        }

        // Update email verification status if not already verified
        if (profile && !profile.email_verified) {
          await supabase
            .from("profiles")
            .update({ email_verified: true })
            .eq("id", user.id);
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
