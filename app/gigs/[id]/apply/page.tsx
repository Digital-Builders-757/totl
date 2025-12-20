import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyToGigForm } from "./apply-to-gig-form";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { GIG_PUBLIC_SELECT } from "@/lib/db/selects";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

interface ApplyToGigPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplyToGigPage({ params }: ApplyToGigPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=" + encodeURIComponent(`/gigs/${id}/apply`));
  }

  // Check if user has talent role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "talent") {
    redirect("/login?error=talent-only");
  }

  const hasActiveSubscription = profile.subscription_status === "active";
  const promptProfile = {
    role: profile.role,
    subscription_status: profile.subscription_status,
  };

  // Fetch gig details
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select(GIG_PUBLIC_SELECT)
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
    .eq("talent_id", user.id)
    .maybeSingle();

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
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="text-white hover:bg-gray-800">
              <Link href={`/gigs/${gig.id}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Gig Details
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Gig Summary Card */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">{gig.title}</CardTitle>
                    <CardDescription className="text-lg mt-2 text-gray-300">{gig.description}</CardDescription>
                  </div>
                  <Badge className={getCategoryColor(gig.category || "general")}>
                    {gig.category || "General"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-300">Location:</span>
                    <p className="text-gray-400">{gig.location}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-300">Compensation:</span>
                    <p className="text-gray-400">${gig.compensation}</p>
                  </div>
                  {gig.date && (
                    <div>
                      <span className="font-medium text-gray-300">Date:</span>
                      <p className="text-gray-400">{new Date(gig.date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Send className="h-5 w-5" />
                  Submit Application
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Complete your application for this gig. Your profile information will be
                  automatically included.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alreadyApplied ? (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      You have already applied for this gig. Check your dashboard for updates on
                      your application status.
                    </AlertDescription>
                  </Alert>
                ) : hasActiveSubscription ? (
                  <ApplyToGigForm gig={gig} />
                ) : (
                  <div className="space-y-4" data-testid="subscription-apply-form-gate">
                    <Alert className="bg-amber-500/10 border-amber-500/20">
                      <AlertDescription className="text-amber-100">
                        Subscribe to unlock applications. You can still browse gigs, but applying
                        requires an active plan.
                      </AlertDescription>
                    </Alert>
                    <SubscriptionPrompt profile={promptProfile} variant="card" context="gig-apply" />
                    <Button asChild className="w-full button-glow border-0">
                      <Link href="/talent/subscribe">View Plans</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
