"use client";

import { CheckCircle, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function GigSuccessPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const gigId = searchParams?.get("gigId") ?? null;

  useEffect(() => {
    toast({
      title: "Gig Submitted Successfully!",
      description: "Your opportunity has been submitted and is pending review.",
    });
  }, [toast]);

  if (!gigId) {
    return (
      <PageShell
        ambientTone="lifted"
        routeRole="admin"
        containerClassName="py-10 sm:py-12 lg:py-16"
      >
        <div className="mx-auto max-w-lg text-center">
          <div className="panel-frosted card-backlit rounded-2xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-6 sm:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <Clock className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Invalid Gig ID</h2>
            <p className="mt-2 text-sm text-[var(--oklch-text-secondary)] sm:text-base">
              No gig ID provided. Please submit an opportunity first.
            </p>
            <Button asChild className="mt-6">
              <Link href="/post-gig">Create New Gig</Link>
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell ambientTone="lifted" routeRole="admin" containerClassName="py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-2xl space-y-8">
          <div className="panel-frosted card-backlit rounded-2xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Your opportunity has been submitted</h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--oklch-text-secondary)]">
              Our team is reviewing your listing. Once approved, it will appear on the talent dashboard
              for submissions.
            </p>
          </div>

          <div className="panel-frosted overflow-hidden rounded-2xl border border-white/10 bg-[var(--totl-surface-glass-strong)]">
            <div className="border-b border-white/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">Summary</h2>
                <Badge className="border border-amber-500/40 bg-amber-500/15 text-amber-200">
                  <Clock className="mr-1 h-4 w-4" /> Pending Review
                </Badge>
              </div>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Gig ID: {gigId}</h3>
              <p className="text-[var(--oklch-text-secondary)]">
                Your opportunity is pending review. You can manage it anytime from the admin gigs list.
              </p>
              <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-[var(--oklch-text-tertiary)]">
                <li>You will receive an email notification once it is approved.</li>
                <li>Approved listings typically appear on the talent dashboard within 24 hours.</li>
                <li>Track applications from your client or admin dashboard.</li>
              </ul>
            </div>
          </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Link href="/admin/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/post-gig">Create Another Gig</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
