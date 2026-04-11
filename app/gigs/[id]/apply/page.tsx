import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyToGigForm } from "./apply-to-gig-form";
import { GigReferenceLinksSection } from "@/components/gigs/gig-reference-links-section";
import { PageShell } from "@/components/layout/page-shell";
import { SubscriptionPrompt } from "@/components/subscription-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getCategoryBadgeVariant, getCategoryLabel } from "@/lib/constants/gig-categories";
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

  return (
    <PageShell ambientTone="lifted" routeRole="talent" containerClassName="py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/gigs/${gig.id}`} className="flex items-center gap-2 text-[var(--oklch-text-secondary)]">
              <ArrowLeft className="h-4 w-4" />
              Back to Opportunity Details
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{gig.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{gig.description}</CardDescription>
                </div>
                <Badge variant={getCategoryBadgeVariant(gig.category || "")}>
                  {getCategoryLabel(gig.category || "")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[var(--oklch-text-secondary)]">Location:</span>
                  <p className="text-[var(--oklch-text-tertiary)]">{gig.location}</p>
                </div>
                <div>
                  <span className="font-medium text-[var(--oklch-text-secondary)]">Compensation:</span>
                  <p className="text-[var(--oklch-text-tertiary)]">${gig.compensation}</p>
                </div>
                {gig.date && (
                  <div>
                    <span className="font-medium text-[var(--oklch-text-secondary)]">Production Date:</span>
                    <p className="text-[var(--oklch-text-tertiary)]">
                      {new Date(gig.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {gig.application_deadline && (
                  <div>
                    <span className="font-medium text-[var(--oklch-text-secondary)]">Submission Deadline:</span>
                    <p className="text-[var(--oklch-text-tertiary)]">
                      {new Date(gig.application_deadline).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <GigReferenceLinksSection referenceLinks={gig.reference_links} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[var(--oklch-accent)]" aria-hidden />
                Submit Application
              </CardTitle>
              <CardDescription>
                Complete your application for this gig. Your profile information will be automatically
                included.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alreadyApplied ? (
                <Alert className="border-emerald-500/35 bg-emerald-500/10">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-[var(--oklch-text-secondary)]">
                    You have already applied for this gig. Check your dashboard for updates on your
                    application status.
                  </AlertDescription>
                </Alert>
              ) : hasActiveSubscription ? (
                <ApplyToGigForm gig={gig} />
              ) : (
                <div className="space-y-4" data-testid="subscription-apply-form-gate">
                  <Alert className="border-amber-400/35 bg-amber-500/10">
                    <AlertDescription className="text-[var(--oklch-text-secondary)]">
                      Subscribe to unlock applications. You can still browse gigs, but applying requires an
                      active plan.
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
    </PageShell>
  );
}
