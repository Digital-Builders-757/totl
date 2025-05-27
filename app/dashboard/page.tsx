export const dynamic = "force-dynamic"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TriangleIcon as ExclamationTriangleIcon } from "lucide-react"
import { DashboardClient } from "./client"

export default async function Dashboard() {
  // 1. Initialize the Supabase client using createServerComponentClient
  const supabase = createServerComponentClient({ cookies })

  try {
    // 2. Verify the user's authentication status
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Handle session error
    if (sessionError) {
      console.error("Session error:", sessionError.message)
      return (
        <div className="container mx-auto py-10 px-4">
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              There was an error verifying your session. Please try signing in again.
              <div className="mt-4">
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // 3. If the session is null, redirect to the login page
    if (!session) {
      redirect("/login?returnUrl=/dashboard")
    }

    // 4. Get user.id from the session
    const userId = session.user.id

    // 5. Query the profiles table for the user's profile
    // 7. Use .single() to ensure only one row is fetched
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, role, email_verified, created_at")
      .eq("id", userId)
      .single()

    // 8. Handle profile fetch error
    if (profileError) {
      console.error("Profile fetch error:", profileError.message)

      // Check if the error is because the profile doesn't exist
      if (profileError.code === "PGRST116") {
        // 9. Redirect to onboarding if profile not found
        redirect("/onboarding")
      }

      // Handle other errors
      return (
        <div className="container mx-auto py-10 px-4">
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your profile. Please try refreshing the page.
              <div className="mt-4">
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // 6. Render the user's profile information
    return (
      <DashboardClient
        userId={profile.id}
        userRole={profile.role}
      />
    )
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error:", error)
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Unexpected Error</AlertTitle>
          <AlertDescription>
            An unexpected error occurred. Please try refreshing the page.
            <div className="mt-4">
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
