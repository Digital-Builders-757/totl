"use client"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TriangleIcon as ExclamationTriangleIcon } from "lucide-react"

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
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-lg">
                      {profile.display_name ||
                        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                        "Not set"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{session.user.email}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${profile.email_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {profile.email_verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    <p className="mt-1 capitalize">{profile.role || "Not set"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1">{new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
                <CardDescription>Your activity and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {profile.role === "talent" && (
                    <div>
                      <h3 className="font-medium mb-2">Talent Dashboard</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button asChild variant="outline">
                          <Link href="/talent/profile">View Talent Profile</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/gigs">Browse Available Gigs</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {profile.role === "client" && (
                    <div>
                      <h3 className="font-medium mb-2">Client Dashboard</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button asChild variant="outline">
                          <Link href="/client/gigs">Manage Your Gigs</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/post-gig">Post New Gig</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {!profile.role && (
                    <div>
                      <h3 className="font-medium mb-2">Complete Your Profile</h3>
                      <p className="text-gray-500 mb-4">Please select a role to access all features.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button asChild>
                          <Link href="/choose-role">Choose Role</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
