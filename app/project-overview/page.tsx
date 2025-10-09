import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectOverview() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">TOTL Agency Project Overview</h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Use this page to navigate between different parts of the application during your
              presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Client Dashboard</CardTitle>
                <CardDescription>
                  View the client dashboard with gigs and applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/admin/dashboard">View Client Dashboard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Talent Dashboard</CardTitle>
                <CardDescription>
                  View the talent dashboard with portfolio and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/admin/talent-dashboard">View Talent Dashboard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browse Talent</CardTitle>
                <CardDescription>Browse available talent and view profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/talent">Browse Talent</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browse Gigs</CardTitle>
                <CardDescription>Browse available gigs and view details</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/gigs">Browse Gigs</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create Gig</CardTitle>
                <CardDescription>Create a new gig as a client</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/admin/gigs/create">Create Gig</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Homepage</CardTitle>
                <CardDescription>View the main landing page</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                  <Link href="/">View Homepage</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Talent Signup</CardTitle>
                <CardDescription>Apply as talent</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/talent/signup">Talent Signup</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Signup</CardTitle>
                <CardDescription>Register as a client</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/client/signup">Client Signup</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
