import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Calendar, MapPin, Phone, Mail, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function TalentDashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name, email_verified")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  // Verify this is a talent user
  if (profile.role !== "talent") {
    redirect("/dashboard");
  }

  // Get the talent profile
  const { data: talentProfile, error: talentError } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (talentError) {
    console.error("Error fetching talent profile:", talentError);
  }

  // Check if profile needs completion
  const needsProfileCompletion = !talentProfile?.first_name || !talentProfile?.last_name;

  // Get recent applications
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("id, created_at, status")
    .eq("talent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Talent Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {profile.display_name || "Talent"}!
          </p>
        </div>

        {/* Profile Completion Alert */}
        {needsProfileCompletion && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <span>
                  Please complete your profile to get started. Add your name and contact information
                  to make your profile visible to clients.
                </span>
                <Button asChild size="sm" className="ml-4">
                  <Link href="/talent/profile">Complete Profile</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your talent profile and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {talentProfile ? (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {talentProfile.first_name && talentProfile.last_name
                          ? `${talentProfile.first_name} ${talentProfile.last_name}`
                          : "Name not set"}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    {talentProfile.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{talentProfile.phone}</span>
                      </div>
                    )}

                    {talentProfile.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{talentProfile.location}</span>
                      </div>
                    )}

                    {talentProfile.portfolio_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a
                          href={talentProfile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Portfolio
                        </a>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/talent/profile">Edit Profile</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Profile not found</p>
                    <Button asChild>
                      <Link href="/talent/profile">Create Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Applications</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications?.length || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Profile Status</p>
                      <Badge variant={needsProfileCompletion ? "destructive" : "default"}>
                        {needsProfileCompletion ? "Incomplete" : "Complete"}
                      </Badge>
                    </div>
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email Status</p>
                      <Badge variant={profile.email_verified ? "default" : "destructive"}>
                        {profile.email_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Your latest gig applications and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Application #{application.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            application.status === "accepted"
                              ? "default"
                              : application.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No applications yet</p>
                    <Button asChild>
                      <Link href="/gigs">Browse Available Gigs</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and next steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <Link href="/gigs">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Browse Gigs</span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">
                        Find and apply for available casting opportunities
                      </p>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <Link href="/talent/profile">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5" />
                        <span className="font-medium">Update Profile</span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">
                        Keep your profile information current and complete
                      </p>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 