"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"
import { useAuth } from "@/components/auth-provider"
import TalentPersonalInfoForm from "@/components/talent-personal-info-form"
import TalentProfessionalInfoForm from "@/components/talent-professional-info-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function TalentProfilePage() {
  const [activeTab, setActiveTab] = useState("personal")
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase, user } = useAuth()

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase.from("talent_profiles").select("*").eq("user_id", user.id).single()

        if (error) throw error

        setProfileData(data)
      } catch (err: any) {
        console.error("Error fetching profile data:", err)
        setError(err.message || "Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProfileData()
    }
  }, [user, supabase])

  const handleProfileUpdate = () => {
    // Refresh profile data after update
    if (user) {
      setIsLoading(true)
      supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing profile data:", error)
          } else {
            setProfileData(data)
          }
          setIsLoading(false)
        })
    }
  }

  const isProfileComplete = () => {
    if (!profileData) return false

    const requiredPersonalFields = ["phone", "age", "location"]
    const requiredProfessionalFields = ["experience"]

    const hasRequiredPersonal = requiredPersonalFields.every((field) => !!profileData[field])
    const hasRequiredProfessional = requiredProfessionalFields.every((field) => !!profileData[field])

    return hasRequiredPersonal && hasRequiredProfessional
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>

        {!isProfileComplete() && !isLoading && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your profile is incomplete. Please fill in all required fields to increase your chances of being
              discovered by clients.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Complete your profile to showcase your talents and increase your chances of being selected for gigs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="professional">Professional Information</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <TabsContent value="personal">
                    <TalentPersonalInfoForm initialData={profileData} onSaved={handleProfileUpdate} />
                  </TabsContent>
                  <TabsContent value="professional">
                    <TalentProfessionalInfoForm initialData={profileData} onSaved={handleProfileUpdate} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
