import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { MapPin, Calendar, DollarSign, Clock, User, Building, ArrowLeft, Send } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import type { Database } from "@/types/supabase";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface GigDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function GigDetailsPage({ params }: GigDetailsPageProps) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Fetch gig by ID with client details
  const { data: gig, error } = await supabase
    .from("gigs")
    .select(
      `
      *,
      client_profiles (
        company_name,
        contact_name,
        email,
        phone
      )
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !gig) {
    console.error("Gig not found:", error);
    notFound();
  }

  // Check if user has already applied
  let hasApplied = false;
  if (session?.user) {
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("gig_id", id)
      .eq("talent_id", session.user.id)
      .single();

    hasApplied = !!existingApplication;
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "e-commerce": "bg-blue-100 text-blue-800",
      commercial: "bg-green-100 text-green-800",
      editorial: "bg-purple-100 text-purple-800",
      runway: "bg-pink-100 text-pink-800",
      sportswear: "bg-orange-100 text-orange-800",
      beauty: "bg-yellow-100 text-yellow-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/gigs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to All Gigs
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gig Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold">{gig.title}</CardTitle>
                  <CardDescription className="text-lg mt-2">{gig.description}</CardDescription>
                </div>
                <Badge className={getCategoryColor(gig.category || "general")}>
                  {gig.category || "General"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Gig Image */}
          {gig.image_url && (
            <Card>
              <CardContent className="p-0">
                <div className="h-64 md:h-96 relative">
                  <SafeImage
                    src={gig.image_url}
                    alt={gig.title}
                    fill
                    className="object-cover rounded-t-lg"
                    placeholderQuery={gig.category?.toLowerCase() || "general"}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gig Details */}
          <Card>
            <CardHeader>
              <CardTitle>Gig Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{gig.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Compensation</p>
                    <p className="text-gray-600">${gig.compensation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">
                      {gig.date ? new Date(gig.date).toLocaleDateString() : "TBD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Posted</p>
                    <p className="text-gray-600">{new Date(gig.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          {gig.client_profiles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Company</p>
                    <p className="text-gray-600">{gig.client_profiles.company_name}</p>
                  </div>
                  {gig.client_profiles.contact_name && (
                    <div>
                      <p className="font-medium">Contact</p>
                      <p className="text-gray-600">{gig.client_profiles.contact_name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Application */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Apply for this Gig</CardTitle>
              <CardDescription>
                Submit your application to be considered for this opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!session ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You need to be logged in to apply for gigs.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">Sign In to Apply</Link>
                  </Button>
                </div>
              ) : hasApplied ? (
                <div className="text-center space-y-3">
                  <Badge variant="secondary" className="w-full">
                    Application Submitted
                  </Badge>
                  <p className="text-sm text-gray-600">
                    You've already applied for this gig. Check your dashboard for updates.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/talent/dashboard">View Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Ready to apply? Click below to submit your application.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/apply?gig_id=${id}`} className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Apply Now
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium">{gig.category || "General"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compensation</span>
                <span className="font-medium">${gig.compensation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{gig.location}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
