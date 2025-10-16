import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyToGigForm } from "./apply-to-gig-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { createSupabaseServerComponentClient } from "@/lib/supabase-client";

interface ApplyToGigPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplyToGigPage({ params }: ApplyToGigPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerComponentClient();

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?returnUrl=" + encodeURIComponent(`/gigs/${id}/apply`));
  }

  // Check if user has talent role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile || profile.role !== "talent") {
    redirect("/login?error=talent-only");
  }

  // Fetch gig details
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (gigError || !gig) {
    notFound();
  }

  // Check if user already applied
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id, status")
    .eq("gig_id", id)
    .eq("talent_id", session.user.id)
    .single();

  const alreadyApplied = !!existingApplication;

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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href={`/gigs/${gig.id}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Gig Details
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Gig Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">{gig.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">{gig.description}</CardDescription>
                  </div>
                  <Badge className={getCategoryColor(gig.category || "general")}>
                    {gig.category || "General"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-600">{gig.location}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Compensation:</span>
                    <p className="text-gray-600">${gig.compensation}</p>
                  </div>
                  {gig.date && (
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <p className="text-gray-600">{new Date(gig.date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Submit Application
                </CardTitle>
                <CardDescription>
                  Complete your application for this gig. Your profile information will be
                  automatically included.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alreadyApplied ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have already applied for this gig. Check your dashboard for updates on
                      your application status.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ApplyToGigForm gig={gig} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
