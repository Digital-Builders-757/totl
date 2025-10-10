"use client";

import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import type { Database } from "@/types/supabase";

interface ApplyToGigPageProps {
  params: Promise<{ id: string }>;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  category?: string;
  date?: string;
  image_url: string | null;
  client_id: string;
}

export default function ApplyToGigPage({ params }: ApplyToGigPageProps) {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Get params and fetch data
  const fetchData = useCallback(
    async (gigId: string) => {
      setLoading(true);
      setError("");

      if (!supabase) {
        setError("Database connection not available");
        setLoading(false);
        return;
      }

      try {
        // Get current user first
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          setError("You must be logged in to apply for gigs.");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Check if user has talent role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (profileError || !profile || profile.role !== "talent") {
          setError("Only talent users can apply for gigs.");
          setLoading(false);
          return;
        }

        // Fetch gig details
        const { data: gigData, error: gigError } = await supabase
          .from("gigs")
          .select("*")
          .eq("id", gigId)
          .eq("status", "active")
          .single();

        if (gigError || !gigData) {
          setError("Gig not found or no longer available.");
          setLoading(false);
          return;
        }

        setGig(gigData);

        // Check if user already applied
        const { data: existingApplication } = await supabase
          .from("applications")
          .select("id, status")
          .eq("gig_id", gigId)
          .eq("talent_id", currentUser.id)
          .single();

        if (existingApplication) {
          setAlreadyApplied(true);
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("An error occurred while loading the gig.");
      } finally {
        setLoading(false); // Always set loading to false
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function initialize() {
      try {
        const { id: gigId } = await params;
        await fetchData(gigId);
      } catch (error) {
        console.error("Error initializing:", error);
        setError("Failed to load application form.");
        setLoading(false);
      }
    }
    initialize();
  }, [params, fetchData]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!supabase) {
      setError("Database connection not available");
      setSubmitting(false);
      return;
    }

    try {
      if (!user || !gig) {
        setError("Missing user or gig data.");
        setSubmitting(false);
        return;
      }

      // Double-check if already applied
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id")
        .eq("gig_id", gig.id)
        .eq("talent_id", user.id)
        .single();

      if (existingApplication) {
        setAlreadyApplied(true);
        setSubmitting(false);
        return;
      }

      // Submit application
      const { error: insertError } = await supabase.from("applications").insert([
        {
          gig_id: gig.id,
          talent_id: user.id,
          status: "under_review",
          message: coverLetter.trim() || null,
        },
      ]);

      if (insertError) {
        console.error("Application insert error:", insertError);
        setError("There was an error submitting your application. Please try again.");
        setSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard with success message
      router.push("/talent/dashboard?applied=success");
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-semibold mb-2">Loading Application Form</h2>
              <p className="text-gray-600">Please wait while we load the gig details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" asChild>
                <Link href="/gigs" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to All Gigs
                </Link>
              </Button>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Gig Not Found</h2>
              <p className="text-gray-600 mb-6">
                The gig you&apos;re looking for doesn&apos;t exist or is no longer available.
              </p>
              <Button asChild>
                <Link href="/gigs">Browse Available Gigs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <form onSubmit={handleApply} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="coverLetter" className="text-sm font-medium">
                        Cover Letter (Optional)
                      </label>
                      <Textarea
                        id="coverLetter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell the client why you're perfect for this gig. Include any relevant experience, availability, or special skills..."
                        className="min-h-[120px]"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">{coverLetter.length}/1000 characters</p>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        onClick={() => router.push(`/gigs/${gig.id}`)}
                      >
                        Cancel
                      </Button>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
