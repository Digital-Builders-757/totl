"use client";

import { CheckCircle, FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CreateTabContent() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <Plus className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-[var(--oklch-text-primary)]">Create Your Next Opportunity</h2>
        <p className="mb-8 text-[var(--oklch-text-secondary)]">
          Post a new opportunity to find the perfect talent for your project. Our platform
          connects you with qualified talent and professionals.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/40">
              <FileText className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="mb-2 font-semibold text-[var(--oklch-text-primary)]">Easy Setup</h3>
            <p className="text-sm text-[var(--oklch-text-muted)]">Fill out a simple form with your project details</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-900/40">
              <Users className="h-6 w-6 text-emerald-300" />
            </div>
            <h3 className="mb-2 font-semibold text-[var(--oklch-text-primary)]">Quality Applications</h3>
            <p className="text-sm text-[var(--oklch-text-muted)]">Receive applications from qualified talent</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/40">
              <CheckCircle className="h-6 w-6 text-sky-300" />
            </div>
            <h3 className="mb-2 font-semibold text-[var(--oklch-text-primary)]">Quick Hiring</h3>
            <p className="text-sm text-[var(--oklch-text-muted)]">Review profiles and hire the perfect match</p>
          </Card>
        </div>

        <Button size="lg" asChild>
          <Link href="/client/post-gig">
            <Plus className="mr-2 h-5 w-5" />
            Start Creating Opportunity
          </Link>
        </Button>
      </div>
    </div>
  );
}
