"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

type UserRole = "talent" | "client" | "admin" | null

export function DashboardClient({ userId, userRole }: { userId: string; userRole: UserRole }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/")
    } catch (err) {
      console.error("Error signing out:", err)
      setError("Failed to sign out. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    router.refresh()
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>Manage your account and refresh your data</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex flex-col space-y-2">
          <Button onClick={refreshData} variant="outline">
            Refresh Data
          </Button>
          {userRole === "talent" && (
            <Button onClick={() => router.push("/talent/edit-profile")} variant="outline">
              Edit Talent Profile
            </Button>
          )}
          {userRole === "client" && (
            <Button onClick={() => router.push("/client/post-gig")} variant="outline">
              Post New Gig
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSignOut} variant="destructive" disabled={isLoading}>
          {isLoading ? "Signing Out..." : "Sign Out"}
        </Button>
      </CardFooter>
    </Card>
  )
}
